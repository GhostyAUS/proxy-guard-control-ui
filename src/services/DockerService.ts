
import { toast } from "@/components/ui/use-toast";

// Configuration for Docker API access
const DOCKER_API_BASE = '/api/docker'; // This would need to be proxied to Docker socket in production

interface ContainerInfo {
  id: string;
  name: string;
  status: string;
  state: string;
  image: string;
}

export interface DockerError {
  message: string;
  statusCode: number;
}

// Docker API service for managing containers
export const DockerService = {
  /**
   * Get a list of all running containers
   */
  async listContainers(): Promise<ContainerInfo[] | DockerError> {
    try {
      const response = await fetch(`${DOCKER_API_BASE}/containers/json`);
      
      if (!response.ok) {
        const errorData = await response.json();
        return {
          message: errorData.message || 'Failed to fetch containers',
          statusCode: response.status,
        };
      }
      
      const containers = await response.json();
      return containers.map((container: any) => ({
        id: container.Id,
        name: container.Names[0].replace(/^\//, ''),
        status: container.Status,
        state: container.State,
        image: container.Image,
      }));
    } catch (error) {
      console.error("Docker API error:", error);
      return {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        statusCode: 500,
      };
    }
  },
  
  /**
   * Restart a specific container by ID or name
   */
  async restartContainer(containerIdOrName: string): Promise<boolean | DockerError> {
    try {
      const response = await fetch(`${DOCKER_API_BASE}/containers/${containerIdOrName}/restart`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return {
          message: errorData.message || `Failed to restart container: ${containerIdOrName}`,
          statusCode: response.status,
        };
      }
      
      return true;
    } catch (error) {
      console.error("Docker restart error:", error);
      return {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        statusCode: 500,
      };
    }
  },
  
  /**
   * Check if a specific container exists and is running
   */
  async checkContainerStatus(containerName: string): Promise<{ exists: boolean; running: boolean; } | DockerError> {
    try {
      const containers = await this.listContainers();
      
      if ('message' in containers) {
        return containers; // Return the error
      }
      
      const container = containers.find(c => c.name === containerName);
      return {
        exists: !!container,
        running: container?.state === 'running' || false
      };
    } catch (error) {
      console.error("Docker status check error:", error);
      return {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        statusCode: 500
      };
    }
  }
};

