import { describe, it, expect } from "vitest";

const { getSessionCookieOptions } = await import("../../server/lib/cookies.js");

describe("cookies.ts", () => {
  describe("getSessionCookieOptions", () => {
    it("should return secure cookies for production (VERCEL env set)", () => {
      const original = process.env.VERCEL;
      process.env.VERCEL = "1";

      const headers = new Headers({ host: "elmoluk.vercel.app" });
      const opts = getSessionCookieOptions(headers);

      expect(opts.secure).toBe(true);
      expect(opts.sameSite).toBe("lax");
      expect(opts.httpOnly).toBe(true);
      expect(opts.path).toBe("/");

      process.env.VERCEL = original;
    });

    it("should return lax cookies for localhost without forwarded proto", () => {
      const original = process.env.VERCEL;
      delete process.env.VERCEL;

      const headers = new Headers({ host: "localhost:3000" });
      const opts = getSessionCookieOptions(headers);

      expect(opts.secure).toBe(false);
      expect(opts.sameSite).toBe("lax");

      process.env.VERCEL = original;
    });

    it("should return secure cookies when x-forwarded-proto is https", () => {
      const original = process.env.VERCEL;
      delete process.env.VERCEL;

      const headers = new Headers({
        host: "elmoluk.vercel.app",
        "x-forwarded-proto": "https",
      });
      const opts = getSessionCookieOptions(headers);

      expect(opts.secure).toBe(true);
      expect(opts.sameSite).toBe("lax");

      process.env.VERCEL = original;
    });

    it("should return lax cookies when x-forwarded-proto is http", () => {
      const original = process.env.VERCEL;
      delete process.env.VERCEL;

      const headers = new Headers({
        host: "elmoluk.vercel.app",
        "x-forwarded-proto": "http",
      });
      const opts = getSessionCookieOptions(headers);

      expect(opts.secure).toBe(false);
      expect(opts.sameSite).toBe("lax");

      process.env.VERCEL = original;
    });
  });
});
