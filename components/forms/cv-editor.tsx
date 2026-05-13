"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Pencil } from "lucide-react";

interface Props {
  value: string;
  onChange: (next: string) => void;
  rows?: number;
}

export function CvEditor({ value, onChange, rows = 22 }: Props) {
  return (
    <Tabs defaultValue="edit">
      <TabsList>
        <TabsTrigger value="edit">
          <Pencil className="mr-2 h-4 w-4" /> Éditer
        </TabsTrigger>
        <TabsTrigger value="preview">
          <Eye className="mr-2 h-4 w-4" /> Aperçu
        </TabsTrigger>
      </TabsList>
      <TabsContent value="edit">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="font-mono text-xs"
          placeholder="# Identité&#10;..."
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Markdown : <code># titre</code>, <code>## section</code>, <code>- puce</code>, <code>**gras**</code>.
        </p>
      </TabsContent>
      <TabsContent value="preview">
        <div className="prose prose-sm dark:prose-invert max-w-none rounded-md border bg-card p-6">
          <MarkdownPreview source={value} />
        </div>
      </TabsContent>
    </Tabs>
  );
}

function MarkdownPreview({ source }: { source: string }) {
  const html = React.useMemo(() => renderMarkdownToHtml(source), [source]);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderMarkdownToHtml(src: string): string {
  if (!src.trim()) {
    return '<p class="text-muted-foreground">Aucun contenu</p>';
  }
  const lines = src.split("\n");
  const html: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine;

    if (/^\s*$/.test(line)) {
      closeList();
      continue;
    }

    const h1 = line.match(/^#\s+(.*)$/);
    const h2 = line.match(/^##\s+(.*)$/);
    const h3 = line.match(/^###\s+(.*)$/);
    const bullet = line.match(/^[-*]\s+(.*)$/);

    if (h1) {
      closeList();
      html.push(`<h1 class="text-2xl font-bold mt-4 mb-2">${inlineFormat(h1[1])}</h1>`);
      continue;
    }
    if (h2) {
      closeList();
      html.push(`<h2 class="text-xl font-semibold mt-4 mb-2">${inlineFormat(h2[1])}</h2>`);
      continue;
    }
    if (h3) {
      closeList();
      html.push(`<h3 class="text-base font-semibold mt-3 mb-1">${inlineFormat(h3[1])}</h3>`);
      continue;
    }
    if (bullet) {
      if (!inList) {
        html.push('<ul class="list-disc pl-6 space-y-1">');
        inList = true;
      }
      html.push(`<li>${inlineFormat(bullet[1])}</li>`);
      continue;
    }
    closeList();
    html.push(`<p class="my-2">${inlineFormat(line)}</p>`);
  }
  closeList();
  return html.join("\n");
}

function inlineFormat(s: string): string {
  let out = escapeHtml(s);
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*(.+?)\*/g, "<em>$1</em>");
  out = out.replace(/`([^`]+)`/g, '<code class="rounded bg-muted px-1 py-0.5 text-[0.85em]">$1</code>');
  return out;
}
