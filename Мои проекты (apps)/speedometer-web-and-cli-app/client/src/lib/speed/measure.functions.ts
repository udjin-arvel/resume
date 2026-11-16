import { createServerFn } from "@tanstack/react-start";
import { measureRequest } from "./requester";
import type { MeasureOptions } from "./types";

export const measureOnce = createServerFn({ method: "POST" })
  .inputValidator((d: MeasureOptions) => {
    const u = new URL(d.url);
    if (!/^https?:$/.test(u.protocol)) throw new Error("Only http/https");
    const int = (n: number, min: number, max: number) => Number.isInteger(n) && n >= min && n <= max;
    if (!int(d.timeout, 1, 120000) || !int(d.retries, 0, 10) || !int(d.index, 0, 1000)) throw new Error("Invalid numbers");
    return { url: u.toString(), timeout: d.timeout, retries: d.retries, cacheBust: !!d.cacheBust, index: d.index };
  })
  .handler(async ({ data }) => measureRequest(data));
