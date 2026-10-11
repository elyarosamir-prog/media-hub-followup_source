import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";

export function createApp() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
  return app;
}
