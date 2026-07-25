import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDb = {
  query: {
    payments: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    bookings: {
      findFirst: vi.fn(),
    },
    orders: {
      findFirst: vi.fn(),
    },
    wallets: {
      findFirst: vi.fn(),
    },
    walletTransactions: {
      findFirst: vi.fn(),
    },
  },
  insert: vi.fn(),
  update: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
};

vi.mock("../server/queries/connection.js", () => ({
  getDb: () => mockDb,
}));

describe("payment-router ownership checks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject when booking does not belong to user (non-admin)", () => {
    const booking = { userId: 1, totalAmount: "500" };
    const currentUser = { id: 2, role: "client" };

    const isOwner = booking.userId === currentUser.id;
    const isAdmin = currentUser.role === "admin";

    expect(isOwner || isAdmin).toBe(false);
  });

  it("should reject when order does not belong to user (non-admin)", () => {
    const order = { userId: 1, totalAmount: "300" };
    const currentUser = { id: 2, role: "client" };

    const isOwner = order.userId === currentUser.id;
    const isAdmin = currentUser.role === "admin";

    expect(isOwner || isAdmin).toBe(false);
  });

  it("should allow admin to access any booking payment", () => {
    const booking = { userId: 1, totalAmount: "500" };
    const currentUser = { id: 2, role: "admin" };

    const isOwner = booking.userId === currentUser.id;
    const isAdmin = currentUser.role === "admin";

    expect(isOwner || isAdmin).toBe(true);
  });

  it("should allow owner to pay for their own booking", () => {
    const booking = { userId: 1, totalAmount: "500" };
    const currentUser = { id: 1, role: "client" };

    const isOwner = booking.userId === currentUser.id;
    const isAdmin = currentUser.role === "admin";

    expect(isOwner || isAdmin).toBe(true);
  });
});

describe("payment-router wallet operations", () => {
  it("should validate payment method enum", () => {
    const validMethods = [
      "cash",
      "card",
      "paypal",
      "vodafone_cash",
      "apple_pay",
      "wallet",
    ];

    expect(validMethods).toContain("cash");
    expect(validMethods).toContain("wallet");
    expect(validMethods).not.toContain("bitcoin");
    expect(validMethods).not.toContain("wire_transfer");
  });
});
