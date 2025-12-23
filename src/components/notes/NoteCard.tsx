import { useState } from "react";
import { Trash2, Pin, Edit3 } from "lucide-react";
import { Note } from "@/types/database.types";
import { useDeleteNote, useTogglePin } from "@/hooks/useNotes";
import { cn } from "@/lib/utils";

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
}

export function NoteCard({ note, onEdit }: NoteCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const deleteNote = useDeleteNote();
  const togglePin = useTogglePin();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Move this note to trash?")) {
      deleteNote.mutate(note.id);
    }
  };

  const handlePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePin.mutate({ id: note.id, isPinned: note.is_pinned });
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(note);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md cursor-pointer",
        note.is_pinned && "ring-1 ring-note-yellow-400"
      )}
      style={{ backgroundColor: note.bg_color }}
    >
      {/* Content */}
      <div onClick={handleEdit}>
        {note.title && (
          <h3 className="mb-2 font-semibold text-slate-900 line-clamp-2">
            {note.title}
          </h3>
        )}
        {note.content && (
          <div
            className="text-sm text-slate-700 line-clamp-5 prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-semibold"
            dangerouslySetInnerHTML={{ __html: note.content }}
          />
        )}
      </div>

      {/* Action Icons */}
      {isHovered && (
        <div className="absolute bottom-2 right-2 flex gap-1 bg-white rounded-md shadow-sm p-1">
          <button
            onClick={handlePin}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              note.is_pinned
                ? "text-note-yellow-600 hover:bg-note-yellow-50"
                : "text-slate-600 hover:bg-slate-100"
            )}
            title={note.is_pinned ? "Unpin note" : "Pin note"}
          >
            <Pin
              className="h-4 w-4"
              fill={note.is_pinned ? "currentColor" : "none"}
            />
          </button>
          <button
            onClick={handleEdit}
            className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 transition-colors"
            title="Edit note"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            className="rounded-md p-1.5 text-red-600 hover:bg-red-50 transition-colors"
            title="Delete note"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
