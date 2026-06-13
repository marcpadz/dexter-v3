import Link from "next/link";
import { Bot } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-2">
        <Bot className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="text-6xl font-bold tracking-tight">404</h1>
      <p className="text-muted-foreground text-lg">This page doesn&apos;t exist.</p>
      <Link
        href="/chat"
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Back to Chat
      </Link>
    </div>
  );
}
