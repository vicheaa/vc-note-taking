import { AlignLeft, Archive, Link2, Pin, Square, Terminal, Trash2 } from "lucide-react";
import { Note, Task } from "@/types/database.types";
import { useDeleteNote, useTogglePin, useArchiveNote } from "@/hooks/useNotes";
import { formatNoteDate, getNoteKind, notePreview } from "@/lib/notePresentation";

interface NoteCardProps {
  note: Note;
  tasks: Task[];
  onEdit: (note: Note) => void;
  featured?: boolean;
}

const icons = { text: AlignLeft, checklist: Square, code: Terminal, link: Link2 };

export function NoteCard({ note, tasks, onEdit, featured = false }: NoteCardProps) {
  const deleteNote = useDeleteNote();
  const togglePin = useTogglePin();
  const archiveNote = useArchiveNote();
  const kind = getNoteKind(note, tasks);
  const Icon = icons[kind];
  const completed = tasks.filter((task) => task.is_completed).length;
  const preview = kind === "checklist" ? (tasks.find((task) => !task.is_completed) || tasks[0])?.content : notePreview(note.content);
  const isPending = deleteNote.isPending || togglePin.isPending || archiveNote.isPending;

  return (
    <article className={`note-row ${featured ? "note-row--featured" : ""}`}>
      <button className="note-row-open" onClick={() => onEdit(note)} aria-label={`Open ${note.title || "Untitled note"}`}>
        <span className="note-type-icon"><Icon size={16} strokeWidth={1.7} /></span>
        <span className="note-row-copy">
          <span className="note-row-title">{note.title || "Untitled note"}</span>
          <span className={`note-row-preview ${kind === "code" || kind === "link" ? "is-monospace" : ""}`}>{preview || "No additional text"}</span>
        </span>
        <span className="note-row-meta">
          {kind === "checklist" ? <span aria-label={`${completed} of ${tasks.length} tasks completed`}><span className="task-completed-count">{completed}</span>/{tasks.length}</span> : featured ? formatNoteDate(note.updated_at) : kind === "link" ? "LINK" : kind.toUpperCase()}
        </span>
      </button>
      <div className="note-row-actions" aria-label={`Actions for ${note.title || "Untitled note"}`}>
        <button title={note.is_pinned ? "Unpin note" : "Pin note"} aria-label={note.is_pinned ? "Unpin note" : "Pin note"} aria-pressed={note.is_pinned} disabled={isPending} onClick={() => togglePin.mutate({ id: note.id, isPinned: note.is_pinned })}><Pin size={15} fill={note.is_pinned ? "currentColor" : "none"} /></button>
        <button title="Archive note" aria-label="Archive note" disabled={isPending} onClick={() => archiveNote.mutate(note.id)}><Archive size={15} /></button>
        <button title="Move to trash" aria-label="Move to trash" className="note-delete-action" disabled={isPending} onClick={() => { if (confirm("Move this note to trash?")) deleteNote.mutate(note.id); }}><Trash2 size={15} /></button>
      </div>
      {(deleteNote.isError || togglePin.isError || archiveNote.isError) && <p className="note-action-error" role="alert">Unable to update this note. Please try again.</p>}
    </article>
  );
}
