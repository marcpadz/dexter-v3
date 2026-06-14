"use client";

import { useState, useEffect } from "react";
import { getApiKeys, saveApiKey, deleteApiKey, updateUserSettings, getUserSettings } from "@/lib/server/actions/settings";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { McpConnectorCard, type McpServerData } from "@/components/settings/mcp-connector-card";
import { McpConnectorDialog } from "@/components/settings/mcp-connector-dialog";
import { KnowledgebaseCard, type KnowledgebaseData } from "@/components/settings/knowledgebase-card";
import { KnowledgebaseDialog } from "@/components/settings/knowledgebase-dialog";
import { MemoryCard, type MemoryItem } from "@/components/settings/memory-card";
import { Plus } from "lucide-react";

const PROVIDERS = ["openai", "anthropic", "google", "groq", "mistral", "xai", "deepseek", "openrouter", "ollama"];

export default function SettingsPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [providerInputs, setProviderInputs] = useState<Record<string, string>>({});

  // MCP state
  const [mcpServers, setMcpServers] = useState<McpServerData[]>([]);
  const [mcpDialogOpen, setMcpDialogOpen] = useState(false);
  const [editingMcpId, setEditingMcpId] = useState<string | null>(null);

  // KB state
  const [knowledgebases, setKnowledgebases] = useState<KnowledgebaseData[]>([]);
  const [kbDialogOpen, setKbDialogOpen] = useState(false);
  const [editingKbId, setEditingKbId] = useState<string | null>(null);

  // Memory state
  const [memories, setMemories] = useState<MemoryItem[]>([]);

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
          <TabsTrigger value="knowledgebase">Knowledgebase</TabsTrigger>
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

        <TabsContent value="mcp-servers" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">MCP Servers</h2>
              <p className="text-sm text-muted-foreground">Configure external tools and integrations via Model Context Protocol.</p>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => { setEditingMcpId(null); setMcpDialogOpen(true); }}>
              <Plus className="h-4 w-4" /> Add Server
            </Button>
          </div>
          {mcpServers.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No MCP servers configured yet.</p>
                <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => { setEditingMcpId(null); setMcpDialogOpen(true); }}>
                  <Plus className="h-3.5 w-3.5" /> Add your first server
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {mcpServers.map(server => (
                <McpConnectorCard
                  key={server.id}
                  server={server}
                  onToggle={(id, enabled) => setMcpServers(prev => prev.map(s => s.id === id ? { ...s, enabled } : s))}
                  onEdit={(id) => { setEditingMcpId(id); setMcpDialogOpen(true); }}
                  onDelete={(id) => setMcpServers(prev => prev.filter(s => s.id !== id))}
                />
              ))}
            </div>
          )}
          <McpConnectorDialog
            open={mcpDialogOpen}
            onOpenChange={setMcpDialogOpen}
            server={editingMcpId ? mcpServers.find(s => s.id === editingMcpId) : null}
            onSave={(server) => {
              if (editingMcpId) {
                setMcpServers(prev => prev.map(s => s.id === editingMcpId ? { ...s, ...server } : s));
              } else {
                setMcpServers(prev => [...prev, { ...server, id: crypto.randomUUID(), enabled: true, status: "disconnected" }]);
              }
              setMcpDialogOpen(false);
              setEditingMcpId(null);
            }}
          />
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

        <TabsContent value="memory" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Agent Memory</h2>
              <p className="text-sm text-muted-foreground">Manage facts and preferences the agent has learned about you.</p>
            </div>
          </div>
          {memories.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No memories stored yet. The agent will save important facts here as you interact.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {memories.map(mem => (
                <MemoryCard
                  key={mem.id}
                  memory={mem}
                  onUpdate={(id, content) => setMemories(prev => prev.map(m => m.id === id ? { ...m, content, updatedAt: new Date().toISOString() } : m))}
                  onDelete={(id) => setMemories(prev => prev.filter(m => m.id !== id))}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="knowledgebase" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Knowledgebases</h2>
              <p className="text-sm text-muted-foreground">RAG-powered document stores for contextual retrieval.</p>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => { setEditingKbId(null); setKbDialogOpen(true); }}>
              <Plus className="h-4 w-4" /> Add KB
            </Button>
          </div>
          {knowledgebases.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No knowledgebases configured yet.</p>
                <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => { setEditingKbId(null); setKbDialogOpen(true); }}>
                  <Plus className="h-3.5 w-3.5" /> Create your first KB
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {knowledgebases.map(kb => (
                <KnowledgebaseCard
                  key={kb.id}
                  kb={kb}
                  onToggle={(id, enabled) => setKnowledgebases(prev => prev.map(k => k.id === id ? { ...k, enabled } : k))}
                  onEdit={(id) => { setEditingKbId(id); setKbDialogOpen(true); }}
                  onDelete={(id) => setKnowledgebases(prev => prev.filter(k => k.id !== id))}
                />
              ))}
            </div>
          )}
          <KnowledgebaseDialog
            open={kbDialogOpen}
            onOpenChange={setKbDialogOpen}
            kb={editingKbId ? knowledgebases.find(k => k.id === editingKbId) : null}
            onSave={(kb) => {
              if (editingKbId) {
                setKnowledgebases(prev => prev.map(k => k.id === editingKbId ? { ...k, ...kb } : k));
              } else {
                setKnowledgebases(prev => [...prev, { ...kb, id: crypto.randomUUID(), documentCount: 0, enabled: true, createdAt: new Date().toLocaleDateString() }]);
              }
              setKbDialogOpen(false);
              setEditingKbId(null);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
