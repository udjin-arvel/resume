/**
 * Thin client for the FastAPI backend.
 *
 * Contract: POST `${VITE_API_URL}/search` with JSON `{ "query": string }`.
 * The backend answers in one of two ways:
 *  1. Streaming NDJSON (`application/x-ndjson`), one event per line:
 *       {"type":"step","text":"меня ограбили поздно ночью, отобрали имущество"}
 *       {"type":"step","text":"нападение с угрозой насилия ..."}
 *       {"type":"result","text":"Статья 161 УК РФ ..."}
 *       {"type":"error","text":"..."}            (optional)
 *  2. Plain JSON: {"steps": string[], "result": string}
 *
 * When VITE_API_URL is not set, a local demo answer is shown instead.
 */

export type SearchEvent =
  | { type: "step"; text: string }
  | { type: "result"; text: string }
  | { type: "error"; text: string };

export const API_URL =
  (import.meta.env["VITE_API_URL"] as string | undefined)?.replace(/\/$/, "") ?? "";

/** Splits a buffer into complete NDJSON events and returns the unfinished tail. */
export function parseNdjson(buffer: string): { events: SearchEvent[]; rest: string } {
  const lines = buffer.split("\n");
  const rest = lines.pop() ?? "";
  const events: SearchEvent[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    try {
      const obj = JSON.parse(line);
      if (
        obj &&
        (obj.type === "step" || obj.type === "result" || obj.type === "error") &&
        typeof obj.text === "string"
      ) {
        events.push({ type: obj.type, text: obj.text });
      }
    } catch {
      // ignore malformed lines
    }
  }
  return { events, rest };
}

export async function searchUK(
  query: string,
  onEvent: (e: SearchEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (!API_URL) return demoSearch(query, onEvent, signal);

  const res = await fetch(`${API_URL}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
    signal: signal ?? null,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Ошибка сервера: ${res.status}`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const data = (await res.json()) as { steps?: string[]; result?: string };
    (data.steps ?? []).forEach((text) => onEvent({ type: "step", text }));
    if (data.result) onEvent({ type: "result", text: data.result });
    return;
  }

  if (!res.body) throw new Error("Пустой ответ сервера");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const { events, rest } = parseNdjson(buffer);
    buffer = rest;
    events.forEach(onEvent);
  }
  const { events } = parseNdjson(buffer + "\n");
  events.forEach(onEvent);
}

async function demoSearch(query: string, onEvent: (e: SearchEvent) => void, signal?: AbortSignal) {
  const wait = (ms: number) =>
    new Promise<void>((resolve, reject) => {
      const t = setTimeout(resolve, ms);
      signal?.addEventListener("abort", () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      });
    });
  await wait(500);
  onEvent({ type: "step", text: query });
  await wait(900);
  onEvent({
    type: "step",
    text: "открытое хищение чужого имущества; нападение с угрозой применения насилия, опасного для жизни или здоровья",
  });
  await wait(900);
  onEvent({
    type: "result",
    text: "Демо-режим (сервер не подключён). Возможные статьи: ст. 161 УК РФ «Грабёж», ст. 162 УК РФ «Разбой».",
  });
}
