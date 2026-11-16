import type { RequestResult, Summary } from "./types";

export function summarize(results: RequestResult[]): Summary {
  const ok = results.filter((r) => r.ok);
  const times = ok.map((r) => r.timeMs ?? 0);
  const sum = times.reduce((a, b) => a + b, 0);
  const sorted = [...times].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length === 0 ? 0 : sorted.length % 2 ? (sorted[mid] ?? 0) : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
  const bodyBytes = ok.reduce((a, r) => a + (r.bodyBytes ?? 0), 0);
  const headerBytes = ok.reduce((a, r) => a + (r.headerBytes ?? 0), 0);
  const rest = times.slice(1);
  const mBps = sum > 0 ? bodyBytes / 1e6 / (sum / 1000) : 0;
  return {
    success: ok.length,
    failed: results.length - ok.length,
    retries: results.reduce((a, r) => a + Math.max(0, r.attempts.length - 1), 0),
    avgMs: ok.length ? sum / ok.length : 0,
    medianMs: median,
    firstMs: times[0] ?? null,
    restAvgMs: rest.length ? rest.reduce((a, b) => a + b, 0) / rest.length : null,
    bodyBytes,
    headerBytes,
    totalBytes: bodyBytes + headerBytes,
    mBps,
    mbps: mBps * 8,
    finalUrl: ok[ok.length - 1]?.finalUrl,
  };
}

export const fmtBytes = (b: number) =>
  b >= 1e6 ? `${(b / 1e6).toFixed(2)} MB` : b >= 1e3 ? `${(b / 1e3).toFixed(2)} KB` : `${b} B`;
export const fmtSec = (ms: number) => `${(ms / 1000).toFixed(3)} s`;
