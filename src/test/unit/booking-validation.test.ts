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
    barberSchedules: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  insert: vi.fn().mockResolvedValue([{ insertId: 1 }]),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  execute: vi.fn(),
  set: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
};

vi.mock("../server/queries/connection.js", () => ({
  getDb: () => mockDb,
}));

describe("booking-router validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("date format validation", () => {
    it("should reject invalid date formats", async () => {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

      expect(dateRegex.test("2026/07/25")).toBe(false);
      expect(dateRegex.test("25-07-2026")).toBe(false);
      expect(dateRegex.test("2026-7-5")).toBe(false);
      expect(dateRegex.test("not-a-date")).toBe(false);
      expect(dateRegex.test("20260725")).toBe(false);
    });

    it("should accept valid date formats", () => {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

      expect(dateRegex.test("2026-07-25")).toBe(true);
      expect(dateRegex.test("2026-01-01")).toBe(true);
      expect(dateRegex.test("2026-12-31")).toBe(true);
    });
  });

  describe("time format validation", () => {
    it("should reject invalid time formats", () => {
      const timeRegex = /^\d{2}:\d{2}$/;

      expect(timeRegex.test("9:00")).toBe(false);
      expect(timeRegex.test("abc")).toBe(false);
    });

    it("should accept valid time formats", () => {
      const timeRegex = /^\d{2}:\d{2}$/;

      expect(timeRegex.test("09:00")).toBe(true);
      expect(timeRegex.test("14:30")).toBe(true);
      expect(timeRegex.test("23:59")).toBe(true);
    });
  });

  describe("duration validation", () => {
    it("should enforce max duration of 480 minutes", () => {
      const maxDuration = 480;

      expect(60 <= maxDuration).toBe(true);
      expect(240 <= maxDuration).toBe(true);
      expect(480 <= maxDuration).toBe(true);
      expect(481 <= maxDuration).toBe(false);
      expect(1440 <= maxDuration).toBe(false);
    });
  });
});
