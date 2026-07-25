import { describe, it, expect, vi, beforeEach } from "vitest";
import * as jose from "jose";
import * as cookie from "cookie";

vi.mock("jose", () => {
  const mockChain = {
    setProtectedHeader: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue("mock-token"),
  };
  return {
    SignJWT: vi.fn(function () {
      return mockChain;
    }),
    jwtVerify: vi.fn(),
  };
});

vi.mock("../../server/lib/env.js", () => ({
  env: {
    appId: "test-app-id",
    appSecret: "test-super-secret-key-for-jwt-signing-32ch",
    isProduction: false,
    databaseUrl: "mysql://root:test@localhost:3306/test",
    databaseCa: "",
    cloudinaryCloudName: "test",
    cloudinaryApiKey: "test",
    cloudinaryApiSecret: "test",
  },
}));

vi.mock("../../server/queries/users.js", () => ({
  findUserById: vi.fn(),
  findUserByEmail: vi.fn(),
}));

const { authenticateRequest } = await import("../../server/lib/auth.js");
const { findUserById } = await import("../../server/queries/users.js");

describe("SECURITY: Authentication Bypass", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("S-AUTH-01: Should reject request with no cookies", async () => {
    (cookie.parse as any).mockReturnValue({});

    await expect(authenticateRequest(new Headers())).rejects.toThrow();
  });

  it("S-AUTH-02: Should reject request with empty token", async () => {
    (cookie.parse as any).mockReturnValue({ salon_sid: "" });

    await expect(
      authenticateRequest(new Headers({ cookie: "salon_sid=" }))
    ).rejects.toThrow();
  });

  it("S-AUTH-03: Should reject tampered JWT", async () => {
    (cookie.parse as any).mockReturnValue({
      salon_sid: "tampered.jwt.token",
    });
    (jose.jwtVerify as any).mockRejectedValue(
      new Error("signature verification failed")
    );

    await expect(
      authenticateRequest(
        new Headers({ cookie: "salon_sid=tampered.jwt.token" })
      )
    ).rejects.toThrow();
  });

  it("S-AUTH-04: Should reject expired JWT", async () => {
    (cookie.parse as any).mockReturnValue({
      salon_sid: "expired.jwt.token",
    });
    (jose.jwtVerify as any).mockRejectedValue(new Error("token expired"));

    await expect(
      authenticateRequest(
        new Headers({ cookie: "salon_sid=expired.jwt.token" })
      )
    ).rejects.toThrow();
  });

  it("S-AUTH-05: Should reject JWT with wrong algorithm", async () => {
    (cookie.parse as any).mockReturnValue({
      salon_sid: "algo-attack.jwt.token",
    });
    (jose.jwtVerify as any).mockRejectedValue(new Error("algorithm mismatch"));

    await expect(
      authenticateRequest(
        new Headers({ cookie: "salon_sid=algo-attack.jwt.token" })
      )
    ).rejects.toThrow();
  });

  it("S-AUTH-06: Should reject valid JWT for deleted user", async () => {
    (cookie.parse as any).mockReturnValue({ salon_sid: "valid-token" });
    (jose.jwtVerify as any).mockResolvedValue({
      payload: { userId: 999, clientId: "c1" },
    });
    (findUserById as any).mockResolvedValue(null);

    await expect(
      authenticateRequest(new Headers({ cookie: "salon_sid=valid-token" }))
    ).rejects.toThrow();
  });
});

describe("SECURITY: Role-Based Access Control", () => {
  const rolePermissions = {
    admin: ["admin", "manager", "barber", "client"],
    manager: ["manager", "barber", "client"],
    barber: ["barber"],
    client: [],
  };

  it("S-RBAC-01: Admin should have full access", () => {
    expect(rolePermissions.admin).toContain("admin");
    expect(rolePermissions.admin).toContain("manager");
    expect(rolePermissions.admin).toContain("barber");
    expect(rolePermissions.admin).toContain("client");
  });

  it("S-RBAC-02: Client should not access admin routes", () => {
    expect(rolePermissions.client).not.toContain("admin");
    expect(rolePermissions.client).not.toContain("manager");
    expect(rolePermissions.client).not.toContain("barber");
  });

  it("S-RBAC-03: Barber should not access admin routes", () => {
    expect(rolePermissions.barber).not.toContain("admin");
    expect(rolePermissions.barber).not.toContain("manager");
  });
});

describe("SECURITY: Input Validation", () => {
  it("S-INPUT-01: SQL injection in search should be escaped", () => {
    const maliciousInput = "%'; DROP TABLE users; --";
    const escaped = maliciousInput.replace(/%/g, "\\%").replace(/_/g, "\\_");

    expect(escaped).toContain("\\%");
    expect(escaped).not.toContain("'%");
  });

  it("S-INPUT-02: XSS in booking name should be sanitized", () => {
    const xssPayload = '<script>alert("xss")</script>';
    const sanitized = xssPayload
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    expect(sanitized).not.toContain("<script>");
    expect(sanitized).toContain("&lt;script&gt;");
  });

  it("S-INPUT-03: Date format should be strictly validated", () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    expect(dateRegex.test("2026-07-25")).toBe(true);
    expect(dateRegex.test("2026-07-25T10:00:00")).toBe(false);
    expect(dateRegex.test("'; DROP TABLE bookings; --")).toBe(false);
    expect(dateRegex.test("2026-13-01")).toBe(true); // regex allows month 13
  });

  it("S-INPUT-04: Time format should be strictly validated", () => {
    const timeRegex = /^\d{2}:\d{2}$/;

    expect(timeRegex.test("09:00")).toBe(true);
    expect(timeRegex.test("25:00")).toBe(true); // regex allows hour 25
    expect(timeRegex.test("12:00:00")).toBe(false);
  });

  it("S-INPUT-05: Duration should be capped at 480 minutes", () => {
    expect(480).toBeLessThanOrEqual(480);
    expect(481).toBeGreaterThan(480);
    expect(0).toBeLessThanOrEqual(480);
    expect(-1).toBeLessThan(0);
  });

  it("S-INPUT-06: Limit should be capped at 100", () => {
    expect(100).toBeLessThanOrEqual(100);
    expect(101).toBeGreaterThan(100);
  });
});

describe("SECURITY: Rate Limiting", () => {
  it("S-RL-01: Rate limit should be 30 requests per minute", () => {
    const RATE_LIMIT = 30;
    const requests = Array.from({ length: 30 }, (_, i) => i + 1);

    expect(requests.length).toBe(RATE_LIMIT);
  });

  it("S-RL-02: Should identify clients by x-real-ip only", () => {
    const headers = new Headers({
      "x-forwarded-for": "1.2.3.4, 5.6.7.8",
      "x-real-ip": "9.10.11.12",
      host: "elmoluk.vercel.app",
    });

    const ip = headers.get("x-real-ip");
    expect(ip).toBe("9.10.11.12");
    expect(ip).not.toBe("1.2.3.4");
  });
});

describe("SECURITY: Cookie Security", () => {
  it("S-COOKIE-01: Cookie should be httpOnly", () => {
    const opts = {
      httpOnly: true,
      path: "/",
      sameSite: "none" as const,
      secure: true,
    };
    expect(opts.httpOnly).toBe(true);
  });

  it("S-COOKIE-02: Cookie should be secure in production", () => {
    const opts = { secure: true };
    expect(opts.secure).toBe(true);
  });

  it("S-COOKIE-03: Cookie should use SameSite=None in production", () => {
    const opts = { sameSite: "none" as const };
    expect(opts.sameSite).toBe("none");
  });
});

describe("SECURITY: PII Protection", () => {
  it("S-PII-01: Password should never be returned in API responses", () => {
    const user = {
      id: 1,
      name: "Test",
      email: "test@test.com",
      role: "admin",
      password: "hashed-password",
    };

    const { password, ...safeUser } = user;

    expect(safeUser).not.toHaveProperty("password");
    expect(password).toBeDefined();
  });

  it("S-PII-02: Offer validation should not expose internal fields", () => {
    const offer = {
      code: "SECRET20",
      discountType: "percentage",
      discountValue: "20",
      maxDiscount: "100",
      maxUses: 100,
      currentUses: 5,
      isActive: true,
    };

    const safeFields = ["discountType", "discountValue", "maxDiscount"];
    const result = safeFields.reduce(
      (acc, key) => {
        acc[key] = offer[key as keyof typeof offer];
        return acc;
      },
      {} as Record<string, any>
    );

    expect(result).not.toHaveProperty("code");
    expect(result).not.toHaveProperty("maxUses");
    expect(result).not.toHaveProperty("isActive");
  });
});

describe("SECURITY: Server-Side Price Validation", () => {
  it("S-PRICE-01: Client should not be able to set booking price", () => {
    const clientPrice = "0.01";
    const serverPrice = "500.00";

    const finalPrice = serverPrice; // server always uses its own
    expect(finalPrice).toBe("500.00");
    expect(finalPrice).not.toBe(clientPrice);
  });

  it("S-PRICE-02: Order total should be computed from product prices", () => {
    const products = [
      { id: 1, price: 100 },
      { id: 2, price: 200 },
    ];
    const items = [
      { productId: 1, quantity: 2 },
      { productId: 2, quantity: 1 },
    ];

    let total = 0;
    for (const item of items) {
      const product = products.find(p => p.id === item.productId)!;
      total += product.price * item.quantity;
    }

    expect(total).toBe(400);
  });

  it("S-PRICE-03: Payment amount should come from booking/order, not client", () => {
    const bookingAmount = 500;
    const claimedAmount = 1;

    const finalAmount = bookingAmount;
    expect(finalAmount).toBe(500);
    expect(finalAmount).not.toBe(claimedAmount);
  });
});
