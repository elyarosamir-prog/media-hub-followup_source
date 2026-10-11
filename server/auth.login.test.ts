import { beforeAll, describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { hashPassword } from "./_core/auth";
import type { TrpcContext } from "./_core/context";

function ctx(): { ctx: TrpcContext; cookies: { name: string; value: string }[] } {
  const cookies: { name: string; value: string }[] = [];
  return {
    cookies,
    ctx: {
      user: null,
      req: { protocol: "https", headers: { "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 250)}` } } as TrpcContext["req"],
      res: { cookie: (name: string, value: string) => cookies.push({ name, value }) } as unknown as TrpcContext["res"],
    },
  };
}

describe("auth.login", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret-test-secret-123456";
    process.env.ADMIN_EMAIL = "admin@example.com";
    process.env.ADMIN_PASSWORD_HASH = await hashPassword("correct horse battery");
  });

  it("accepts the configured admin and sets a session cookie", async () => {
    const { ctx: c, cookies } = ctx();
    const result = await appRouter.createCaller(c).auth.login({ email: "Admin@Example.com", password: "correct horse battery" });
    expect(result).toEqual({ success: true });
    expect(cookies).toHaveLength(1);
  });

  it("rejects a wrong password", async () => {
    const { ctx: c } = ctx();
    await expect(appRouter.createCaller(c).auth.login({ email: "admin@example.com", password: "nope" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects an unknown email", async () => {
    const { ctx: c } = ctx();
    await expect(appRouter.createCaller(c).auth.login({ email: "other@example.com", password: "correct horse battery" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
