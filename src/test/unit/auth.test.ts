import { describe, it, expect, vi, beforeEach } from "vitest";
import * as jose from "jose";
import * as cookie from "cookie";
import { TRPCError } from "@trpc/server";

const { signSessionToken, authenticateRequest } =
  await import("../../server/lib/auth.js");
const { findUserById } = await import("../../server/queries/users.js");

describe("auth.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signSessionToken", () => {
    it("should create a JWT token with userId and clientId", async () => {
      const payload = { userId: 1, clientId: "client-abc" };
      const token = await signSessionToken(payload);

      expect(token).toBe("mock-jwt-token");
      expect(jose.SignJWT).toHaveBeenCalledWith(payload);
    });
  });

  describe("authenticateRequest", () => {
    it("should throw UNAUTHORIZED when no cookie present", async () => {
      (cookie.parse as any).mockReturnValue({});

      await expect(authenticateRequest(new Headers())).rejects.toThrow(
        TRPCError
      );
    });

    it("should throw UNAUTHORIZED when JWT verification fails", async () => {
      (cookie.parse as any).mockReturnValue({ salon_sid: "bad-token" });
      (jose.jwtVerify as any).mockRejectedValue(new Error("invalid signature"));

      await expect(
        authenticateRequest(new Headers({ cookie: "salon_sid=bad-token" }))
      ).rejects.toThrow(TRPCError);
    });

    it("should throw UNAUTHORIZED when user not found", async () => {
      (cookie.parse as any).mockReturnValue({ salon_sid: "valid-token" });
      (jose.jwtVerify as any).mockResolvedValue({
        payload: { userId: 999, clientId: "c1" },
      });
      (findUserById as any).mockResolvedValue(null);

      await expect(
        authenticateRequest(new Headers({ cookie: "salon_sid=valid-token" }))
      ).rejects.toThrow(TRPCError);
    });

    it("should return user when valid token and user exists", async () => {
      const mockUser = { id: 1, name: "Test", role: "admin" };
      (cookie.parse as any).mockReturnValue({ salon_sid: "valid-token" });
      (jose.jwtVerify as any).mockResolvedValue({
        payload: { userId: 1, clientId: "c1" },
      });
      (findUserById as any).mockResolvedValue(mockUser);

      const user = await authenticateRequest(
        new Headers({ cookie: "salon_sid=valid-token" })
      );

      expect(user).toEqual(mockUser);
    });
  });
});
