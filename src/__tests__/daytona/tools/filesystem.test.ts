import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSandbox = vi.hoisted(() => ({
  id: "sandbox-test-123",
  fs: {
    listFiles: vi.fn(),
    downloadFile: vi.fn(),
    uploadFile: vi.fn(),
    deleteFile: vi.fn(),
  },
}));

vi.mock("@/lib/daytona/sandbox-manager", () => ({
  getOrCreateSandbox: vi.fn(() => Promise.resolve(mockSandbox)),
}));

describe("filesystem tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list_files", () => {
    it("should list files in a directory", async () => {
      const { listFiles } = await import(
        "@/lib/daytona/tools/filesystem"
      );

      mockSandbox.fs.listFiles.mockResolvedValueOnce([
        { name: "file1.txt", isDir: false, size: 100 },
        { name: "subdir", isDir: true, size: 0 },
      ]);

      const result = await listFiles.invoke({
        path: "/home/user",
        conversationId: "conv-1",
      });

      const parsed = JSON.parse(result);
      expect(parsed.files).toHaveLength(2);
      expect(parsed.files[0].name).toBe("file1.txt");
      expect(mockSandbox.fs.listFiles).toHaveBeenCalledWith("/home/user");
    });
  });

  describe("read_file", () => {
    it("should read a file and return its content", async () => {
      const { readFile } = await import(
        "@/lib/daytona/tools/filesystem"
      );

      const fileContent = Buffer.from("hello world content");
      mockSandbox.fs.downloadFile.mockResolvedValueOnce(fileContent);

      const result = await readFile.invoke({
        path: "/home/user/file.txt",
        conversationId: "conv-1",
      });

      const parsed = JSON.parse(result);
      expect(parsed.content).toBe("hello world content");
      expect(mockSandbox.fs.downloadFile).toHaveBeenCalledWith(
        "/home/user/file.txt"
      );
    });

    it("should handle file read errors", async () => {
      const { readFile } = await import(
        "@/lib/daytona/tools/filesystem"
      );

      mockSandbox.fs.downloadFile.mockRejectedValueOnce(
        new Error("File not found")
      );

      const result = await readFile.invoke({
        path: "/home/user/nonexistent.txt",
        conversationId: "conv-1",
      });

      const parsed = JSON.parse(result);
      expect(parsed.error).toContain("File not found");
    });
  });

  describe("write_file", () => {
    it("should write content to a file", async () => {
      const { writeFile } = await import(
        "@/lib/daytona/tools/filesystem"
      );

      mockSandbox.fs.uploadFile.mockResolvedValueOnce(undefined);

      const result = await writeFile.invoke({
        path: "/home/user/hello.py",
        content: "print('hello')",
        conversationId: "conv-1",
      });

      const parsed = JSON.parse(result);
      expect(parsed.success).toBe(true);
      expect(mockSandbox.fs.uploadFile).toHaveBeenCalledWith(
        expect.any(Buffer),
        "/home/user/hello.py"
      );
    });
  });

  describe("delete_file", () => {
    it("should delete a file", async () => {
      const { deleteFile } = await import(
        "@/lib/daytona/tools/filesystem"
      );

      mockSandbox.fs.deleteFile.mockResolvedValueOnce(undefined);

      const result = await deleteFile.invoke({
        path: "/home/user/old.txt",
        conversationId: "conv-1",
      });

      const parsed = JSON.parse(result);
      expect(parsed.success).toBe(true);
      expect(mockSandbox.fs.deleteFile).toHaveBeenCalledWith(
        "/home/user/old.txt",
        false
      );
    });
  });
});
