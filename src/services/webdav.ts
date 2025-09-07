import { createClient, WebDAVClient } from "webdav";

export interface WebDAVConfig {
  url: string;
  username: string;
  password: string;
}

export class WebDAVService {
  private client: WebDAVClient | null = null;
  private config: WebDAVConfig | null = null;

  configure(config: WebDAVConfig) {
    this.config = config;
    this.client = createClient(config.url, {
      username: config.username,
      password: config.password,
    });
  }

  isConfigured(): boolean {
    return this.client !== null && this.config !== null;
  }

  async testConnection(): Promise<boolean> {
    if (!this.client) {
      throw new Error("WebDAV client not configured");
    }

    try {
      await this.client.getDirectoryContents("/");
      return true;
    } catch (error) {
      console.error("WebDAV connection test failed:", error);
      return false;
    }
  }

  async ensureDirectoryExists(directory: string = ".agenda"): Promise<void> {
    if (!this.client) {
      throw new Error("WebDAV client not configured");
    }

    try {
      // Try to create the directory (this is a no-op if it already exists)
      await this.client.createDirectory(directory, { recursive: true });
    } catch (error) {
      // Directory might already exist, which is fine
      console.log("Directory creation attempted:", directory);
    }
  }

  async uploadData(
    data: string,
    filename: string = ".agenda/tasks.json",
  ): Promise<void> {
    if (!this.client) {
      throw new Error("WebDAV client not configured");
    }

    try {
      // Ensure the directory exists before uploading
      const directory = filename.substring(0, filename.lastIndexOf("/"));
      if (directory) {
        await this.ensureDirectoryExists(directory);
      }

      await this.client.putFileContents(filename, data, {
        overwrite: true,
        contentLength: data.length,
      });
    } catch (error) {
      console.error("Failed to upload data to WebDAV:", error);
      throw new Error(
        `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async downloadData(
    filename: string = ".agenda/tasks.json",
  ): Promise<string> {
    if (!this.client) {
      throw new Error("WebDAV client not configured");
    }

    try {
      const data = await this.client.getFileContents(filename, {
        format: "text",
      });
      return data as string;
    } catch (error) {
      console.error("Failed to download data from WebDAV:", error);
      throw new Error(
        `Download failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async downloadDataIfNewer(
    filename: string = ".agenda/tasks.json",
  ): Promise<{ data: string; lastModified: Date } | null> {
    if (!this.client) {
      throw new Error("WebDAV client not configured");
    }

    try {
      const stats = await this.client.stat(filename);
      if ("lastmod" in stats && stats.lastmod) {
        const lastModified = new Date(stats.lastmod);
        const data = await this.client.getFileContents(filename, {
          format: "text",
        });
        return {
          data: data as string,
          lastModified,
        };
      }
      return null; // File doesn't exist
    } catch (error) {
      console.error("Failed to check/download data from WebDAV:", error);
      return null;
    }
  }

  async getLastModified(
    filename: string = ".agenda/tasks.json",
  ): Promise<Date | null> {
    if (!this.client) {
      throw new Error("WebDAV client not configured");
    }

    try {
      const stats = await this.client.stat(filename);
      if ("lastmod" in stats && stats.lastmod) {
        return new Date(stats.lastmod);
      }
      return null;
    } catch (error) {
      // File doesn't exist or other error
      return null;
    }
  }

  async fileExists(
    filename: string = ".agenda/tasks.json",
  ): Promise<boolean> {
    if (!this.client) {
      throw new Error("WebDAV client not configured");
    }

    try {
      await this.client.stat(filename);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Singleton instance
export const webdavService = new WebDAVService();
