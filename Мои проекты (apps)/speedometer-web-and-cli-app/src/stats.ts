import type { RequestResult, Summary } from "./types.js";

export function summarize(results: RequestResult[]): Summary {
  const ok = results.filter((r) => r.ok);
  const times = ok.map((r) => r.timeMs ?? 0);
  const sum = times.reduce((a, b) => a + b, 0);
  const sorted = [...times].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length === 0
      ? 0
      : sorted.length % 2
        ? (sorted[mid] ?? 0)
        : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;

  const bodyBytes = ok.reduce((a, r) => a + (r.bodyBytes ?? 0), 0);
  const headerBytes = ok.reduce((a, r) => a + (r.headerBytes ?? 0), 0);

  const first = results.find((r) => r.index === 1);
  const restOk = ok.filter((r) => r.index > 1);
  const restTimes = restOk.map((r) => r.timeMs ?? 0);

  const mBps = sum > 0 ? bodyBytes / 1e6 / (sum / 1000) : 0;

  return {
    success: ok.length,
    failed: results.length - ok.length,
    retries: results.reduce((a, r) => a + Math.max(0, r.attempts.length - 1), 0),
    avgMs: ok.length ? sum / ok.length : 0,
    medianMs: median,
    firstMs: first?.ok ? (first.timeMs ?? null) : null,
    restAvgMs: restTimes.length ? restTimes.reduce((a, b) => a + b, 0) / restTimes.length : null,
    bodyBytes,
    headerBytes,
    totalBytes: bodyBytes + headerBytes,
    mBps,
    mbps: mBps * 8,
    finalUrl: [...ok].reverse().find((r) => r.finalUrl)?.finalUrl,
  };
}

export function fmtBytes(b: number): string {
  if (b >= 1e6) return `${(b / 1e6).toFixed(2)} MB`;
  if (b >= 1e3) return `${(b / 1e3).toFixed(2)} KB`;
  return `${b} B`;
}

export function fmtSec(ms: number): string {
  return `${(ms / 1000).toFixed(3)} s`;
}

function formatOk(r: RequestResult): string {
  const body = fmtBytes(r.bodyBytes ?? 0);
  const headers = fmtBytes(r.headerBytes ?? 0);
  const total = fmtBytes((r.bodyBytes ?? 0) + (r.headerBytes ?? 0));
  return `OK   ${r.status}  ${fmtSec(r.timeMs ?? 0)}  body ${body}  headers ${headers}  total ${total}  (wire, no decompress)`;
}

export function formatRequestLine(r: RequestResult, maxAttempts: number): string {
  const tag = `#${r.index}`;
  const failedAttempts = r.attempts.filter((a) => !a.ok);

  if (r.ok) {
    const okPart = formatOk(r);
    if (failedAttempts.length === 0) return `${tag}  ${okPart}`;
    const retries = failedAttempts.map((a) => `RETRY (${a.reason ?? "error"})`).join(" -> ");
    const last = r.attempts[r.attempts.length - 1];
    return `${tag}  ${retries} -> attempt ${last?.attempt ?? maxAttempts}/${maxAttempts} ${okPart}`;
  }

  const reason = r.error ?? failedAttempts.at(-1)?.reason ?? "unknown";
  return `${tag} FAIL (${reason}) after ${r.attempts.length} attempts`;
}

export function formatSummary(url: string, s: Summary): string {
  const first = s.firstMs == null ? "—" : fmtSec(s.firstMs);
  const rest = s.restAvgMs == null ? "—" : fmtSec(s.restAvgMs);
  return [
    "",
    "--- summary ---",
    `url:        ${url}`,
    `final url:  ${s.finalUrl ?? "—"}`,
    `ok / fail:  ${s.success} / ${s.failed}`,
    `retries:    ${s.retries}`,
    `avg:        ${fmtSec(s.avgMs)}`,
    `median:     ${fmtSec(s.medianMs)}`,
    `first:      ${first}`,
    `rest avg:   ${rest}`,
    `body:       ${fmtBytes(s.bodyBytes)}`,
    `headers:    ${fmtBytes(s.headerBytes)}`,
    `total:      ${fmtBytes(s.totalBytes)}`,
    `speed:      ${s.mBps.toFixed(3)} MB/s  |  ${s.mbps.toFixed(3)} Mbps`,
  ].join("\n");
}
