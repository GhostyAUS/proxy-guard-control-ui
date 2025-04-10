
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Save, RefreshCw } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

interface ConfigurationEditorProps {
  onSave: () => void;
}

// Sample nginx.conf content based on the provided configuration
const initialConfig = `worker_processes auto;
daemon off;

events {
    worker_connections 1024;
}

http {
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
   
    log_format denied '$remote_addr - [$time_local] "$request" '
                      '$status "$http_user_agent" "$http_referer" '
                      'Host: "$host" URI: "$request_uri" '
                      'Client: "$remote_addr" '
                      'Reason: "$deny_reason"';
	   
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log info;
    access_log /var/log/nginx/denied.log denied if=$deny_log;

    # WHITELIST GROUPS
    # Each group contains allowed IPs and their corresponding allowed URLs
    
    # Group: Default Group
    geo $whitelist_default_group {
        default 0;
        # Allow Individual IPs below:
        172.24.20.12/32 1;  # MOTPERWU01 wsus
        172.24.20.16/32 1;  # motperap04 rhel repo
        # Allow Subnets below:
        172.24.20.0/23 1;
    }
    
    # URL map for Default Group
    map $host $default_group_allowed_url {
        default 0;  # Block by default - deny unless explicitly allowed
        # Allow specific domains below:
        "~^.*\\.microsoft\\.com$" 1;  # motperwu01
        "~^.*\\.windowsupdate\\.com$" 1;  # motperwu01
        "subscription.rhn.redhat.com" 1;  # motperap04
    }

    # Variables for logging denied requests
    map $status $deny_log {
        ~^4 1;  # Log all 4xx responses (including 403 denied requests)
        default 0;
    }
    
    # Map to set denial reason based on group access
    map "$whitelist_default_group:$default_group_allowed_url" $deny_reason_default_group {
        "0:0" "IP not in group or URL not allowed for group";
        "0:1" "IP not in group";
        "1:0" "URL not in allowed list for group";
        default "";
    }

    server {
        listen 8080;
        # External DNS server/s
        resolver 8.8.8.8 1.1.1.1 ipv6=off;

        # Use the geo variable for access control
        if ($whitelist_default_group = 0) {
            set $deny_reason "IP not in any whitelist group: $remote_addr";
            return 403 "Access denied: Your IP is not in any whitelist group.";
        }

        # Block disallowed URLs for default group
        if ($whitelist_default_group = 1) {
            if ($default_group_allowed_url = 0) {
                set $deny_reason "URL not allowed for your group: $host";
                return 403 "Access denied: This URL is not allowed for your whitelist group.";
            }
        }

        # HTTPS CONNECT method handling
        proxy_connect;
        proxy_connect_allow all;  # Allow all ports for HTTPS connections
        proxy_connect_connect_timeout 10s;
        proxy_connect_read_timeout 60s;
        proxy_connect_send_timeout 60s;

        # Security headers
        proxy_hide_header Upgrade;
        proxy_hide_header X-Powered-By;
        add_header Content-Security-Policy "upgrade-insecure-requests";
        add_header X-Frame-Options "SAMEORIGIN";
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Cache-Control "no-transform" always;
        add_header Referrer-Policy no-referrer always;
        add_header X-Robots-Tag none;

        # HTTP forwarding
        location / {
            # Check whitelist again at location level
            if ($whitelist_default_group = 0) {
                set $deny_reason "IP not in any whitelist group at location level: $remote_addr";
                return 403 "Access denied: Your IP is not in any whitelist group.";
            }

            # Check URL filtering again at location level for default group
            if ($whitelist_default_group = 1) {
                if ($default_group_allowed_url = 0) {
                    set $deny_reason "URL not allowed for your group at location level: $host";
                    return 403 "Access denied: This URL is not allowed for your whitelist group.";
                }
            }

            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header Connection "";  # Enable keepalives
            proxy_pass $scheme://$host$request_uri;  # Include $request_uri

            # Additional useful headers
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Timeouts for better reliability
            proxy_connect_timeout 10s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
    }
}`;

const ConfigurationEditor: React.FC<ConfigurationEditorProps> = ({ onSave }) => {
  const [config, setConfig] = useState(initialConfig);
  const [isValid, setIsValid] = useState(true);

  const handleSaveConfig = () => {
    // In a real implementation, this would save to the filesystem
    if (!isValid) {
      toast({
        title: "Invalid configuration",
        description: "Please fix the NGINX configuration errors before saving.",
        variant: "destructive",
      });
      return;
    }
    
    onSave();
    toast({
      title: "Configuration saved",
      description: "NGINX configuration has been saved to nginx.conf",
    });
  };

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

  const generateConfig = () => {
    // In a real implementation, this would generate config from the UI state
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
          <Button onClick={generateConfig} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Generate from Groups
          </Button>
          <Button 
            onClick={handleSaveConfig} 
            className="bg-green-600 hover:bg-green-700"
            disabled={!isValid}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </div>
      
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
            />
            {!isValid && (
              <div className="absolute bottom-2 right-2 bg-red-500 text-white px-2 py-1 text-xs rounded">
                Invalid configuration
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
            disabled={!isValid}
          >
            Save Changes
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Container Restart Instructions</CardTitle>
          <CardDescription>
            After saving the NGINX configuration, you need to restart the container for changes to take effect.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-slate-100 p-4 rounded-md">
              <p className="font-mono text-sm mb-2">Option 1: Using Docker CLI</p>
              <code className="bg-slate-800 text-slate-100 p-2 rounded block overflow-x-auto">
                docker restart nginx-forward-proxy
              </code>
            </div>
            
            <div className="bg-slate-100 p-4 rounded-md">
              <p className="font-mono text-sm mb-2">Option 2: Using Docker Compose</p>
              <code className="bg-slate-800 text-slate-100 p-2 rounded block overflow-x-auto">
                docker-compose restart nginx-proxy
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfigurationEditor;
