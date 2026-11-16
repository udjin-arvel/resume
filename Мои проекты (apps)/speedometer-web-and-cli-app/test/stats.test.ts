import { test } from "node:test";
import assert from "node:assert/strict";

import { fmtBytes, summarize } from "../src/stats.ts";
import type { RequestResult } from "../src/types.ts";

const ok = (index: number, timeMs: number, bodyBytes: number, extra: Partial<RequestResult> = {}): RequestResult => ({
  index,
  ok: true,
  status: 200,
  timeMs,
  bodyBytes,
  headerBytes: 100,
  attempts: [{ attempt: 1, ok: true }],
  ...extra,
});

const fail = (index: number, attempts = 3): RequestResult => ({
  index,
  ok: false,
  error: "timeout",
  attempts: Array.from({ length: attempts }, (_, i) => ({ attempt: i + 1, ok: false, reason: "timeout" })),
});

test("медиана для чётного и нечётного числа запросов", () => {
  assert.equal(summarize([ok(1, 300, 1), ok(2, 100, 1), ok(3, 200, 1)]).medianMs, 200);
  assert.equal(summarize([ok(1, 100, 1), ok(2, 400, 1), ok(3, 200, 1), ok(4, 300, 1)]).medianMs, 250);
});

test("упавшие запросы не входят во время и объём, но видны в сводке", () => {
  const s = summarize([ok(1, 100, 1_000_000), fail(2), ok(3, 300, 1_000_000)]);
  assert.equal(s.success, 2);
  assert.equal(s.failed, 1);
  assert.equal(s.avgMs, 200);
  assert.equal(s.bodyBytes, 2_000_000);
  assert.equal(s.retries, 2);
});

test("скорость: тело / суммарное время, единицы по 10^6", () => {
  // 2 МБ за 1 секунду суммарно -> 2 MB/s и 16 Mbps
  const s = summarize([ok(1, 400, 1_000_000), ok(2, 600, 1_000_000)]);
  assert.equal(s.mBps, 2);
  assert.equal(s.mbps, 16);
  assert.equal(s.totalBytes, 2_000_200);
});

test("первый «холодный» запрос считается отдельно", () => {
  const s = summarize([ok(1, 900, 1), ok(2, 100, 1), ok(3, 300, 1)]);
  assert.equal(s.firstMs, 900);
  assert.equal(s.restAvgMs, 200);
  assert.equal(summarize([fail(1), ok(2, 100, 1)]).firstMs, null);
});

test("ни одного успешного запроса — нули без деления на ноль", () => {
  const s = summarize([fail(1), fail(2)]);
  assert.equal(s.avgMs, 0);
  assert.equal(s.medianMs, 0);
  assert.equal(s.mBps, 0);
  assert.equal(s.restAvgMs, null);
});

test("форматирование байт в десятичных единицах", () => {
  assert.equal(fmtBytes(999), "999 B");
  assert.equal(fmtBytes(1_500), "1.50 KB");
  assert.equal(fmtBytes(2_000_000), "2.00 MB");
});
