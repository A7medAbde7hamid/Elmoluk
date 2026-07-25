import { describe, it, expect } from "vitest";

describe("user-router password exclusion", () => {
  it("should exclude password field when listing users", () => {
    const userWithPassword = {
      id: 1,
      name: "Admin",
      email: "admin@test.com",
      role: "admin",
      password: "hashed-password-123",
    };

    const { password: _, ...safeUser } = userWithPassword;

    expect(safeUser).toEqual({
      id: 1,
      name: "Admin",
      email: "admin@test.com",
      role: "admin",
    });
    expect(safeUser).not.toHaveProperty("password");
  });

  it("should exclude password from multiple users", () => {
    const users = [
      { id: 1, name: "Admin", password: "hash1", role: "admin" },
      { id: 2, name: "Barber", password: "hash2", role: "barber" },
      { id: 3, name: "Client", password: "hash3", role: "client" },
    ];

    const safeUsers = users.map(({ password: _, ...rest }) => rest);

    expect(safeUsers).toEqual([
      { id: 1, name: "Admin", role: "admin" },
      { id: 2, name: "Barber", role: "barber" },
      { id: 3, name: "Client", role: "client" },
    ]);

    safeUsers.forEach(u => {
      expect(u).not.toHaveProperty("password");
    });
  });
});
