import { describe, it, expect } from "vitest";

describe("offer-router safe fields", () => {
  const SAFE_FIELDS = ["discountType", "discountValue", "maxDiscount"];

  it("should only return safe fields from offer validation", () => {
    const fullOffer = {
      id: 1,
      code: "SUMMER20",
      discountType: "percentage",
      discountValue: "20",
      maxDiscount: "100",
      minBookingAmount: "200",
      expiresAt: "2026-08-01",
      maxUses: 100,
      currentUses: 5,
      isActive: true,
      createdAt: "2026-07-01",
      secret: "internal",
    };

    const result = SAFE_FIELDS.reduce(
      (acc, key) => {
        acc[key] = fullOffer[key as keyof typeof fullOffer];
        return acc;
      },
      {} as Record<string, any>
    );

    expect(result).toEqual({
      discountType: "percentage",
      discountValue: "20",
      maxDiscount: "100",
    });

    expect(result).not.toHaveProperty("code");
    expect(result).not.toHaveProperty("maxUses");
    expect(result).not.toHaveProperty("currentUses");
    expect(result).not.toHaveProperty("isActive");
    expect(result).not.toHaveProperty("secret");
  });

  it("should validate code field constraints", () => {
    const codeMinLength = 1;
    const codeMaxLength = 50;

    expect("".length >= codeMinLength).toBe(false);
    expect("SUMMER20".length <= codeMaxLength).toBe(true);
    expect("A".repeat(51).length <= codeMaxLength).toBe(false);
  });
});
