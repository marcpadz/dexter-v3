"use client";

import { useState, useEffect } from "react";
import { getApiKeys, saveApiKey, deleteApiKey, updateUserSettings, getUserSettings } from "@/lib/server/actions/settings";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const PROVIDERS = ["openai", "anthropic", "google", "groq", "mistral", "xai", "deepseek", "openrouter", "ollama"];

export default function SettingsPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [providerInputs, setProviderInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadData() {
      try {
        const [keysData, profileData] = await Promise.all([
          getApiKeys(),
          getUserSettings()
        ]);
        setKeys(keysData);
        setProfile(profileData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveKey = async (provider: string) => {
    const key = providerInputs[provider];
    if (!key) return;
    try {
      await saveApiKey({ provider, encryptedKey: key, iv: "" });
      toast.success(`${provider} API key saved`);
      setProviderInputs(prev => ({ ...prev, [provider]: "" }));
      const updatedKeys = await getApiKeys();
      setKeys(updatedKeys);
    } catch (e) {
      toast.error("Failed to save API key");
    }
  };

  const handleDeleteKey = async (provider: string) => {
    try {
      await deleteApiKey(provider);
      toast.success(`${provider} API key deleted`);
      const updatedKeys = await getApiKeys();
      setKeys(updatedKeys);
    } catch (e) {
      toast.error("Failed to delete API key");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const image = formData.get("image") as string;
    try {
      await updateUserSettings({ name });
      toast.success("Profile updated");
    } catch (e) {
      toast.error("Failed to update profile");
    }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <Tabs defaultValue="api-keys" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="mcp-servers">MCP Servers</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>LLM Providers</CardTitle>
              <CardDescription>
                Configure API keys for your preferred LLM providers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {PROVIDERS.map(provider => {
                const existingKey = keys.find(k => k.provider === provider);
                const isConfigured = !!existingKey;

                return (
                  <div key={provider} className="flex flex-col space-y-2 border p-4 rounded-md">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-medium capitalize">{provider}</Label>
                      {isConfigured && <span className="text-sm text-green-600 font-medium">Configured</span>}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Input
                        type="password"
                        placeholder={isConfigured ? "••••••••••••••••" : `Enter ${provider} API Key`}
                        value={providerInputs[provider] || ""}
                        onChange={(e) => setProviderInputs(prev => ({ ...prev, [provider]: e.target.value }))}
                        className="flex-1"
                      />
                      <Button onClick={() => handleSaveKey(provider)} disabled={!providerInputs[provider]}>
                        Save
                      </Button>
                      {isConfigured && (
                        <Button variant="destructive" onClick={() => handleDeleteKey(provider)}>
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mcp-servers">
          <Card>
            <CardHeader>
              <CardTitle>MCP Servers</CardTitle>
              <CardDescription>Configure external tools and integrations.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">MCP server configuration coming soon. (WIP server actions complete)</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Manage your personal information.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" defaultValue={profile?.name || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Profile Image URL</Label>
                  <Input id="image" name="image" defaultValue={profile?.image || ""} />
                </div>
                <Button type="submit">Update Profile</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memory">
          <Card>
            <CardHeader>
              <CardTitle>Agent Memory</CardTitle>
              <CardDescription>Manage facts and preferences the agent has learned about you.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Memory management coming soon. (WIP frontend bindings)</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
