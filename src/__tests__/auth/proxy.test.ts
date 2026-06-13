import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";

function mockRequest(pathname: string, headers: Record<string, string> = {}): any {
  return {
    url: `http://localhost:3000${pathname}`,
    nextUrl: {
      pathname,
    },
    headers: new Map(Object.entries(headers)),
  };
}

describe("auth proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should allow requests from authenticated users", async () => {
    (auth.api.getSession as any).mockResolvedValueOnce({
      user: { id: "user-1", email: "test@example.com" },
    });

    const { proxy } = await import("@/proxy");
    const response = await proxy(mockRequest("/chat"));

    expect(response.status).toBe(200);
  });

  it("should redirect unauthenticated users to /auth/login", async () => {
    (auth.api.getSession as any).mockResolvedValueOnce(null);

    const { proxy } = await import("@/proxy");
    const request = mockRequest("/chat");
    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/auth/login");
  });

  it("should allow access to /auth routes without session", async () => {
    (auth.api.getSession as any).mockResolvedValueOnce(null);

    const { proxy } = await import("@/proxy");
    const request = mockRequest("/auth/login");
    const response = await proxy(request);

    expect(response.status).toBe(200);
  });

  it("should redirect unauthenticated users from static assets (matcher handles exclusion at framework level)", async () => {
    (auth.api.getSession as any).mockResolvedValueOnce(null);

    const { proxy } = await import("@/proxy");
    const request = mockRequest("/_next/static/chunk.js");
    const response = await proxy(request);

    // The middleware function itself doesn't know about the matcher —
    // Next.js applies the matcher at the router level before calling middleware.
    // So the middleware will redirect, which is expected in isolation.
    expect(response.status).toBe(307);
  });
});
