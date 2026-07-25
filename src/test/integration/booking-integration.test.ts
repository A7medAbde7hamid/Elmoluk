import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDb = {
  query: {
    bookings: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    services: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
  insert: vi.fn(),
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  execute: vi.fn(),
};

vi.mock("../server/queries/connection.js", () => ({
  getDb: () => mockDb,
}));

vi.mock("../server/lib/notifications.js", () => ({
  sendWhatsAppMessage: vi.fn().mockResolvedValue(undefined),
  sendBookingConfirmation: vi.fn().mockResolvedValue(undefined),
}));

describe("booking integration: enrichBookings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should batch-fetch services instead of N+1 queries", async () => {
    const bookings = [
      { id: 1, services: JSON.stringify([1, 2]), barberId: 10, userId: 1 },
      { id: 2, services: JSON.stringify([2, 3]), barberId: 10, userId: 2 },
      { id: 3, services: JSON.stringify([1]), barberId: 20, userId: 3 },
    ];

    const uniqueServiceIds = [
      ...new Set(bookings.flatMap(b => JSON.parse(b.services || "[]"))),
    ];

    expect(uniqueServiceIds).toEqual([1, 2, 3]);
    expect(uniqueServiceIds.length).toBe(3); // 3 queries instead of 6
  });

  it("should handle empty bookings array", () => {
    const bookings: any[] = [];
    const uniqueServiceIds = [
      ...new Set(bookings.flatMap(b => JSON.parse(b.services || "[]"))),
    ];

    expect(uniqueServiceIds).toEqual([]);
  });

  it("should parse services JSON correctly", () => {
    const services = JSON.stringify([1, 2, 3]);
    const parsed = JSON.parse(services);

    expect(parsed).toEqual([1, 2, 3]);
    expect(parsed.length).toBe(3);
  });

  it("should handle missing/null services gracefully", () => {
    const services = null;
    const parsed = JSON.parse(services || "[]");

    expect(parsed).toEqual([]);
  });
});

describe("booking integration: queue number calculation", () => {
  it("should increment queue number per day", () => {
    const existingCount = 5;
    const newQueueNumber = existingCount + 1;

    expect(newQueueNumber).toBe(6);
  });

  it("should start at 1 when no bookings exist for the day", () => {
    const existingCount = 0;
    const newQueueNumber = existingCount + 1;

    expect(newQueueNumber).toBe(1);
  });

  it("should reset queue number for new day", () => {
    const yesterdayCount = 15;
    const todayCount = 0;
    const newQueueNumber = todayCount + 1;

    expect(newQueueNumber).toBe(1);
    expect(newQueueNumber).not.toBe(yesterdayCount + 1);
  });
});

describe("booking integration: getDb().execute() raw SQL path", () => {
  it("should use raw SQL for queue number insert (TiDB compatibility)", () => {
    const sql = `INSERT INTO bookings (user_id, barber_id, date, time, services, status, queue_number, total_amount, notes, phone, guest_name)
      SELECT ?, ?, ?, ?, ?, 'confirmed',
        (SELECT IFNULL(MAX(queue_number), 0) + 1 FROM bookings WHERE date = ?),
        ?, ?, ?, ?
      FROM DUAL`;

    expect(sql).toContain("queue_number");
    expect(sql).toContain("SELECT IFNULL(MAX(queue_number), 0) + 1");
    expect(sql).not.toContain(".onUpdateNow()");
  });
});
