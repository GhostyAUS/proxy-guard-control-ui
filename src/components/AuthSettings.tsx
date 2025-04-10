
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";

interface AuthSettingsProps {
  onSave: () => void;
}

const AuthSettings: React.FC<AuthSettingsProps> = ({ onSave }) => {
  // LDAP Settings
  const [ldapEnabled, setLdapEnabled] = useState(false);
  const [ldapServer, setLdapServer] = useState("");
  const [ldapPort, setLdapPort] = useState("636");
  const [ldapBaseDN, setLdapBaseDN] = useState("");
  const [ldapBindDN, setLdapBindDN] = useState("");
  const [ldapBindPassword, setLdapBindPassword] = useState("");

  // SAML Settings
  const [samlEnabled, setSamlEnabled] = useState(false);
  const [samlIdpUrl, setSamlIdpUrl] = useState("");
  const [samlMetadataPath, setSamlMetadataPath] = useState("");
  const [samlCertPath, setSamlCertPath] = useState("");
  const [samlKeyPath, setSamlKeyPath] = useState("");

  const handleSaveAuth = () => {
    // Perform validation
    if (ldapEnabled) {
      if (!ldapServer || !ldapBaseDN || !ldapBindDN || !ldapBindPassword) {
        toast({
          title: "LDAP Configuration Error",
          description: "Please fill in all required LDAP fields",
          variant: "destructive",
        });
        return;
      }
    }

    if (samlEnabled) {
      if (!samlIdpUrl || !samlMetadataPath || !samlCertPath || !samlKeyPath) {
        toast({
          title: "SAML Configuration Error",
          description: "Please fill in all required SAML fields",
          variant: "destructive",
        });
        return;
      }
    }

    // In a real implementation, this would save to the filesystem
    onSave();
    toast({
      title: "Authentication settings saved",
      description: "The authentication configuration has been updated successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Authentication Settings</h2>
        <Button 
          onClick={handleSaveAuth} 
          className="bg-green-600 hover:bg-green-700"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>

      {/* LDAP Authentication */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>LDAPS Authentication</CardTitle>
              <CardDescription>
                Configure LDAPS for secure directory service authentication
              </CardDescription>
            </div>
            <Switch
              checked={ldapEnabled}
              onCheckedChange={setLdapEnabled}
            />
          </div>
        </CardHeader>
        {ldapEnabled && (
          <>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ldap-server">LDAP Server</Label>
                  <Input
                    id="ldap-server"
                    value={ldapServer}
                    onChange={(e) => setLdapServer(e.target.value)}
                    placeholder="ldaps://ldap.example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="ldap-port">LDAP Port</Label>
                  <Input
                    id="ldap-port"
                    value={ldapPort}
                    onChange={(e) => setLdapPort(e.target.value)}
                    placeholder="636"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="ldap-basedn">Base DN</Label>
                <Input
                  id="ldap-basedn"
                  value={ldapBaseDN}
                  onChange={(e) => setLdapBaseDN(e.target.value)}
                  placeholder="dc=example,dc=com"
                />
              </div>

              <div>
                <Label htmlFor="ldap-binddn">Bind DN</Label>
                <Input
                  id="ldap-binddn"
                  value={ldapBindDN}
                  onChange={(e) => setLdapBindDN(e.target.value)}
                  placeholder="cn=admin,dc=example,dc=com"
                />
              </div>

              <div>
                <Label htmlFor="ldap-bind-password">Bind Password</Label>
                <Input
                  id="ldap-bind-password"
                  type="password"
                  value={ldapBindPassword}
                  onChange={(e) => setLdapBindPassword(e.target.value)}
                  placeholder="Enter bind password"
                />
              </div>
              
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-blue-700">
                <h4 className="font-bold">Security Note</h4>
                <p className="text-sm">
                  LDAPS uses port 636 by default and requires proper SSL certificates. 
                  Make sure your LDAP server has valid certificates installed.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-slate-500">
                These credentials will be used for authenticating users against your LDAP directory.
              </p>
            </CardFooter>
          </>
        )}
      </Card>

      {/* SAML Authentication */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>SAML Authentication</CardTitle>
              <CardDescription>
                Configure SAML for single sign-on authentication with your identity provider
              </CardDescription>
            </div>
            <Switch
              checked={samlEnabled}
              onCheckedChange={setSamlEnabled}
            />
          </div>
        </CardHeader>
        {samlEnabled && (
          <>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="saml-idp-url">Identity Provider URL</Label>
                <Input
                  id="saml-idp-url"
                  value={samlIdpUrl}
                  onChange={(e) => setSamlIdpUrl(e.target.value)}
                  placeholder="https://idp.example.com/saml2/sso"
                />
              </div>

              <div>
                <Label htmlFor="saml-metadata">SAML Metadata Path</Label>
                <Input
                  id="saml-metadata"
                  value={samlMetadataPath}
                  onChange={(e) => setSamlMetadataPath(e.target.value)}
                  placeholder="/etc/nginx/saml/metadata.xml"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="saml-cert">Certificate Path</Label>
                  <Input
                    id="saml-cert"
                    value={samlCertPath}
                    onChange={(e) => setSamlCertPath(e.target.value)}
                    placeholder="/etc/nginx/saml/sp.crt"
                  />
                </div>
                <div>
                  <Label htmlFor="saml-key">Private Key Path</Label>
                  <Input
                    id="saml-key"
                    value={samlKeyPath}
                    onChange={(e) => setSamlKeyPath(e.target.value)}
                    placeholder="/etc/nginx/saml/sp.key"
                  />
                </div>
              </div>
              
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-blue-700">
                <h4 className="font-bold">Implementation Note</h4>
                <p className="text-sm">
                  SAML authentication requires additional NGINX modules and configuration. 
                  Make sure to install the required SAML modules and set appropriate file permissions.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-slate-500">
                These settings will be used to establish trust between your application and the identity provider.
              </p>
            </CardFooter>
          </>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>File Permissions</CardTitle>
          <CardDescription>
            Ensure proper file permissions for security
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm">
              When saving authentication configuration files, the following file permissions should be set:
            </p>
            
            <div className="bg-slate-100 p-4 rounded-md">
              <p className="font-mono text-sm mb-2">For NGINX configuration:</p>
              <code className="bg-slate-800 text-slate-100 p-2 rounded block overflow-x-auto">
                chmod 644 /usr/local/nginx/conf/nginx.conf<br />
                chown nginx:nginx /usr/local/nginx/conf/nginx.conf
              </code>
            </div>
            
            <div className="bg-slate-100 p-4 rounded-md">
              <p className="font-mono text-sm mb-2">For sensitive auth files:</p>
              <code className="bg-slate-800 text-slate-100 p-2 rounded block overflow-x-auto">
                chmod 600 /etc/nginx/saml/sp.key<br />
                chmod 644 /etc/nginx/saml/sp.crt /etc/nginx/saml/metadata.xml<br />
                chown nginx:nginx /etc/nginx/saml/*
              </code>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 text-yellow-700">
              <h4 className="font-bold">Important Security Note</h4>
              <p className="text-sm">
                Ensure that private keys and credential files have restrictive permissions.
                Only the NGINX process should be able to read sensitive files.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthSettings;
