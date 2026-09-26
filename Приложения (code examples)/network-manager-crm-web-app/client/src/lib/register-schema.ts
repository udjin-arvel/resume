import { z } from "zod";

export function createPasswordFieldsSchema(t: (key: string) => string) {
  return {
    password: z.string().min(8, t("auth.validation.passwordMin")),
    passwordConfirm: z.string().min(1, t("auth.validation.passwordConfirmRequired")),
  };
}

export function withPasswordConfirm<T extends { password: string; passwordConfirm: string }>(
  schema: z.ZodType<T>,
  t: (key: string) => string,
) {
  return schema.refine((data) => data.password === data.passwordConfirm, {
    message: t("auth.validation.passwordMismatch"),
    path: ["passwordConfirm"],
  });
}

export function createRegisterSchema(t: (key: string) => string) {
  return withPasswordConfirm(
    z.object({
      email: z.string().email(t("auth.validation.email")),
      ...createPasswordFieldsSchema(t),
      firstName: z.string().min(1, t("auth.validation.firstNameRequired")),
      lastName: z.string().min(1, t("auth.validation.lastNameRequired")),
      phone: z.string().optional(),
    }),
    t,
  );
}

export type RegisterFormValues = z.infer<ReturnType<typeof createRegisterSchema>>;
