import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSandbox = vi.hoisted(() => ({
  id: "sandbox-test-123",
  start: vi.fn(),
  stop: vi.fn(),
  delete: vi.fn(),
  getWorkDir: vi.fn(),
  state: "started",
}));

const mockDaytonaClient = vi.hoisted(() => ({
  create: vi.fn(() => Promise.resolve(mockSandbox)),
  get: vi.fn(() => Promise.resolve(mockSandbox)),
}));

vi.mock("@/lib/daytona/client", () => ({
  getDaytonaClient: () => mockDaytonaClient,
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
  },
}));

describe("sandbox-manager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("should create a new sandbox when none exists", async () => {
    const { getOrCreateSandbox } = await import(
      "@/lib/daytona/sandbox-manager"
    );

    const result = await getOrCreateSandbox("conv-1");

    expect(mockDaytonaClient.create).toHaveBeenCalledWith(
      expect.objectContaining({
        language: "python",
        autoStopInterval: 15,
        autoArchiveInterval: 1440,
        autoDeleteInterval: 10080,
      })
    );
    expect(result.id).toBe("sandbox-test-123");
  });

  it("should reuse a cached sandbox", async () => {
    const { getOrCreateSandbox } = await import(
      "@/lib/daytona/sandbox-manager"
    );

    // First call creates
    await getOrCreateSandbox("conv-2");
    // Second call should reuse cache
    const result = await getOrCreateSandbox("conv-2");

    expect(result.id).toBe("sandbox-test-123");
    expect(mockDaytonaClient.create).toHaveBeenCalledTimes(1);
    expect(mockSandbox.getWorkDir).toHaveBeenCalled();
  });

  it("should stop a sandbox", async () => {
    const { stopSandbox, getOrCreateSandbox } = await import(
      "@/lib/daytona/sandbox-manager"
    );

    // Create so it's cached
    await getOrCreateSandbox("conv-stop");
    await stopSandbox("conv-stop");

    expect(mockSandbox.stop).toHaveBeenCalled();
  });

  it("should delete a sandbox", async () => {
    const { deleteSandbox, getOrCreateSandbox } = await import(
      "@/lib/daytona/sandbox-manager"
    );

    await getOrCreateSandbox("conv-delete");
    await deleteSandbox("conv-delete");

    expect(mockSandbox.delete).toHaveBeenCalled();
  });

  it("should recover from cache errors and create new sandbox", async () => {
    mockSandbox.getWorkDir.mockRejectedValueOnce(
      new Error("Sandbox not found")
    );

    const { getOrCreateSandbox } = await import(
      "@/lib/daytona/sandbox-manager"
    );

    const result = await getOrCreateSandbox("conv-error");

    expect(mockDaytonaClient.create).toHaveBeenCalled();
    expect(result.id).toBe("sandbox-test-123");
  });
});
