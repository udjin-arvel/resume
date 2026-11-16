import type { AttemptLog, MeasureOptions, RequestResult } from "./types";

class RetryableError extends Error {}

function headerSize(res: Response): number {
  let s = `HTTP/1.1 ${res.status} ${res.statusText}\r\n`.length;
  res.headers.forEach((v, k) => (s += k.length + 2 + v.length + 2));
  return s + 2;
}

async function attemptOnce(url: string, timeout: number) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  const start = performance.now();
  try {
    let current = url;
    let res: Response | null = null;
    for (let hop = 0; hop <= 5; hop++) {
      res = await fetch(current, { redirect: "manual", signal: ctrl.signal, headers: { "accept-encoding": "identity" } });
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        await res.body?.cancel();
        if (hop === 5) throw new Error("too many redirects");
        current = new URL(res.headers.get("location")!, current).toString();
        continue;
      }
      break;
    }
    if (!res) throw new Error("no response");
    if (res.status >= 500 || res.status === 429) {
      await res.body?.cancel();
      throw new RetryableError(`HTTP ${res.status}`);
    }
    let bodyBytes = 0;
    if (res.body) {
      const reader = res.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        bodyBytes += value.byteLength;
      }
    }
    return { res, bodyBytes, headerBytes: headerSize(res), timeMs: performance.now() - start, finalUrl: current };
  } catch (e) {
    if (ctrl.signal.aborted) throw new RetryableError("timeout");
    if (e instanceof RetryableError) throw e;
    throw new RetryableError((e as Error).message || "network error");
  } finally {
    clearTimeout(timer);
  }
}

/** Pure, environment-agnostic single measured request with retries. */
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
      const r = await attemptOnce(url, o.timeout);
      attempts.push({ attempt: a, ok: r.res.ok });
      if (!r.res.ok) {
        return { index: o.index, ok: false, status: r.res.status, attempts, error: `HTTP ${r.res.status}` };
      }
      return { index: o.index, ok: true, status: r.res.status, timeMs: r.timeMs, bodyBytes: r.bodyBytes, headerBytes: r.headerBytes, finalUrl: r.finalUrl, attempts };
    } catch (e) {
      attempts.push({ attempt: a, ok: false, reason: (e as Error).message });
    }
  }
  return { index: o.index, ok: false, attempts, error: attempts[attempts.length - 1]?.reason ?? "unknown error" };
}
