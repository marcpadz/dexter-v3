"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  THINKING_LEVELS,
  type ThinkingLevel,
} from "@/lib/feature-flags";
import { Brain, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThinkingLevelSelectorProps {
  value: ThinkingLevel;
  onChange: (level: ThinkingLevel) => void;
}

export function ThinkingLevelSelector({
  value,
  onChange,
}: ThinkingLevelSelectorProps) {
  const [open, setOpen] = useState(false);

  const currentLevel = THINKING_LEVELS.find((l) => l.value === value);

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
        <Brain className="h-4 w-4" />
        <span className="hidden sm:inline">
          {currentLevel?.label ?? "Thinking"}
        </span>
        <ChevronDown className="h-3 w-3" />
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="w-64 p-0">
        <div className="p-3 border-b">
          <p className="text-xs font-medium text-muted-foreground">
            Reasoning Level
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
            How deeply the agent should think before responding
          </p>
        </div>
        <div className="p-2 space-y-0.5">
          {THINKING_LEVELS.map((level) => {
            const isSelected = value === level.value;
            return (
              <button
                key={level.value}
                className={cn(
                  "flex items-center gap-2.5 w-full text-left px-2 py-2 rounded-md transition-colors",
                  isSelected
                    ? "bg-muted font-medium"
                    : "hover:bg-muted/50"
                )}
                onClick={() => {
                  onChange(level.value);
                  setOpen(false);
                }}
              >
                <span
                  className={cn(
                    "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0",
                    isSelected
                      ? "border-primary"
                      : "border-muted-foreground/30"
                  )}
                >
                  {isSelected && (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </span>
                <div className="min-w-0">
                  <div className="text-sm flex items-center gap-1.5">
                    {level.label}
                    {isSelected && (
                      <Check className="h-3 w-3 text-primary" />
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {level.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
