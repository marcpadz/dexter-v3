import { describe, it, expect, vi } from "vitest";
import { signUp, signIn, signOut } from "@/lib/server/actions/auth";
import { auth } from "@/lib/auth";

// Mock auth api
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      signUpEmail: vi.fn(),
      signInEmail: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(() => new Headers()),
}));

describe("Auth Actions", () => {
  it("should sign up successfully", async () => {
    const mockUser = { id: "1", email: "test@example.com" };
    (auth.api.signUpEmail as any).mockResolvedValueOnce(mockUser);

    const result = await signUp("test@example.com", "password123", "Test User");

    expect(auth.api.signUpEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        body: {
          email: "test@example.com",
          password: "password123",
          name: "Test User",
        },
      }),
    );
    expect(result).toEqual({ success: true, user: mockUser });
  });

  it("should handle sign up error", async () => {
    (auth.api.signUpEmail as any).mockRejectedValueOnce(
      new Error("Email already exists"),
    );

    const result = await signUp("test@example.com", "password123", "Test User");

    expect(result).toEqual({ error: "Email already exists" });
  });

  it("should sign in successfully", async () => {
    const mockSession = { token: "123" };
    (auth.api.signInEmail as any).mockResolvedValueOnce(mockSession);

    const result = await signIn("test@example.com", "password123");

    expect(auth.api.signInEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { email: "test@example.com", password: "password123" },
      }),
    );
    expect(result).toEqual({ success: true, session: mockSession });
  });

  it("should sign out successfully", async () => {
    (auth.api.signOut as any).mockResolvedValueOnce(undefined);

    const result = await signOut();

    expect(auth.api.signOut).toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });
});
