
import { toast } from "@/components/ui/use-toast";

// Configuration for file operations
const FILE_API_BASE = '/api/files';

interface FilePermission {
  path: string;
  permissions: string; // Unix-style permissions, e.g. "644"
  owner: string;
  group: string;
}

export interface FileError {
  message: string;
  statusCode: number;
}

export const FilePermissionService = {
  /**
   * Check if a file exists and has proper permissions
   */
  async checkFilePermissions(filePath: string): Promise<FilePermission | FileError> {
    try {
      const response = await fetch(`${FILE_API_BASE}/permissions?path=${encodeURIComponent(filePath)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        return {
          message: errorData.message || 'Failed to check file permissions',
          statusCode: response.status
        };
      }
      
      return await response.json();
    } catch (error) {
      console.error("File permission check error:", error);
      return {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        statusCode: 500
      };
    }
  },
  
  /**
   * Fix file permissions to ensure the nginx container can read it
   */
  async fixFilePermissions(filePath: string, permissions: string = "644", owner: string = "nginx", group: string = "nginx"): Promise<boolean | FileError> {
    try {
      const response = await fetch(`${FILE_API_BASE}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: filePath,
          permissions,
          owner,
          group
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return {
          message: errorData.message || 'Failed to fix file permissions',
          statusCode: response.status
        };
      }
      
      return true;
    } catch (error) {
      console.error("Fix permissions error:", error);
      return {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        statusCode: 500
      };
    }
  },
  
  /**
   * Write content to a file with proper permissions
   */
  async writeFile(filePath: string, content: string): Promise<boolean | FileError> {
    try {
      const response = await fetch(`${FILE_API_BASE}/write`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: filePath,
          content
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return {
          message: errorData.message || 'Failed to write file',
          statusCode: response.status
        };
      }
      
      // Automatically fix permissions after writing
      const permissionResult = await this.fixFilePermissions(filePath);
      if (typeof permissionResult !== 'boolean') {
        console.warn("Failed to set permissions after writing:", permissionResult.message);
      }
      
      return true;
    } catch (error) {
      console.error("File write error:", error);
      return {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        statusCode: 500
      };
    }
  },
  
  /**
   * Read file content
   */
  async readFile(filePath: string): Promise<string | FileError> {
    try {
      const response = await fetch(`${FILE_API_BASE}/read?path=${encodeURIComponent(filePath)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        return {
          message: errorData.message || 'Failed to read file',
          statusCode: response.status
        };
      }
      
      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error("File read error:", error);
      return {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        statusCode: 500
      };
    }
  }
};

