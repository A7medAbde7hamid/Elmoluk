import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { authenticateRequest } from "./lib/auth.js";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: Awaited<ReturnType<typeof authenticateRequest>>;
};

export async function createContext(
  opts: FetchCreateContextFnOptions
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  try {
    ctx.user = await authenticateRequest(opts.req.headers);
  } catch (err) {
    // Authentication is optional — log failures for visibility but don't block
    if (err && typeof err === "object" && "code" in err) {
      const e = err as { code: string; message: string };
      if (e.code !== "UNAUTHORIZED") {
        console.warn("[context] Unexpected auth error:", e.message);
      }
    }
  }
  return ctx;
}
