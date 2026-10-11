import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { SESSION_COOKIE_MS, adminConfig, createSessionToken, verifyPassword } from "./_core/auth";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createMember, listCommittees, listMembers } from "./db";

// Best-effort brute-force guard. On serverless each instance has its own memory,
// so this slows guessing down but is not a hard limit.
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function clientKey(req: { headers: Record<string, unknown>; ip?: string }) {
  const fwd = req.headers["x-forwarded-for"];
  const first = typeof fwd === "string" ? fwd.split(",")[0]?.trim() : undefined;
  return first || req.ip || "unknown";
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure
      .input(z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1).max(200) }))
      .mutation(async ({ input, ctx }) => {
        const admin = adminConfig();
        if (!admin.configured) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "حساب المسؤول لسه ما اتضبطش في إعدادات السيرفر." });
        }
        const key = clientKey(ctx.req as never);
        const now = Date.now();
        const entry = attempts.get(key);
        if (entry && entry.resetAt > now && entry.count >= MAX_ATTEMPTS) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "محاولات كتير. حاول تاني بعد شوية." });
        }
        const ok = input.email === admin.email && (await verifyPassword(input.password, admin.passwordHash));
        if (!ok) {
          attempts.set(key, entry && entry.resetAt > now ? { ...entry, count: entry.count + 1 } : { count: 1, resetAt: now + WINDOW_MS });
          throw new TRPCError({ code: "UNAUTHORIZED", message: "الإيميل أو كلمة المرور غلط." });
        }
        attempts.delete(key);
        const token = await createSessionToken(admin.email, admin.name);
        ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: SESSION_COOKIE_MS });
        return { success: true } as const;
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  workspace: router({
    members: protectedProcedure.query(() => listMembers()),
    committees: protectedProcedure.query(() => listCommittees()),
    createMember: adminProcedure
      .input(z.object({
        fullName: z.string().trim().min(2).max(180),
        phone: z.string().trim().max(32).optional(),
        primaryCommitteeId: z.number().int().positive().optional(),
        secondaryCommitteeId: z.number().int().positive().optional(),
        skills: z.string().trim().max(2000).optional(),
        growthFocus: z.string().trim().max(2000).optional(),
      }))
      .mutation(({ input }) => createMember({
        fullName: input.fullName,
        phone: input.phone || null,
        primaryCommitteeId: input.primaryCommitteeId || null,
        secondaryCommitteeId: input.secondaryCommitteeId || null,
        skills: input.skills || null,
        growthFocus: input.growthFocus || null,
      })),
  }),
});

export type AppRouter = typeof appRouter;
