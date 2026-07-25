import { vi } from "vitest";

process.env.APP_ID = "test-app-id";
process.env.APP_SECRET = "test-super-secret-key-for-jwt-signing-32ch";
process.env.DATABASE_URL = "mysql://root:test@localhost:3306/salon_test";
process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
process.env.CLOUDINARY_API_KEY = "test-api-key";
process.env.CLOUDINARY_APISecret = "test-api-secret";

vi.mock("jose", () => {
  const mockChain = {
    setProtectedHeader: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue("mock-jwt-token"),
  };
  return {
    SignJWT: vi.fn(function () {
      return mockChain;
    }),
    jwtVerify: vi.fn(),
  };
});

vi.mock("cookie", () => ({
  parse: vi.fn().mockReturnValue({}),
}));

vi.mock("../../src/server/queries/connection.js", () => ({
  getDb: vi.fn(),
}));

vi.mock("../../src/server/queries/users.js", () => ({
  findUserById: vi.fn(),
  findUserByEmail: vi.fn(),
}));

vi.mock("../../src/server/lib/notifications.js", () => ({
  sendWhatsAppMessage: vi.fn().mockResolvedValue(undefined),
  sendBookingConfirmation: vi.fn().mockResolvedValue(undefined),
  sendBookingStatusUpdate: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/server/lib/env.js", () => ({
  env: {
    appId: "test-app-id",
    appSecret: "test-super-secret-key-for-jwt-signing-32ch",
    isProduction: false,
    databaseUrl: "mysql://root:test@localhost:3306/salon_test",
    databaseCa: "",
    cloudinaryCloudName: "test-cloud",
    cloudinaryApiKey: "test-api-key",
    cloudinaryApiSecret: "test-api-secret",
  },
}));
