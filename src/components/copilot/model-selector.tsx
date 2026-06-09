"use client";

import { useState, useEffect } from "react";
import { getApiKeys } from "@/lib/server/actions/settings";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// Pre-defined models mapping
const MODEL_MAPPING: Record<string, { id: string, name: string }[]> = {
  openai: [
    { id: "openai/gpt-4o", name: "GPT-4o" },
    { id: "openai/gpt-4-turbo", name: "GPT-4 Turbo" },
    { id: "openai/gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
  ],
  anthropic: [
    { id: "anthropic/claude-3-5-sonnet", name: "Claude 3.5 Sonnet" },
    { id: "anthropic/claude-3-opus", name: "Claude 3 Opus" },
    { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku" },
  ],
  google: [
    { id: "google/gemini-1.5-pro", name: "Gemini 1.5 Pro" },
    { id: "google/gemini-1.5-flash", name: "Gemini 1.5 Flash" },
  ],
  mistral: [
    { id: "mistral/mistral-large-latest", name: "Mistral Large" },
  ],
  groq: [
    { id: "groq/llama3-70b-8192", name: "Llama 3 70B (Groq)" },
    { id: "groq/mixtral-8x7b-32768", name: "Mixtral 8x7B (Groq)" },
  ],
  ollama: [
    { id: "ollama/llama3", name: "Llama 3 (Local)" },
    { id: "ollama/mistral", name: "Mistral (Local)" },
  ]
};

interface ModelSelectorProps {
  value?: string;
  onChange?: (modelId: string) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadKeys() {
      try {
        const configuredKeys = await getApiKeys();
        setKeys(configuredKeys);
      } catch (e) {
        console.error("Failed to load API keys", e);
      } finally {
        setLoading(false);
      }
    }
    loadKeys();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground border rounded-md px-3 py-2 h-10 w-[200px]">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading models...</span>
      </div>
    );
  }

  // Determine available providers based on configured keys
  // Always include ollama as it might not need an API key if local
  const availableProviders = keys.map(k => k.provider);
  if (!availableProviders.includes("ollama")) {
    availableProviders.push("ollama");
  }

  const availableModels = Object.entries(MODEL_MAPPING).filter(([provider]) =>
    availableProviders.includes(provider)
  );

  return (
    <Select value={value} onValueChange={(val) => { if (val && onChange) onChange(val); }}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select a model" />
      </SelectTrigger>
      <SelectContent>
        {availableModels.length === 0 ? (
          <div className="p-2 text-sm text-muted-foreground text-center">
            No API keys configured.
          </div>
        ) : (
          availableModels.map(([provider, models]) => (
            <SelectGroup key={provider}>
              <SelectLabel className="capitalize">{provider}</SelectLabel>
              {models.map(model => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectGroup>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
