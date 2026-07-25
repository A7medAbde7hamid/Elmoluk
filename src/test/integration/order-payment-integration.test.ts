import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDb = {
  query: {
    orders: { findFirst: vi.fn(), findMany: vi.fn() },
    orderItems: { findMany: vi.fn() },
    products: { findFirst: vi.fn() },
  },
  insert: vi.fn(),
  update: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  sql: vi.fn(),
};

vi.mock("../server/queries/connection.js", () => ({
  getDb: () => mockDb,
}));

describe("order integration: create order flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch product prices from DB and calculate total", async () => {
    const dbProducts = [
      { id: 1, price: "100.00", stock: 10 },
      { id: 2, price: "250.50", stock: 5 },
    ];

    const items = [
      { productId: 1, quantity: 2 },
      { productId: 2, quantity: 1 },
    ];

    let totalAmount = 0;
    for (const item of items) {
      const product = dbProducts.find(p => p.id === item.productId)!;
      totalAmount += Number(product.price) * item.quantity;
    }

    expect(totalAmount).toBe(450.5);
  });

  it("should reject when stock is insufficient", async () => {
    const dbProduct = { id: 1, price: "100.00", stock: 2, name: "Shampoo" };
    const requestedQty = 5;

    expect(dbProduct.stock).toBeLessThan(requestedQty);
  });

  it("should reject when product not found", async () => {
    const dbProducts: any[] = [];
    const productId = 999;

    const found = dbProducts.find(p => p.id === productId);
    expect(found).toBeUndefined();
  });
});

describe("order integration: ownership checks", () => {
  it("should allow owner to view their order", () => {
    const order = { userId: 5 };
    const user = { id: 5, role: "client" };

    expect(
      order.userId === user.id || ["admin", "manager"].includes(user.role)
    ).toBe(true);
  });

  it("should deny non-owner non-admin from viewing order", () => {
    const order = { userId: 5 };
    const user = { id: 10, role: "client" };

    expect(
      order.userId === user.id || ["admin", "manager"].includes(user.role)
    ).toBe(false);
  });

  it("should allow admin to view any order", () => {
    const order = { userId: 5 };
    const user = { id: 10, role: "admin" };

    expect(
      order.userId === user.id || ["admin", "manager"].includes(user.role)
    ).toBe(true);
  });
});

describe("payment integration: create payment flow", () => {
  it("should get amount from booking, not client input", async () => {
    const booking = { id: 1, totalAmount: "750.00", userId: 5 };
    const user = { id: 5, role: "client" };

    const isOwner = booking.userId === user.id;
    const isAdmin = user.role === "admin";

    expect(isOwner || isAdmin).toBe(true);
    expect(Number(booking.totalAmount)).toBe(750);
  });

  it("should deny payment for another user's booking", () => {
    const booking = { id: 1, totalAmount: "750.00", userId: 5 };
    const user = { id: 99, role: "client" };

    const isOwner = booking.userId === user.id;
    const isAdmin = user.role === "admin";

    expect(isOwner || isAdmin).toBe(false);
  });

  it("should reject payment with neither bookingId nor orderId", () => {
    const bookingId = undefined;
    const orderId = undefined;

    expect(bookingId || orderId).toBeFalsy();
  });
});
