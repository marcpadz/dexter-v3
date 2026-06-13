"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  FEATURE_FLAG_DEFINITIONS,
  type FeatureFlags,
  type FeatureFlagKey,
} from "@/lib/feature-flags";
import {
  Globe,
  Monitor,
  Terminal,
  FolderTree,
  GitBranch,
  Brain,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";

const ICON_MAP: Record<string, React.ReactNode> = {
  globe: <Globe className="h-3.5 w-3.5" />,
  monitor: <Monitor className="h-3.5 w-3.5" />,
  terminal: <Terminal className="h-3.5 w-3.5" />,
  "folder-tree": <FolderTree className="h-3.5 w-3.5" />,
  "git-branch": <GitBranch className="h-3.5 w-3.5" />,
  brain: <Brain className="h-3.5 w-3.5" />,
};

interface FeatureFlagMenuProps {
  flags: FeatureFlags;
  onFlagsChange: (flags: FeatureFlags) => void;
}

export function FeatureFlagMenu({ flags, onFlagsChange }: FeatureFlagMenuProps) {
  const [open, setOpen] = useState(false);

  const disabledCount = Object.values(flags).filter((v) => !v).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs gap-1.5 text-muted-foreground"
          />
        }
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span className="hidden sm:inline">Tools</span>
        {disabledCount > 0 && (
          <span className="text-[10px] text-amber-500">
            ({disabledCount} off)
          </span>
        )}
        <ChevronDown className="h-3 w-3" />
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-64 p-0">
        <div className="p-3 border-b">
          <p className="text-xs font-medium text-muted-foreground">
            Tool Capabilities
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
            Toggle which tools the agent can use this conversation
          </p>
        </div>
        <div className="p-2 space-y-0.5">
          {FEATURE_FLAG_DEFINITIONS.map((def) => (
            <div
              key={def.key}
              className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                {ICON_MAP[def.icon] ?? (
                  <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <div className="min-w-0">
                  <div className="text-sm">{def.label}</div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {def.description}
                  </div>
                </div>
              </div>
              <Switch
                checked={flags[def.key]}
                onCheckedChange={(checked) =>
                  onFlagsChange({ ...flags, [def.key]: checked === true })
                }
                size="sm"
              />
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
