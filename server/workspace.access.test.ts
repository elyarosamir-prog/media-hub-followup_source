import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(user: TrpcContext["user"] = null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("workspace access", () => {
  it("requires authentication to read members", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.workspace.members()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("requires an admin to add a member", async () => {
    const caller = appRouter.createCaller(appRouterContextForUser());
    await expect(caller.workspace.createMember({ fullName: "عضو تجريبي" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

function appRouterContextForUser(): TrpcContext {
  return createContext({
    id: 12,
    openId: "member-user",
    email: "member@example.com",
    name: "Member User",
    loginMethod: "password",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  });
}
