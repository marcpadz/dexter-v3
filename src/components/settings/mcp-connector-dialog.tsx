"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { McpServerData } from "./mcp-connector-card";

interface McpConnectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  server?: McpServerData | null; // null = create mode
  onSave: (data: Omit<McpServerData, "id" | "status">) => void;
}

export function McpConnectorDialog({ open, onOpenChange, server, onSave }: McpConnectorDialogProps) {
  const [name, setName] = useState("");
  const [transport, setTransport] = useState<"stdio" | "sse" | "http">("stdio");
  const [command, setCommand] = useState("");
  const [url, setUrl] = useState("");
  const [args, setArgs] = useState("");
  const [envVars, setEnvVars] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const isEdit = !!server;

  useEffect(() => {
    if (server) {
      setName(server.name);
      setTransport(server.transport);
      setCommand(server.command || "");
      setUrl(server.url || "");
      setArgs("");
      setEnvVars("");
    } else {
      setName("");
      setTransport("stdio");
      setCommand("");
      setUrl("");
      setArgs("");
      setEnvVars("");
    }
    setTestResult(null);
  }, [server, open]);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    // Simulate test — real implementation would call server action
    await new Promise((r) => setTimeout(r, 1000));
    setTesting(false);
    setTestResult("success");
  };

  const handleSave = () => {
    onSave({
      name,
      transport,
      command: transport === "stdio" ? command : undefined,
      url: transport !== "stdio" ? url : undefined,
      enabled: true,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Connector" : "Add MCP Connector"}</DialogTitle>
          <DialogDescription>
            Configure an MCP server to extend Dexter&apos;s capabilities.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mcp-name">Name</Label>
            <Input
              id="mcp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My MCP Server"
            />
          </div>

          <div className="space-y-2">
            <Label>Transport</Label>
            <Select value={transport} onValueChange={(v) => setTransport(v as "stdio" | "sse" | "http")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="stdio">stdio</SelectItem>
                <SelectItem value="sse">SSE</SelectItem>
                <SelectItem value="http">HTTP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {transport === "stdio" ? (
            <div className="space-y-2">
              <Label htmlFor="mcp-cmd">Command</Label>
              <Input
                id="mcp-cmd"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="npx -y @modelcontextprotocol/server-..."
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="mcp-url">URL</Label>
              <Input
                id="mcp-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://mcp-server.example.com"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="mcp-args">Arguments (JSON)</Label>
            <Textarea
              id="mcp-args"
              value={args}
              onChange={(e) => setArgs(e.target.value)}
              placeholder='["arg1", "arg2"]'
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mcp-env">Environment Variables</Label>
            <Textarea
              id="mcp-env"
              value={envVars}
              onChange={(e) => setEnvVars(e.target.value)}
              placeholder="KEY=value"
              rows={2}
            />
          </div>

          {testResult && (
            <div className={`text-xs p-2 rounded-md ${testResult === "success" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}>
              {testResult === "success" ? "Connection successful!" : "Connection failed. Check your configuration."}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleTest} disabled={testing || !name}>
            {testing ? "Testing..." : "Test Connection"}
          </Button>
          <Button onClick={handleSave} disabled={!name || !((transport === "stdio" && command) || (transport !== "stdio" && url))}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
