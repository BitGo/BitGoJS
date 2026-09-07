import { setTimeout as sleep } from 'node:timers/promises';

type JsonRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null;
}

export function readString(value: unknown, field: string): string {
  if (typeof value !== 'string') throw new Error(`${field} must be a string`);
  return value;
}

export function readNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${field} must be a number`);
  return value;
}

export function readArray(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`);
  return value;
}

export type RpcLogger = (message: string) => void;

export function formatError(value: unknown): string {
  if (value instanceof Error) return value.message;
  if (isRecord(value)) {
    const code = typeof value.code === 'number' || typeof value.code === 'string' ? String(value.code) : undefined;
    if (typeof value.message === 'string') return code === undefined ? value.message : `${code}: ${value.message}`;
    if (value.error !== undefined) return formatError(value.error);
    if (typeof value.detail === 'string') return value.detail;
    try {
      return JSON.stringify(value);
    } catch {
      return '[unserializable error object]';
    }
  }
  return String(value);
}

async function parseResponse(response: Response): Promise<unknown> {
  const body = await response.text();
  let value: unknown;
  try {
    value = body.length === 0 ? undefined : JSON.parse(body);
  } catch {
    throw new Error(`Invalid JSON response from ${response.url}: ${body.slice(0, 200)}`);
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${response.url}: ${formatError(value)}`);
  }
  return value;
}

export class JsonRpcClient {
  private nextId = 1;

  public constructor(
    private readonly url: string,
    private readonly user: string,
    private readonly password: string,
    private readonly timeoutMs: number,
    private readonly logger?: RpcLogger
  ) {}

  public async call(method: string, params: readonly unknown[] = []): Promise<unknown> {
    this.logger?.(`RPC ${method} -> ${this.url}`);
    const response = await fetch(this.url, {
      method: 'POST',
      headers: {
        authorization: `Basic ${Buffer.from(`${this.user}:${this.password}`).toString('base64')}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ jsonrpc: '1.0', id: this.nextId++, method, params }),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    const value = await parseResponse(response);
    if (!isRecord(value)) throw new Error(`Invalid JSON-RPC response for ${method}`);
    if (value.error !== null && value.error !== undefined) {
      throw new Error(`Bitcoin RPC ${method} failed: ${formatError(value.error)}`);
    }
    this.logger?.(`RPC ${method} <- success`);
    return value.result;
  }
}

export class HttpJsonClient {
  private readonly baseUrl: string;

  public constructor(baseUrl: string, private readonly timeoutMs: number, private readonly logger?: RpcLogger) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  }

  public async get(path: string): Promise<unknown> {
    this.logger?.(`HTTP GET ${new URL(path, this.baseUrl).toString()}`);
    return this.request('GET', path);
  }

  public async post(path: string, body: unknown): Promise<unknown> {
    return this.request('POST', path, JSON.stringify(body), 'application/json');
  }

  public async postBytes(path: string, body: Uint8Array): Promise<unknown> {
    return this.request('POST', path, Buffer.from(body), 'application/octet-stream');
  }

  private async request(method: string, path: string, body?: BodyInit, contentType?: string): Promise<unknown> {
    const response = await fetch(new URL(path, this.baseUrl), {
      method,
      headers: contentType === undefined ? undefined : { 'content-type': contentType },
      body,
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    return parseResponse(response);
  }
}

export async function waitFor(
  description: string,
  predicate: () => Promise<boolean>,
  timeoutMs: number,
  intervalMs = 1_000
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      if (await predicate()) return;
    } catch (error) {
      lastError = error;
    }
    await sleep(intervalMs);
  }
  const suffix = lastError === undefined ? '' : `: ${formatError(lastError)}`;
  throw new Error(`Timed out waiting for ${description}${suffix}`);
}
