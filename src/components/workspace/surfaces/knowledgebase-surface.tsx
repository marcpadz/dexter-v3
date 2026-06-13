"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  FileText,
  ExternalLink,
  BookOpen,
  Loader2,
} from "lucide-react";

interface SearchResult {
  id: string;
  content: string;
  score: number;
  sourceDocument: string;
}

export default function KnowledgebaseSurface() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedKbId, setSelectedKbId] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    // Simulated search — replace with real API call
    setTimeout(() => {
      setResults([
        {
          id: "1",
          content: "Sample result for: " + query,
          score: 0.92,
          sourceDocument: "documentation.md",
        },
      ]);
      setSearching(false);
    }, 800);
  };

  if (!selectedKbId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <h3 className="text-sm font-medium mb-1">No Knowledgebase Selected</h3>
        <p className="text-xs text-muted-foreground max-w-[240px]">
          Select a knowledgebase from Settings to search and browse its documents.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search knowledgebase..."
          className="pl-8 h-9 text-sm"
        />
      </div>

      {searching && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!searching && results.length > 0 && (
        <div className="space-y-3">
          {results.map((r) => (
            <div
              key={r.id}
              className="p-3 rounded-lg border border-border bg-background"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {(r.score * 100).toFixed(0)}% match
                </Badge>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {r.sourceDocument}
                </span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {r.content}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] gap-1 mt-2 px-1.5"
              >
                <ExternalLink className="h-3 w-3" /> View Source
              </Button>
            </div>
          ))}
        </div>
      )}

      {!searching && results.length === 0 && query && (
        <p className="text-xs text-muted-foreground text-center py-4">
          No results found. Try a different query.
        </p>
      )}
    </div>
  );
}
