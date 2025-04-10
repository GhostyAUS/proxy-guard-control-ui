
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, RefreshCw, AlertTriangle, Check, FileWarning, Settings } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { useConfig } from "@/context/ConfigContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ConfigurationEditorProps {
  onSave: () => void;
}

// Sample nginx.conf content - this will be replaced with actual content from the file
const initialConfig = `worker_processes auto;
daemon off;

events {
    worker_connections 1024;
}

http {
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
   
    # Add configuration here
}`;

const ConfigurationEditor: React.FC<ConfigurationEditorProps> = ({ onSave }) => {
  const [config, setConfig] = useState(initialConfig);
  const [isValid, setIsValid] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const {
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
    permissionStatus
  } = useConfig();

  // Load config on component mount
  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true);
      const configContent = await loadConfig();
      if (configContent) {
        setConfig(configContent);
      }
      setIsLoading(false);
    };
    
    fetchConfig();
  }, [nginxConfigPath]);

  const validateConfig = (configText: string) => {
    // This is a placeholder for NGINX config validation
    // In a real implementation, you would use the NGINX -t test command
    // or a library that can parse and validate NGINX configs
    
    // Very basic validation - just check if braces are balanced
    let openBraces = 0;
    for (let i = 0; i < configText.length; i++) {
      if (configText[i] === '{') openBraces++;
      if (configText[i] === '}') openBraces--;
      if (openBraces < 0) return false;
    }
    return openBraces === 0;
  };

  const handleConfigChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newConfig = e.target.value;
    setConfig(newConfig);
    setIsValid(validateConfig(newConfig));
  };

  const handleSaveConfig = async () => {
    if (!isValid) {
      toast({
        title: "Invalid configuration",
        description: "Please fix the NGINX configuration errors before saving.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    const success = await saveConfig(config);
    setIsLoading(false);
    
    if (success) {
      onSave();
    }
  };

  const handleContainerRestart = async () => {
    setIsLoading(true);
    await restartContainer();
    setIsLoading(false);
  };

  const handleFixPermissions = async () => {
    setIsLoading(true);
    await fixFilePermissions();
    setIsLoading(false);
  };

  const generateConfig = () => {
    toast({
      title: "Config generation",
      description: "Generating NGINX configuration from current whitelist groups.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">NGINX Configuration</h2>
        <div className="space-x-2">
          <Button onClick={generateConfig} variant="outline" disabled={isLoading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Generate from Groups
          </Button>
          <Button 
            onClick={handleSaveConfig} 
            className="bg-green-600 hover:bg-green-700"
            disabled={!isValid || isLoading}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </div>

      {/* Configuration Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Configuration Settings
          </CardTitle>
          <CardDescription>
            Set the NGINX configuration file path and container name
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="configPath">NGINX Config Path</Label>
              <Input 
                id="configPath"
                value={nginxConfigPath}
                onChange={(e) => setNginxConfigPath(e.target.value)}
                placeholder="/etc/nginx/nginx.conf"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="containerName">Container Name</Label>
              <Input 
                id="containerName"
                value={nginxContainerName}
                onChange={(e) => setNginxContainerName(e.target.value)}
                placeholder="nginx-forward-proxy"
              />
            </div>
          </div>
          
          {/* File permission status */}
          {permissionStatus.checked && (
            <Alert variant={permissionStatus.isCorrect ? "default" : "destructive"}>
              <div className="flex items-center">
                {permissionStatus.isCorrect ? 
                  <Check className="h-4 w-4 mr-2 text-green-500" /> : 
                  <FileWarning className="h-4 w-4 mr-2" />
                }
                <AlertTitle>
                  {permissionStatus.isCorrect ? "File Permissions OK" : "Permission Issue Detected"}
                </AlertTitle>
              </div>
              <AlertDescription>
                {permissionStatus.details}
                {!permissionStatus.isCorrect && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleFixPermissions}
                    className="mt-2"
                  >
                    Fix Permissions
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Container status */}
          <Alert variant={isContainerRunning ? "default" : "warning"}>
            <div className="flex items-center">
              {isContainerRunning ? 
                <Check className="h-4 w-4 mr-2 text-green-500" /> : 
                <AlertTriangle className="h-4 w-4 mr-2" />
              }
              <AlertTitle>
                {isContainerRunning ? "Container Running" : "Container Status Issue"}
              </AlertTitle>
            </div>
            <AlertDescription>
              {isContainerRunning ? 
                `The ${nginxContainerName} container is running.` : 
                `The ${nginxContainerName} container is not running.`
              }
              {!isContainerRunning && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleContainerRestart}
                  className="mt-2"
                >
                  Start Container
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
      
      {/* Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Edit nginx.conf</CardTitle>
          <CardDescription>
            Edit the NGINX configuration directly. Changes will be validated before saving.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <textarea
              className={`font-mono w-full h-96 p-4 text-sm border rounded bg-slate-900 text-slate-100 ${!isValid ? 'border-red-500' : ''}`}
              value={config}
              onChange={handleConfigChange}
              spellCheck={false}
              disabled={isLoading}
            />
            {!isValid && (
              <div className="absolute bottom-2 right-2 bg-red-500 text-white px-2 py-1 text-xs rounded">
                Invalid configuration
              </div>
            )}
            {isLoading && (
              <div className="absolute inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-gray-500">
            {isValid ? 'Configuration appears valid' : 'Configuration contains errors'}
          </div>
          <Button 
            onClick={handleSaveConfig} 
            variant="default"
            disabled={!isValid || isLoading}
          >
            Save Changes
          </Button>
        </CardFooter>
      </Card>
      
      {/* Container Restart Card */}
      <Card>
        <CardHeader>
          <CardTitle>Container Management</CardTitle>
          <CardDescription>
            After saving the NGINX configuration, restart the container for changes to take effect.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-yellow-50 border-yellow-300">
            <AlertTriangle className="h-4 w-4 text-yellow-800" />
            <AlertTitle>Configuration changes require a container restart</AlertTitle>
            <AlertDescription>
              After saving your changes to the NGINX configuration file, you need to restart the container for the changes to take effect.
            </AlertDescription>
          </Alert>
          
          <div className="flex justify-center">
            <Button 
              onClick={handleContainerRestart}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Restart {nginxContainerName} Container
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfigurationEditor;

