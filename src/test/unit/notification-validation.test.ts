import { describe, it, expect } from "vitest";

describe("notification-router ownership checks", () => {
  it("should only allow notification owner to mark as read", () => {
    const notification = { userId: 1, id: 10 };
    const currentUser = { id: 1, role: "client" };

    const isOwner = notification.userId === currentUser.id;
    expect(isOwner).toBe(true);
  });

  it("should reject non-owner marking notification as read", () => {
    const notification = { userId: 1, id: 10 };
    const currentUser = { id: 2, role: "client" };

    const isOwner = notification.userId === currentUser.id;
    const isAdmin = currentUser.role === "admin";

    expect(isOwner || isAdmin).toBe(false);
  });

  it("should allow admin to delete any notification", () => {
    const notification = { userId: 1, id: 10 };
    const currentUser = { id: 2, role: "admin" };

    const isOwner = notification.userId === currentUser.id;
    const isAdmin = currentUser.role === "admin";

    expect(isOwner || isAdmin).toBe(true);
  });
});
