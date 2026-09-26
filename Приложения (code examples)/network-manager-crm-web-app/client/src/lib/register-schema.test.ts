import { describe, expect, it } from "vitest";
import { createRegisterSchema } from "./register-schema";

const t = (key: string) => key;

describe("createRegisterSchema", () => {
  const schema = createRegisterSchema(t);

  it("accepts matching passwords", () => {
    const result = schema.safeParse({
      email: "worker@example.com",
      password: "password123",
      passwordConfirm: "password123",
      firstName: "Ivan",
      lastName: "Petrov",
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = schema.safeParse({
      email: "worker@example.com",
      password: "password123",
      passwordConfirm: "different",
      firstName: "Ivan",
      lastName: "Petrov",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("passwordConfirm"))).toBe(true);
    }
  });

  it("rejects short password", () => {
    const result = schema.safeParse({
      email: "worker@example.com",
      password: "short",
      passwordConfirm: "short",
      firstName: "Ivan",
      lastName: "Petrov",
    });
    expect(result.success).toBe(false);
  });
});
