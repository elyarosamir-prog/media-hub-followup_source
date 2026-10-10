import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createMember, listCommittees, listMembers } from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
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
