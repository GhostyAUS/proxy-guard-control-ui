
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, X, Save, Edit, Trash2 } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";

type WhitelistEntry = {
  id: string;
  value: string;
};

type WhitelistGroup = {
  id: string;
  name: string;
  description: string;
  ipAddresses: WhitelistEntry[];
  urls: WhitelistEntry[];
};

const initialGroups: WhitelistGroup[] = [
  {
    id: "default-group",
    name: "Default Group",
    description: "Default whitelist configuration",
    ipAddresses: [
      { id: "ip-1", value: "172.24.20.12/32" },
      { id: "ip-2", value: "172.24.20.16/32" },
      { id: "ip-3", value: "172.24.20.0/23" }
    ],
    urls: [
      { id: "url-1", value: "^.*\\.microsoft\\.com$" },
      { id: "url-2", value: "^.*\\.windowsupdate\\.com$" },
      { id: "url-3", value: "subscription.rhn.redhat.com" }
    ]
  }
];

interface WhitelistGroupsProps {
  onSave: () => void;
}

const WhitelistGroups: React.FC<WhitelistGroupsProps> = ({ onSave }) => {
  const [groups, setGroups] = useState<WhitelistGroup[]>(initialGroups);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [newIpAddress, setNewIpAddress] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const handleAddGroup = () => {
    if (!newGroupName.trim()) {
      toast({
        title: "Group name required",
        description: "Please provide a name for the new whitelist group",
        variant: "destructive",
      });
      return;
    }

    const newGroup: WhitelistGroup = {
      id: `group-${Date.now()}`,
      name: newGroupName,
      description: newGroupDescription,
      ipAddresses: [],
      urls: []
    };

    setGroups([...groups, newGroup]);
    setNewGroupName("");
    setNewGroupDescription("");
    setShowAddGroup(false);
  };

  const handleAddIp = (groupId: string) => {
    if (!newIpAddress.trim()) return;
    
    // Basic IP address validation
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/(?:3[0-2]|[1-2][0-9]|[0-9]))?$/;
    if (!ipRegex.test(newIpAddress)) {
      toast({
        title: "Invalid IP Address",
        description: "Please enter a valid IPv4 address or CIDR notation (e.g., 192.168.1.1 or 192.168.1.0/24)",
        variant: "destructive",
      });
      return;
    }

    setGroups(prevGroups => 
      prevGroups.map(group => 
        group.id === groupId 
          ? {
              ...group,
              ipAddresses: [
                ...group.ipAddresses,
                { id: `ip-${Date.now()}`, value: newIpAddress }
              ]
            }
          : group
      )
    );
    setNewIpAddress("");
  };

  const handleAddUrl = (groupId: string) => {
    if (!newUrl.trim()) return;

    setGroups(prevGroups => 
      prevGroups.map(group => 
        group.id === groupId 
          ? {
              ...group,
              urls: [
                ...group.urls,
                { id: `url-${Date.now()}`, value: newUrl }
              ]
            }
          : group
      )
    );
    setNewUrl("");
  };

  const handleDeleteIp = (groupId: string, ipId: string) => {
    setGroups(prevGroups => 
      prevGroups.map(group => 
        group.id === groupId 
          ? {
              ...group,
              ipAddresses: group.ipAddresses.filter(ip => ip.id !== ipId)
            }
          : group
      )
    );
  };

  const handleDeleteUrl = (groupId: string, urlId: string) => {
    setGroups(prevGroups => 
      prevGroups.map(group => 
        group.id === groupId 
          ? {
              ...group,
              urls: group.urls.filter(url => url.id !== urlId)
            }
          : group
      )
    );
  };

  const handleDeleteGroup = (groupId: string) => {
    setGroups(prevGroups => prevGroups.filter(group => group.id !== groupId));
  };

  const handleSaveGroups = () => {
    // In a real implementation, this would save to the filesystem
    // For now, we'll just call the onSave callback
    onSave();
    toast({
      title: "Groups saved",
      description: "Whitelist groups have been saved successfully",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Whitelist Groups</h2>
        <div className="space-x-2">
          <Button 
            onClick={() => setShowAddGroup(!showAddGroup)}
            variant={showAddGroup ? "secondary" : "default"}
          >
            {showAddGroup ? 'Cancel' : 'Add Group'}
          </Button>
          <Button onClick={handleSaveGroups} className="bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 mr-2" />
            Save All Groups
          </Button>
        </div>
      </div>
      
      {showAddGroup && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Whitelist Group</CardTitle>
            <CardDescription>Create a new group with IP addresses and URLs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="group-name">Group Name</Label>
              <Input 
                id="group-name" 
                value={newGroupName} 
                onChange={(e) => setNewGroupName(e.target.value)} 
                placeholder="Enter group name"
              />
            </div>
            <div>
              <Label htmlFor="group-description">Description (Optional)</Label>
              <Input 
                id="group-description" 
                value={newGroupDescription} 
                onChange={(e) => setNewGroupDescription(e.target.value)} 
                placeholder="Enter group description"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleAddGroup}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {groups.map(group => (
        <Card key={group.id}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{group.name}</CardTitle>
                {group.description && (
                  <CardDescription>{group.description}</CardDescription>
                )}
              </div>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => handleDeleteGroup(group.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* IP Addresses Section */}
              <div>
                <h3 className="text-lg font-medium mb-2">IP Addresses</h3>
                <div className="space-y-2">
                  {group.ipAddresses.map(ip => (
                    <div key={ip.id} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                      <span className="font-mono">{ip.value}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteIp(group.id, ip.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <div className="flex space-x-2 mt-4">
                    <Input 
                      value={newIpAddress} 
                      onChange={(e) => setNewIpAddress(e.target.value)} 
                      placeholder="Add IP address (e.g., 192.168.1.1 or 192.168.1.0/24)"
                    />
                    <Button onClick={() => handleAddIp(group.id)}>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* URLs Section */}
              <div>
                <h3 className="text-lg font-medium mb-2">Allowed URLs</h3>
                <div className="space-y-2">
                  {group.urls.map(url => (
                    <div key={url.id} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                      <span className="font-mono">{url.value}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteUrl(group.id, url.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <div className="flex space-x-2 mt-4">
                    <Input 
                      value={newUrl} 
                      onChange={(e) => setNewUrl(e.target.value)} 
                      placeholder="Add URL (e.g., example.com or ^.*\\.example\\.com$)"
                    />
                    <Button onClick={() => handleAddUrl(group.id)}>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {groups.length === 0 && (
        <div className="text-center p-8 border border-dashed rounded-lg">
          <p className="text-gray-500">No whitelist groups defined. Click "Add Group" to create one.</p>
        </div>
      )}
    </div>
  );
};

export default WhitelistGroups;
