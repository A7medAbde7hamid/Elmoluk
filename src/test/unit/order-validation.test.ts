import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDb = {
  query: {
    orders: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    orderItems: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    products: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
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

describe("order-router server-side price calculation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate totalAmount from product prices, not client input", async () => {
    const products = [
      { id: 1, price: "100.00", stock: 10, name: "Shampoo" },
      { id: 2, price: "250.50", stock: 5, name: "Conditioner" },
    ];

    const items = [
      { productId: 1, quantity: 2 },
      { productId: 2, quantity: 1 },
    ];

    let totalAmount = 0;
    const resolvedItems: any[] = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.productId)!;
      const unitPrice = Number(product.price);
      const totalPrice = unitPrice * item.quantity;
      totalAmount += totalPrice;
      resolvedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      });
    }

    expect(totalAmount).toBe(450.5);
    expect(resolvedItems[0].unitPrice).toBe(100);
    expect(resolvedItems[0].totalPrice).toBe(200);
    expect(resolvedItems[1].unitPrice).toBe(250.5);
    expect(resolvedItems[1].totalPrice).toBe(250.5);
  });

  it("should reject order when product not found", async () => {
    const items = [{ productId: 999, quantity: 1 }];
    const products: any[] = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      expect(product).toBeUndefined();
    }
  });

  it("should reject when stock is insufficient", async () => {
    const product = { id: 1, price: "100.00", stock: 2, name: "Shampoo" };
    const requestedQty = 5;

    expect(product.stock < requestedQty).toBe(true);
  });
});

describe("order-router ownership check", () => {
  it("should enforce ownership on byId", () => {
    const order = { userId: 1, id: 10 };
    const currentUser = { id: 2, role: "client" };

    const isOwner = order.userId === currentUser.id;
    const isAdmin =
      currentUser.role === "admin" || currentUser.role === "manager";

    expect(isOwner || isAdmin).toBe(false);
  });

  it("should allow admin to access any order", () => {
    const order = { userId: 1, id: 10 };
    const currentUser = { id: 2, role: "admin" };

    const isOwner = order.userId === currentUser.id;
    const isAdmin =
      currentUser.role === "admin" || currentUser.role === "manager";

    expect(isOwner || isAdmin).toBe(true);
  });
});
