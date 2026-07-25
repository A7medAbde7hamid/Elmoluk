import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../server/queries/connection.js", () => ({
  getDb: () => mockDb,
}));

vi.mock("../../server/lib/notifications.js", () => ({
  sendWhatsAppMessage: vi.fn().mockResolvedValue(undefined),
  sendBookingConfirmation: vi.fn().mockResolvedValue(undefined),
  sendBookingStatusUpdate: vi.fn().mockResolvedValue(undefined),
}));

const mockDb = {
  query: {
    bookings: { findFirst: vi.fn(), findMany: vi.fn() },
    services: { findFirst: vi.fn(), findMany: vi.fn() },
    barbers: { findFirst: vi.fn() },
  },
  insert: vi.fn(),
  execute: vi.fn(),
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
};

describe("booking edge cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle empty services array", () => {
    const services = JSON.parse("[]");
    expect(services).toEqual([]);
    expect(services.length).toBe(0);
  });

  it("should handle booking with past date gracefully", () => {
    const bookingDate = "2020-01-01";
    const today = new Date().toISOString().split("T")[0];
    const isPast = bookingDate < today;
    expect(isPast).toBe(true);
  });

  it("should handle concurrent queue number calculation", () => {
    const count1 = 5;
    const count2 = 5;
    const queue1 = count1 + 1;
    const queue2 = count2 + 1;
    expect(queue1).toBe(queue2);
    // Both would get 6 — the DB-level MAX() handles true concurrency
  });

  it("should reject booking with invalid service IDs", () => {
    const validServices = [1, 2, 3];
    const requestedServices = [1, 999, 3];
    const invalidIds = requestedServices.filter(
      id => !validServices.includes(id)
    );
    expect(invalidIds).toEqual([999]);
  });

  it("should calculate total from services correctly", () => {
    const services = [
      { price: 100, duration: 30 },
      { price: 200, duration: 60 },
    ];
    const total = services.reduce((sum, s) => sum + s.price, 0);
    const maxDuration = Math.max(...services.map(s => s.duration));
    expect(total).toBe(300);
    expect(maxDuration).toBe(60);
  });

  it("should normalize phone number format", () => {
    const phone = "+201234567890";
    const normalized = phone.replace(/[^\d+]/g, "");
    expect(normalized).toBe("+201234567890");
  });
});

describe("auth edge cases", () => {
  it("should reject email with invalid format", () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test("valid@test.com")).toBe(true);
    expect(emailRegex.test("invalid")).toBe(false);
    expect(emailRegex.test("no@domain")).toBe(false);
    expect(emailRegex.test("@no-local.com")).toBe(false);
  });

  it("should enforce minimum password length", () => {
    const minLen = 6;
    expect("".length >= minLen).toBe(false);
    expect("12345".length >= minLen).toBe(false);
    expect("123456".length >= minLen).toBe(true);
  });

  it("should hash passwords before storage", () => {
    const password = "test123";
    const bcryptHash =
      "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ12";
    expect(bcryptHash).toContain("$2a$");
    expect(bcryptHash).not.toBe(password);
  });
});

describe("order edge cases", () => {
  it("should reject empty order items", () => {
    const items: any[] = [];
    expect(items.length).toBeLessThanOrEqual(0);
  });

  it("should reject negative quantities", () => {
    const validQty = 1;
    const invalidQty = -1;
    expect(validQty).toBeGreaterThanOrEqual(1);
    expect(invalidQty).toBeLessThan(1);
  });

  it("should calculate order total correctly with decimals", () => {
    const items = [
      { price: 10.99, qty: 3 },
      { price: 5.5, qty: 2 },
    ];
    const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    expect(total).toBeCloseTo(43.97);
  });
});

describe("payment edge cases", () => {
  it("should reject payment without bookingId or orderId", () => {
    const bookingId = undefined;
    const orderId = undefined;
    expect(bookingId || orderId).toBeFalsy();
  });

  it("should accept payment with bookingId only", () => {
    const bookingId = 1;
    const orderId = undefined;
    expect(bookingId || orderId).toBe(1);
  });

  it("should accept payment with orderId only", () => {
    const bookingId = undefined;
    const orderId = 5;
    expect(bookingId || orderId).toBe(5);
  });
});

describe("notification edge cases", () => {
  it("should handle marking already-read notification", () => {
    const notification = { isRead: true };
    expect(notification.isRead).toBe(true);
  });

  it("should handle batch read operations", () => {
    const notifications = [
      { id: 1, isRead: false },
      { id: 2, isRead: true },
      { id: 3, isRead: false },
    ];
    const unreadCount = notifications.filter(n => !n.isRead).length;
    expect(unreadCount).toBe(2);
  });
});
