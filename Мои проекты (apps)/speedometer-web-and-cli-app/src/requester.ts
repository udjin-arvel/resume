import { STATUS_CODES } from "node:http";
import { Agent, request, type Dispatcher } from "undici";
import type { AttemptLog, MeasureOptions, RequestResult } from "./types.js";

class RetryableError extends Error {}

export function createAgent(): Agent {
  return new Agent({
    connections: 1,
    pipelining: 1,
    keepAliveTimeout: 30_000,
    keepAliveMaxTimeout: 60_000,
    allowH2: false,
  });
}

function headerBytes(statusCode: number, headers: Dispatcher.ResponseData["headers"]): number {
  const reason = STATUS_CODES[statusCode] ?? "";
  let size = `HTTP/1.1 ${statusCode} ${reason}\r\n`.length;
  for (const [name, raw] of Object.entries(headers)) {
    if (raw === undefined) continue;
    const values = Array.isArray(raw) ? raw : [raw];
    for (const value of values) {
      size += name.length + 2 + String(value).length + 2;
    }
  }
  return size + 2;
}

function locationOf(headers: Dispatcher.ResponseData["headers"]): string | undefined {
  const loc = headers.location;
  if (loc === undefined) return undefined;
  return Array.isArray(loc) ? loc[0] : loc;
}

async function drain(body: Dispatcher.ResponseData["body"]): Promise<void> {
  try {
    await body.dump();
  } catch {
    body.destroy();
  }
}

async function readBody(body: Dispatcher.ResponseData["body"]): Promise<number> {
  let bodyBytes = 0;
  for await (const chunk of body) {
    bodyBytes += (chunk as Buffer).byteLength;
  }
  return bodyBytes;
}

function isAbort(err: unknown, signal: AbortSignal): boolean {
  if (signal.aborted) return true;
  const e = err as { name?: string; code?: string };
  return e?.name === "AbortError" || e?.code === "UND_ERR_ABORTED";
}

function errorMessage(err: unknown): string {
  const e = err as { code?: string; message?: string };
  if (e.code && e.code !== "UND_ERR_ABORTED") return e.code;
  return e.message || "network error";
}

async function attemptOnce(url: string, timeout: number, dispatcher: Dispatcher) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  const start = performance.now();
  try {
    let current = url;
    for (let hop = 0; hop <= 5; hop++) {
      const res = await request(current, {
        dispatcher,
        method: "GET",
        signal: ctrl.signal,
        headers: {
          "accept-encoding": "gzip, deflate, br",
          "user-agent": "speed-cli/1.0",
          accept: "*/*",
        },
      });

      if (res.statusCode >= 300 && res.statusCode < 400 && locationOf(res.headers)) {
        await drain(res.body);
        if (hop === 5) throw new Error("too many redirects");
        current = new URL(locationOf(res.headers)!, current).toString();
        continue;
      }

      if (res.statusCode >= 500 || res.statusCode === 429) {
        await drain(res.body);
        throw new RetryableError(`HTTP ${res.statusCode}`);
      }

      if (res.statusCode >= 400) {
        await drain(res.body);
        return {
          ok: false as const,
          status: res.statusCode,
          headerBytes: headerBytes(res.statusCode, res.headers),
          timeMs: performance.now() - start,
          finalUrl: current,
        };
      }

      const bodyBytes = await readBody(res.body);
      return {
        ok: true as const,
        status: res.statusCode,
        bodyBytes,
        headerBytes: headerBytes(res.statusCode, res.headers),
        timeMs: performance.now() - start,
        finalUrl: current,
      };
    }
    throw new Error("no response");
  } catch (e) {
    if (isAbort(e, ctrl.signal)) throw new RetryableError("timeout");
    if (e instanceof RetryableError) throw e;
    throw new RetryableError(errorMessage(e));
  } finally {
    clearTimeout(timer);
  }
}

/** One measured request with retries. Independent of CLI I/O. */
export async function measureRequest(o: MeasureOptions): Promise<RequestResult> {
  let url = o.url;
  if (o.cacheBust) {
    const u = new URL(url);
    u.searchParams.set("cb", `${Date.now()}-${o.index}`);
    url = u.toString();
  }

  const attempts: AttemptLog[] = [];
  const max = o.retries + 1;
  for (let a = 1; a <= max; a++) {
    try {
      const r = await attemptOnce(url, o.timeout, o.dispatcher);
      attempts.push({ attempt: a, ok: r.ok, reason: r.ok ? undefined : `HTTP ${r.status}` });
      if (!r.ok) {
        return {
          index: o.index,
          ok: false,
          status: r.status,
          attempts,
          error: `HTTP ${r.status}`,
          finalUrl: r.finalUrl,
        };
      }
      return {
        index: o.index,
        ok: true,
        status: r.status,
        timeMs: r.timeMs,
        bodyBytes: r.bodyBytes,
        headerBytes: r.headerBytes,
        finalUrl: r.finalUrl,
        attempts,
      };
    } catch (e) {
      attempts.push({ attempt: a, ok: false, reason: (e as Error).message });
    }
  }

  return {
    index: o.index,
    ok: false,
    attempts,
    error: attempts[attempts.length - 1]?.reason ?? "unknown error",
  };
}
