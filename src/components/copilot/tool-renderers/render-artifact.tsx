"use client";

import { Code2, Globe, Image, Layout } from "lucide-react";

interface RenderArtifactProps {
  args: {
    type: string;
    title: string;
    content: string;
  };
  status: "inProgress" | "complete" | "executing";
}

function ArtifactIcon({ type }: { type: string }) {
  switch (type) {
    case "html":
      return <Globe className="h-5 w-5 text-blue-500" />;
    case "svg":
    case "image":
      // Using an actual lucide icon image class or the icon itself
      // The error is because Image from next/image requires an alt tag if it were Next.js Image
      // Here it's imported from lucide-react, so it's fine but renaming just to be safe
      return <Image className="h-5 w-5 text-purple-500" aria-hidden="true" />;
    case "react":
      return <Layout className="h-5 w-5 text-cyan-500" />;
    case "code":
    case "diff":
    default:
      return <Code2 className="h-5 w-5 text-zinc-500" />;
  }
}

export function RenderArtifact({ args, status }: RenderArtifactProps) {
  const { type, title } = args;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
        <ArtifactIcon type={type} />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">
          {title || "Generating artifact..."}
        </span>
        <span className="text-xs text-muted-foreground">
          {status === "inProgress" || status === "executing"
            ? "Writing content..."
            : "Artifact created"}
        </span>
      </div>
    </div>
  );
}
