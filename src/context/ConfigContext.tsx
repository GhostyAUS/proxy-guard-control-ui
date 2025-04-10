
import React, { createContext, useState, useEffect, useContext } from 'react';
import { DockerService } from '@/services/DockerService';
import { FilePermissionService } from '@/services/FilePermissionService';
import { toast } from '@/components/ui/use-toast';

interface ConfigContextType {
  nginxConfigPath: string;
  setNginxConfigPath: (path: string) => void;
  nginxContainerName: string;
  setNginxContainerName: (name: string) => void;
  isContainerRunning: boolean;
  restartContainer: () => Promise<boolean>;
  saveConfig: (content: string) => Promise<boolean>;
  loadConfig: () => Promise<string | null>;
  checkFilePermissions: () => Promise<boolean>;
  fixFilePermissions: () => Promise<boolean>;
  permissionStatus: {
    checked: boolean;
    isCorrect: boolean;
    details: string;
  };
}

const defaultConfigContext: ConfigContextType = {
  nginxConfigPath: '/etc/nginx/nginx.conf',
  setNginxConfigPath: () => {},
  nginxContainerName: 'nginx-forward-proxy',
  setNginxContainerName: () => {},
  isContainerRunning: false,
  restartContainer: async () => false,
  saveConfig: async () => false,
  loadConfig: async () => null,
  checkFilePermissions: async () => false,
  fixFilePermissions: async () => false,
  permissionStatus: {
    checked: false,
    isCorrect: false,
    details: '',
  },
};

const ConfigContext = createContext<ConfigContextType>(defaultConfigContext);

export const useConfig = () => useContext(ConfigContext);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nginxConfigPath, setNginxConfigPath] = useState('/etc/nginx/nginx.conf');
  const [nginxContainerName, setNginxContainerName] = useState('nginx-forward-proxy');
  const [isContainerRunning, setIsContainerRunning] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState({
    checked: false,
    isCorrect: false,
    details: '',
  });
  
  // Check container status on load and when container name changes
  useEffect(() => {
    const checkContainer = async () => {
      const result = await DockerService.checkContainerStatus(nginxContainerName);
      
      if ('message' in result) {
        toast({
          title: "Docker Connection Error",
          description: result.message,
          variant: "destructive",
        });
        setIsContainerRunning(false);
        return;
      }
      
      setIsContainerRunning(result.running);
      
      if (!result.exists) {
        toast({
          title: "Container Not Found",
          description: `The container "${nginxContainerName}" doesn't exist.`,
          variant: "destructive",
        });
      } else if (!result.running) {
        toast({
          title: "Container Not Running",
          description: `The container "${nginxContainerName}" exists but is not running.`,
          variant: "warning",
        });
      }
    };
    
    checkContainer();
  }, [nginxContainerName]);
  
  // Check file permissions on load and when path changes
  useEffect(() => {
    checkFilePermissions();
  }, [nginxConfigPath]);
  
  const restartContainer = async (): Promise<boolean> => {
    const result = await DockerService.restartContainer(nginxContainerName);
    
    if (typeof result === 'boolean' && result) {
      toast({
        title: "Container Restarted",
        description: `The ${nginxContainerName} container was successfully restarted.`,
      });
      setIsContainerRunning(true);
      return true;
    } else {
      toast({
        title: "Container Restart Failed",
        description: 'message' in result ? result.message : "Unknown error",
        variant: "destructive",
      });
      return false;
    }
  };
  
  const saveConfig = async (content: string): Promise<boolean> => {
    const result = await FilePermissionService.writeFile(nginxConfigPath, content);
    
    if (typeof result === 'boolean' && result) {
      toast({
        title: "Configuration Saved",
        description: `NGINX configuration has been written to ${nginxConfigPath}`,
      });
      await checkFilePermissions();
      return true;
    } else {
      toast({
        title: "Save Failed",
        description: 'message' in result ? result.message : "Unknown error",
        variant: "destructive",
      });
      return false;
    }
  };
  
  const loadConfig = async (): Promise<string | null> => {
    const result = await FilePermissionService.readFile(nginxConfigPath);
    
    if (typeof result === 'string') {
      return result;
    } else {
      toast({
        title: "Failed to Load Configuration",
        description: result.message,
        variant: "destructive",
      });
      return null;
    }
  };
  
  const checkFilePermissions = async (): Promise<boolean> => {
    const result = await FilePermissionService.checkFilePermissions(nginxConfigPath);
    
    if ('message' in result) {
      setPermissionStatus({
        checked: true,
        isCorrect: false,
        details: result.message,
      });
      return false;
    }
    
    // Check if permissions are correct for nginx to read (644 or 664)
    const permOk = result.permissions === '644' || result.permissions === '664';
    // Check if owner is correct (nginx or root)
    const ownerOk = result.owner === 'nginx' || result.owner === 'root';
    
    setPermissionStatus({
      checked: true,
      isCorrect: permOk && ownerOk,
      details: permOk && ownerOk 
        ? 'File permissions are correct'
        : `File permissions need adjustment: ${result.permissions}, owner: ${result.owner}`,
    });
    
    return permOk && ownerOk;
  };
  
  const fixFilePermissions = async (): Promise<boolean> => {
    const result = await FilePermissionService.fixFilePermissions(nginxConfigPath);
    
    if (typeof result === 'boolean' && result) {
      toast({
        title: "Permissions Fixed",
        description: `File permissions for ${nginxConfigPath} have been corrected.`,
      });
      await checkFilePermissions();
      return true;
    } else {
      toast({
        title: "Permission Fix Failed",
        description: 'message' in result ? result.message : "Unknown error",
        variant: "destructive",
      });
      return false;
    }
  };
  
  return (
    <ConfigContext.Provider
      value={{
        nginxConfigPath,
        setNginxConfigPath,
        nginxContainerName,
        setNginxContainerName,
        isContainerRunning,
        restartContainer,
        saveConfig,
        loadConfig,
        checkFilePermissions,
        fixFilePermissions,
        permissionStatus,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

