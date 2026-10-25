import { AlignLeft, Search } from "lucide-react";
import { Note, Task } from "@/types/database.types";
import { NoteCard } from "./NoteCard";

interface NoteGridProps {
  notes: Note[];
  tasksByNote: Map<string, Task[]>;
  onEditNote: (note: Note) => void;
  isSearching?: boolean;
}

export function NoteGrid({ notes, tasksByNote, onEditNote, isSearching = false }: NoteGridProps) {
  const pinned = notes.filter((note) => note.is_pinned);
  const unpinned = notes.filter((note) => !note.is_pinned).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  const sections = [
    { label: "Pinned", notes: pinned },
    { label: "Recent", notes: unpinned.slice(0, 4) },
    { label: "Earlier", notes: unpinned.slice(4) },
  ];

  if (!notes.length) {
    const Icon = isSearching ? Search : AlignLeft;
    return (
      <div className="notes-empty">
        <div className="notes-empty-icon"><Icon size={24} /></div>
        <h2>{isSearching ? "No matching notes" : "A little space for your thoughts"}</h2>
        <p>{isSearching ? "Try another filter or a different search." : "Take a note below to get started."}</p>
      </div>
    );
  }

  return (
    <div className="note-sections">
      {sections.filter((section) => section.notes.length > 0).map((section) => (
        <section className="note-section" key={section.label} aria-labelledby={`section-${section.label.toLowerCase()}`}>
          <h2 className={`note-section-label ${section.label === "Pinned" ? "is-pinned" : ""}`} id={`section-${section.label.toLowerCase()}`}>{section.label}</h2>
          <div className="note-list">
            {section.notes.map((note, index) => (
              <NoteCard key={note.id} note={note} tasks={tasksByNote.get(note.id) || []} onEdit={onEditNote} featured={section.label === "Recent" && index === 0} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
