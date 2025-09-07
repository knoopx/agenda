import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createClient } from "webdav";
import { WebDAVService } from "./webdav";

// Mock the webdav client
vi.mock("webdav", () => ({
  createClient: vi.fn(),
}));

describe("WebDAVService", () => {
  let service: WebDAVService;
  let mockClient: any;

  beforeEach(() => {
    // Reset the singleton instance
    (WebDAVService as any).instance = null;
    service = new WebDAVService();

    mockClient = {
      getDirectoryContents: vi.fn(),
      putFileContents: vi.fn(),
      getFileContents: vi.fn(),
      stat: vi.fn(),
      createDirectory: vi.fn(),
    };

    (createClient as any).mockReturnValue(mockClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("configure", () => {
    it("should configure the client with provided credentials", () => {
      const config = {
        url: "https://example.com/webdav/",
        username: "testuser",
        password: "testpass",
      };

      service.configure(config);

      expect(createClient).toHaveBeenCalledWith(config.url, {
        username: config.username,
        password: config.password,
      });
      expect(service.isConfigured()).toBe(true);
    });
  });

  describe("testConnection", () => {
    it("should return true when connection is successful", async () => {
      service.configure({
        url: "https://example.com/webdav/",
        username: "testuser",
        password: "testpass",
      });

      mockClient.getDirectoryContents.mockResolvedValue([]);

      const result = await service.testConnection();

      expect(result).toBe(true);
      expect(mockClient.getDirectoryContents).toHaveBeenCalledWith("/");
    });

    it("should return false when connection fails", async () => {
      service.configure({
        url: "https://example.com/webdav/",
        username: "testuser",
        password: "testpass",
      });

      mockClient.getDirectoryContents.mockRejectedValue(
        new Error("Connection failed"),
      );

      const result = await service.testConnection();

      expect(result).toBe(false);
    });

    it("should throw error when client is not configured", async () => {
      await expect(service.testConnection()).rejects.toThrow(
        "WebDAV client not configured",
      );
    });
  });

  describe("uploadData", () => {
    it("should upload data successfully", async () => {
      service.configure({
        url: "https://example.com/webdav/",
        username: "testuser",
        password: "testpass",
      });

      const testData = '{"test": "data"}';
      mockClient.putFileContents.mockResolvedValue(undefined);

      await service.uploadData(testData);

      expect(mockClient.putFileContents).toHaveBeenCalledWith(
        ".agenda/tasks.json",
        testData,
        {
          overwrite: true,
          contentLength: testData.length,
        },
      );
    });

    it("should create directory if it does not exist", async () => {
      service.configure({
        url: "https://example.com/webdav/",
        username: "testuser",
        password: "testpass",
      });

      const testData = '{"test": "data"}';
      mockClient.createDirectory.mockResolvedValue(undefined);
      mockClient.putFileContents.mockResolvedValue(undefined);

      await service.uploadData(testData);

      expect(mockClient.createDirectory).toHaveBeenCalledWith(".agenda", {
        recursive: true,
      });
      expect(mockClient.putFileContents).toHaveBeenCalledWith(
        ".agenda/tasks.json",
        testData,
        {
          overwrite: true,
          contentLength: testData.length,
        },
      );
    });

    it("should throw error when client is not configured", async () => {
      await expect(service.uploadData("test")).rejects.toThrow(
        "WebDAV client not configured",
      );
    });

    it("should throw error when upload fails", async () => {
      service.configure({
        url: "https://example.com/webdav/",
        username: "testuser",
        password: "testpass",
      });

      mockClient.putFileContents.mockRejectedValue(new Error("Upload failed"));

      await expect(service.uploadData("test")).rejects.toThrow(
        "Upload failed: Upload failed",
      );
    });
  });

  describe("downloadData", () => {
    it("should download data successfully", async () => {
      service.configure({
        url: "https://example.com/webdav/",
        username: "testuser",
        password: "testpass",
      });

      const testData = '{"test": "data"}';
      mockClient.getFileContents.mockResolvedValue(testData);

      const result = await service.downloadData();

      expect(result).toBe(testData);
      expect(mockClient.getFileContents).toHaveBeenCalledWith(
        ".agenda/tasks.json",
        { format: "text" },
      );
    });

    it("should throw error when client is not configured", async () => {
      await expect(service.downloadData()).rejects.toThrow(
        "WebDAV client not configured",
      );
    });

    it("should throw error when download fails", async () => {
      service.configure({
        url: "https://example.com/webdav/",
        username: "testuser",
        password: "testpass",
      });

      mockClient.getFileContents.mockRejectedValue(
        new Error("Download failed"),
      );

      await expect(service.downloadData()).rejects.toThrow(
        "Download failed: Download failed",
      );
    });
  });

  describe("getLastModified", () => {
    it("should return last modified date when file exists", async () => {
      service.configure({
        url: "https://example.com/webdav/",
        username: "testuser",
        password: "testpass",
      });

      const mockDate = new Date("2024-01-01T00:00:00Z");
      mockClient.stat.mockResolvedValue({ lastmod: mockDate.toISOString() });

      const result = await service.getLastModified();

      expect(result).toEqual(mockDate);
    });

    it("should return null when file does not exist", async () => {
      service.configure({
        url: "https://example.com/webdav/",
        username: "testuser",
        password: "testpass",
      });

      mockClient.stat.mockRejectedValue(new Error("File not found"));

      const result = await service.getLastModified();

      expect(result).toBeNull();
    });

    it("should return null when lastmod is not available", async () => {
      service.configure({
        url: "https://example.com/webdav/",
        username: "testuser",
        password: "testpass",
      });

      mockClient.stat.mockResolvedValue({});

      const result = await service.getLastModified();

      expect(result).toBeNull();
    });
  });

  describe("fileExists", () => {
    it("should return true when file exists", async () => {
      service.configure({
        url: "https://example.com/webdav/",
        username: "testuser",
        password: "testpass",
      });

      mockClient.stat.mockResolvedValue({});

      const result = await service.fileExists();

      expect(result).toBe(true);
    });

    it("should return false when file does not exist", async () => {
      service.configure({
        url: "https://example.com/webdav/",
        username: "testuser",
        password: "testpass",
      });

      mockClient.stat.mockRejectedValue(new Error("File not found"));

      const result = await service.fileExists();

      expect(result).toBe(false);
    });
  });

  describe("ensureDirectoryExists", () => {
    it("should create directory successfully", async () => {
      service.configure({
        url: "https://example.com/webdav/",
        username: "testuser",
        password: "testpass",
      });

      mockClient.createDirectory.mockResolvedValue(undefined);

      await service.ensureDirectoryExists(".agenda");

      expect(mockClient.createDirectory).toHaveBeenCalledWith(".agenda", {
        recursive: true,
      });
    });

    it("should not throw error if directory already exists", async () => {
      service.configure({
        url: "https://example.com/webdav/",
        username: "testuser",
        password: "testpass",
      });

      mockClient.createDirectory.mockRejectedValue(
        new Error("Directory exists"),
      );

      // Should not throw
      await expect(
        service.ensureDirectoryExists(".agenda"),
      ).resolves.toBeUndefined();
    });
  });
});
