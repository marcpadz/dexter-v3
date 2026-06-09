"use client";

import { useWorkspaceStore } from "../workspace-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Globe, RefreshCw, ExternalLink, Loader2 } from "lucide-react";

export default function BrowserSurface() {
  const {
    browserUrl,
    browserStatus,
    browserScreenshot,
    setBrowserUrl,
    setBrowserStatus,
    setBrowserScreenshot,
  } = useWorkspaceStore();

  const handleNavigate = (url: string) => {
    if (!url.startsWith("http")) url = "https://" + url;
    setBrowserUrl(url);
    setBrowserStatus("loading");
    // The agent's browse_web tool will set screenshot/status via CopilotKit action
  };

  return (
    <div className="space-y-3">
      {/* URL bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={browserUrl === "about:blank" ? "" : browserUrl}
            placeholder="Enter URL..."
            className="h-8 pl-8 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleNavigate((e.target as HTMLInputElement).value);
              }
            }}
            onChange={(e) => setBrowserUrl(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => handleNavigate(browserUrl)}
          disabled={browserStatus === "loading"}
        >
          {browserStatus === "loading" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {/* Browser viewport */}
      <div className="border rounded-lg overflow-hidden bg-muted/10 aspect-video flex items-center justify-center">
        {browserStatus === "loading" ? (
          <div className="flex flex-col items-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mb-2" />
            <p className="text-xs">Loading...</p>
          </div>
        ) : browserScreenshot ? (
          <img
            src={`data:image/png;base64,${browserScreenshot}`}
            alt="Browser screenshot"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center text-muted-foreground">
            <Globe className="h-8 w-8 mb-2" />
            <p className="text-sm">No page loaded</p>
            <p className="text-xs">Ask Dexter to browse a URL</p>
          </div>
        )}
      </div>

      {/* Open external link */}
      {browserUrl && browserUrl !== "about:blank" && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={() => window.open(browserUrl, "_blank")}
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          Open in browser
        </Button>
      )}
    </div>
  );
}
