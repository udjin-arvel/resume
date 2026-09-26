import { describe, expect, it } from "vitest";
import { parseApiError, ApiError } from "@/lib/api/client";

describe("parseApiError", () => {
  it("returns ApiError message", () => {
    expect(parseApiError(new ApiError("bad request", 400))).toBe("bad request");
  });

  it("returns axios error message", () => {
    const error = {
      isAxiosError: true,
      response: { data: { error: "unauthorized" } },
      message: "Request failed",
    };
    expect(parseApiError(error)).toBe("unauthorized");
  });
});
