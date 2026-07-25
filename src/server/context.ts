import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "../../db/schema.js";
import { authenticateRequest } from "./lib/auth.js";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  try {
    ctx.user = await authenticateRequest(opts.req.headers);
  } catch (err) {
    // Authentication is optional — log failures for visibility but don't block
    if (err && typeof err === "object" && "code" in err && (err as any).code !== "UNAUTHORIZED") {
      console.warn("[context] Unexpected auth error:", (err as any).message);
    }
  }
  return ctx;
}
