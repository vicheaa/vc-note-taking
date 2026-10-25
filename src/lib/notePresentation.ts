import { Note, Task } from "@/types/database.types";

export type NoteKind = "text" | "checklist" | "code" | "link";
export type NoteFilter = "all" | "checklist" | "code" | "link";

export function notePlainText(content: string | null): string {
  if (!content) return "";
  const document = new DOMParser().parseFromString(content, "text/html");
  document.querySelectorAll("br").forEach((node) => node.replaceWith(" "));
  document.querySelectorAll("p, div, li, pre, h1, h2, h3").forEach((node) => node.append(" "));
  return (document.body.textContent || "").replace(/\s+/g, " ").trim();
}

export function noteHasContent(content: string | null): boolean {
  return !!notePlainText(content) || !!(content && new DOMParser().parseFromString(content, "text/html").querySelector("img"));
}

export function notePreview(content: string | null): string {
  return notePlainText(content) || (noteHasContent(content) ? "Photo" : "");
}

export function getNoteKind(note: Note, tasks: Task[] = []): NoteKind {
  if (tasks.length || localStorage.getItem(`note-mode-${note.id}`) === "tasks") return "checklist";
  const content = note.content || "";
  const title = note.title || "";
  if (/<(?:pre|code)[\s>]|```/i.test(content) || /\b(command|code|script|branch)\b/i.test(title) || /^(?:\$\s|flutter |dart |npm |npx |git |pnpm |yarn |shorebird )/i.test(notePlainText(content))) {
    return "code";
  }
  if (/<a\s[^>]*href=/i.test(content) || /(?:https?:\/\/|www\.)\S+/i.test(content) || /\blinks?\b/i.test(title)) {
    return "link";
  }
  return "text";
}

export function formatNoteDate(date: string): string {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "";
  const day = value.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const time = value.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${day} · ${time}`;
}
