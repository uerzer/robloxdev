/**
 * MCP client over SSE transport.
 * Connects to a supergateway bridge exposed via cloudflare tunnel.
 * Protocol: GET /sse → endpoint event → POST JSON-RPC to that endpoint.
 */

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties?: Record<string, { type?: string; description?: string; enum?: string[] }>;
    required?: string[];
  };
}

export interface MCPResult {
  content?: { type: string; text?: string }[];
  isError?: boolean;
  error?: { message: string };
}

export type ConnectionState = "idle" | "connecting" | "connected" | "error";

export class MCPClient {
  private eventSource: EventSource | null = null;
  private endpoint: string | null = null;
  private baseUrl: string;
  private requestId = 0;
  private pending = new Map<number, { resolve: (v: any) => void; reject: (e: Error) => void }>();
  private _state: ConnectionState = "idle";
  private _tools: MCPTool[] = [];
  private _studioId: string | null = null;
  private onStateChange?: (s: ConnectionState) => void;
  private onToolsChange?: (t: MCPTool[]) => void;
  private onLog?: (msg: string, kind: "info" | "ok" | "err" | "cmd") => void;

  get state() { return this._state; }
  get tools() { return this._tools; }
  get studioId() { return this._studioId; }

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  setCallbacks(cbs: {
    onStateChange?: (s: ConnectionState) => void;
    onToolsChange?: (t: MCPTool[]) => void;
    onLog?: (msg: string, kind: "info" | "ok" | "err" | "cmd") => void;
  }) {
    this.onStateChange = cbs.onStateChange;
    this.onToolsChange = cbs.onToolsChange;
    this.onLog = cbs.onLog;
  }

  private setState(s: ConnectionState) {
    this._state = s;
    this.onStateChange?.(s);
  }

  private log(msg: string, kind: "info" | "ok" | "err" | "cmd" = "info") {
    this.onLog?.(msg, kind);
  }

  async connect(): Promise<void> {
    this.setState("connecting");
    this.log(`connecting to ${this.baseUrl}/sse`, "cmd");

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.setState("error");
        this.log("connection timed out (30s)", "err");
        reject(new Error("Connection timed out"));
      }, 30000);

      try {
        this.eventSource = new EventSource(`${this.baseUrl}/sse`);
      } catch (e) {
        clearTimeout(timeout);
        this.setState("error");
        this.log(`failed to open SSE: ${(e as Error).message}`, "err");
        reject(e);
        return;
      }

      this.eventSource.addEventListener("endpoint", (event: MessageEvent) => {
        clearTimeout(timeout);
        const path = event.data;
        // The endpoint is relative to the SSE URL
        if (path.startsWith("/")) {
          this.endpoint = `${this.baseUrl}${path}`;
        } else {
          this.endpoint = `${this.baseUrl}/${path}`;
        }
        this.log(`endpoint received: ${path}`, "ok");
        this.init().then(resolve).catch(reject);
      });

      this.eventSource.onerror = () => {
        clearTimeout(timeout);
        if (this._state === "connecting") {
          this.setState("error");
          this.log("SSE connection failed — check tunnel URL and CORS", "err");
          reject(new Error("SSE connection failed"));
        } else if (this._state === "connected") {
          this.log("connection lost", "err");
          this.setState("error");
        }
      };

      this.eventSource.onopen = () => {
        this.log("SSE stream open, waiting for endpoint…", "info");
      };
    });
  }

  private async init() {
    this.log("sending initialize…", "cmd");
    const initResult = await this.request("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "roblox-mcp-bridge", version: "1.0.0" },
    });
    this.log(`server: ${initResult.serverInfo?.name ?? "roblox-studio"}`, "ok");

    await this.request("notifications/initialized", {});
    this.log("initialized ✓", "ok");

    // List tools
    const toolsResult = await this.request("tools/list", {});
    this._tools = toolsResult.tools ?? [];
    this.onToolsChange?.(this._tools);
    this.log(`${this._tools.length} tools available`, "ok");

    // Try to discover studio instance
    try {
      const studios = await this.callTool("list_roblox_studios", {});
      const text = studios.content?.[0]?.text;
      if (text) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this._studioId = parsed[0].studio_id ?? parsed[0].studioId ?? null;
          this.log(`studio: ${parsed[0].name ?? this._studioId}`, "ok");
        }
      }
    } catch {
      this.log("no studio instances detected yet", "info");
    }

    this.setState("connected");
  }

  private request(method: string, params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.endpoint) {
        reject(new Error("No endpoint"));
        return;
      }
      const id = ++this.requestId;
      this.pending.set(id, { resolve, reject });

      const body = { jsonrpc: "2.0", id, method, params };
      this.log(`→ ${method}`, "cmd");

      fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
        .then(async (res) => {
          if (!res.ok) {
            const text = await res.text();
            throw new Error(`HTTP ${res.status}: ${text}`);
          }
          // For notifications (no id), no response expected
          if (method.startsWith("notifications/")) {
            resolve({});
            return;
          }
          // Response comes via SSE
        })
        .catch((e) => {
          this.pending.delete(id);
          reject(e);
        });

      // Listen for response on SSE
      const handler = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.id === id) {
            this.eventSource?.removeEventListener("message", handler);
            this.pending.delete(id);
            if (msg.error) {
              this.log(`← error: ${msg.error.message}`, "err");
              reject(new Error(msg.error.message));
            } else {
              this.log(`← ${method} ok`, "ok");
              resolve(msg.result);
            }
          }
        } catch {
          // ignore parse errors
        }
      };
      this.eventSource?.addEventListener("message", handler);

      // Timeout for individual requests
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          this.eventSource?.removeEventListener("message", handler);
          reject(new Error(`Request ${method} timed out`));
        }
      }, 15000);
    });
  }

  async callTool(name: string, args: Record<string, any>): Promise<MCPResult> {
    if (this._studioId && !args.studio_id) {
      args = { ...args, studio_id: this._studioId };
    }
    this.log(`calling ${name}…`, "cmd");
    const result = await this.request("tools/call", { name, arguments: args });
    return result;
  }

  disconnect() {
    this.eventSource?.close();
    this.eventSource = null;
    this.endpoint = null;
    this.pending.clear();
    this.setState("idle");
    this.log("disconnected", "info");
  }
}
