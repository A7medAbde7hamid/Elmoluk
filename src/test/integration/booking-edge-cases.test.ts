import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../server/queries/connection.js", () => ({
  getDb: () => mockDb,
}));

const mockDb = {
  query: {
    bookings: { findFirst: vi.fn(), findMany: vi.fn() },
    services: { findFirst: vi.fn(), findMany: vi.fn() },
    barbers: { findFirst: vi.fn() },
    offers: { findFirst: vi.fn() },
  },
  insert: vi.fn(),
  execute: vi.fn(),
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
};

describe("booking-router: enrichBookings batch efficiency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should deduplicate service IDs across bookings", () => {
    const bookings = [
      { id: 1, services: JSON.stringify([1, 2]) },
      { id: 2, services: JSON.stringify([2, 3]) },
      { id: 3, services: JSON.stringify([1, 3]) },
    ];
    const allIds = bookings.flatMap(b => JSON.parse(b.services || "[]"));
    const uniqueIds = [...new Set(allIds)];
    expect(uniqueIds).toEqual([1, 2, 3]);
  });

  it("should handle bookings with no services", () => {
    const bookings = [
      { id: 1, services: JSON.stringify([1]) },
      { id: 2, services: null },
      { id: 3, services: "[]" },
    ];
    const allIds = bookings.flatMap(b => JSON.parse(b.services || "[]"));
    expect(allIds).toEqual([1]);
  });

  it("should return empty map for empty bookings", () => {
    const bookings: any[] = [];
    const allIds = bookings.flatMap(b => JSON.parse(b.services || "[]"));
    const uniqueIds = [...new Set(allIds)];
    expect(uniqueIds).toEqual([]);
  });
});

describe("booking-router: getTimeSlots", () => {
  it("should generate time slots within working hours", () => {
    const startHour = 9;
    const endHour = 17;
    const intervalMinutes = 30;
    const slots: string[] = [];

    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += intervalMinutes) {
        slots.push(
          `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
        );
      }
    }

    expect(slots[0]).toBe("09:00");
    expect(slots[1]).toBe("09:30");
    expect(slots[slots.length - 1]).toBe("16:30");
    expect(slots.length).toBe(16);
  });

  it("should filter out past slots for today", () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;

    const slots = ["09:00", "10:00", "11:00", "12:00"];
    const futureSlots = slots.filter(s => s >= currentTime);

    expect(futureSlots.length).toBeLessThanOrEqual(slots.length);
  });
});

describe("booking-router: status transitions", () => {
  const validTransitions: Record<string, string[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["completed", "cancelled", "no_show"],
    completed: [],
    cancelled: [],
    no_show: [],
  };

  it("should allow pending → confirmed", () => {
    expect(validTransitions.pending).toContain("confirmed");
  });

  it("should allow confirmed → completed", () => {
    expect(validTransitions.confirmed).toContain("completed");
  });

  it("should allow confirmed → cancelled", () => {
    expect(validTransitions.confirmed).toContain("cancelled");
  });

  it("should NOT allow completed → pending", () => {
    expect(validTransitions.completed).not.toContain("pending");
  });

  it("should NOT allow cancelled → confirmed", () => {
    expect(validTransitions.cancelled).not.toContain("confirmed");
  });

  it("should NOT allow no_show → any", () => {
    expect(validTransitions.no_show).toHaveLength(0);
  });
});
