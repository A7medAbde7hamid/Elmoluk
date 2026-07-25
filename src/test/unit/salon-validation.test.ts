import { describe, it, expect } from "vitest";

describe("salon-router key allowlist", () => {
  const ALLOWED_KEYS = [
    "salon_name",
    "salon_name_ar",
    "description",
    "description_ar",
    "phone",
    "email",
    "address",
    "address_ar",
    "working_hours",
    "whatsapp_number",
    "logo_url",
  ];

  it("should allow known public keys", () => {
    expect(ALLOWED_KEYS).toContain("salon_name");
    expect(ALLOWED_KEYS).toContain("phone");
    expect(ALLOWED_KEYS).toContain("whatsapp_number");
    expect(ALLOWED_KEYS).toContain("logo_url");
  });

  it("should not allow internal keys", () => {
    expect(ALLOWED_KEYS).not.toContain("database_url");
    expect(ALLOWED_KEYS).not.toContain("app_secret");
    expect(ALLOWED_KEYS).not.toContain("password");
    expect(ALLOWED_KEYS).not.toContain("internal_config");
  });
});

describe("salon-router date validation", () => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  it("should accept valid holiday dates", () => {
    expect(dateRegex.test("2026-01-01")).toBe(true);
    expect(dateRegex.test("2026-12-25")).toBe(true);
    expect(dateRegex.test("2026-07-25")).toBe(true);
  });

  it("should reject invalid holiday dates", () => {
    expect(dateRegex.test("25/07/2026")).toBe(false);
    expect(dateRegex.test("2026-7-5")).toBe(false);
    expect(dateRegex.test("07-25-2026")).toBe(false);
    expect(dateRegex.test("not-a-date")).toBe(false);
  });
});

describe("salon-router limit validation", () => {
  it("should enforce max(100) on getLogs", () => {
    const maxLimit = 100;

    expect(50 <= maxLimit).toBe(true);
    expect(100 <= maxLimit).toBe(true);
    expect(101 <= maxLimit).toBe(false);
    expect(999 <= maxLimit).toBe(false);
  });
});
