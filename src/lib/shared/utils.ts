export function generateChatTitle(text: string): string {
  if (!text.trim()) return "New Chat";
  const cleaned = text.trim().replace(/\n/g, " ");
  if (cleaned.length <= 60) return cleaned;
  return cleaned.slice(0, 57) + "...";
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
