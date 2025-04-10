
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import WhitelistGroups from "@/components/WhitelistGroups";
import ConfigurationEditor from "@/components/ConfigurationEditor";
import AuthSettings from "@/components/AuthSettings";
import { FileText, Shield, Key, RefreshCw } from 'lucide-react';

const Index = () => {
  const [configSaved, setConfigSaved] = useState(false);

  const handleConfigSave = () => {
    setConfigSaved(true);
    toast({
      title: "Configuration saved",
      description: "The NGINX configuration has been updated successfully.",
    });
  };

  const handleContainerRestart = () => {
    // In a production environment, this would trigger the container restart
    // This is just a UI placeholder - actual implementation would depend on your backend
    toast({
      title: "Container restart initiated",
      description: "The NGINX proxy container is being restarted to apply changes.",
      duration: 5000,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-800 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">NGINX Forward Proxy Manager</h1>
          <p className="text-sm text-slate-300">Production Environment</p>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto py-6 px-4">
        <Tabs defaultValue="whitelist-groups" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="whitelist-groups" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Whitelist Groups</span>
            </TabsTrigger>
            <TabsTrigger value="configuration" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>NGINX Configuration</span>
            </TabsTrigger>
            <TabsTrigger value="authentication" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              <span>Authentication</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="whitelist-groups" className="space-y-4">
            <WhitelistGroups onSave={handleConfigSave} />
          </TabsContent>
          
          <TabsContent value="configuration" className="space-y-4">
            <ConfigurationEditor onSave={handleConfigSave} />
          </TabsContent>
          
          <TabsContent value="authentication" className="space-y-4">
            <AuthSettings onSave={handleConfigSave} />
          </TabsContent>
        </Tabs>

        {configSaved && (
          <div className="mt-6 p-4 border border-yellow-300 bg-yellow-50 rounded-md">
            <h3 className="text-lg font-medium text-yellow-800 mb-2">Configuration Changes Detected</h3>
            <p className="text-yellow-700 mb-4">
              You have made changes to the NGINX configuration. For these changes to take effect, 
              you need to restart the NGINX proxy container.
            </p>
            <Button 
              variant="outline"
              className="bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-200"
              onClick={handleContainerRestart}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Restart NGINX Container
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-300 p-4 mt-10">
        <div className="container mx-auto text-center text-sm">
          <p>NGINX Forward Proxy Manager - Production Environment</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
