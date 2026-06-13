"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/server/actions/auth";
import { ModelSelector } from "@/components/copilot/model-selector";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Settings, LogOut } from "lucide-react";
import { useState, useEffect } from "react";

export default function Header() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark(!isDark);
  };

  return (
    <header className="flex h-14 items-center justify-between border-b px-4 bg-background">
      <div
        className="font-semibold text-sm cursor-pointer hover:text-primary transition-colors"
        onClick={() => router.push("/")}
      >
        Dexter Agent
      </div>
      <div className="flex items-center gap-2">
        <ModelSelector />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={toggleTheme}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => router.push("/settings")}
        >
          <Settings className="h-3.5 w-3.5" />
          Settings
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={async () => {
            await signOut();
            router.push("/login");
          }}
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </Button>
      </div>
    </header>
  );
}
