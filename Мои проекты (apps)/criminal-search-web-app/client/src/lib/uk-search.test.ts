import { describe, expect, it } from "vitest";
import { parseNdjson } from "./uk-search";

describe("parseNdjson", () => {
  it("returns complete step and result events and keeps the unfinished tail", () => {
    const buf =
      '{"type":"step","text":"a"}\n{"type":"result","text":"Статья 161"}\n{"type":"step","te';
    const { events, rest } = parseNdjson(buf);
    expect(events).toEqual([
      { type: "step", text: "a" },
      { type: "result", text: "Статья 161" },
    ]);
    expect(rest).toBe('{"type":"step","te');
  });

  it("skips malformed and unknown lines", () => {
    const { events } = parseNdjson('oops\n{"type":"other","text":"x"}\n{"type":"error","text":"e"}\n');
    expect(events).toEqual([{ type: "error", text: "e" }]);
  });
});
