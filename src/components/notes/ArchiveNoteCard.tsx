import { ArchiveRestore, Pin, PinOff } from "lucide-react";
import { Note } from "@/types/database.types";
import { useUnarchiveNote, useTogglePin } from "@/hooks/useNotes";
import { cn } from "@/lib/utils";

interface ArchiveNoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
}

export function ArchiveNoteCard({ note, onEdit }: ArchiveNoteCardProps) {
  const unarchiveNote = useUnarchiveNote();
  const togglePin = useTogglePin();

  const handleUnarchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    unarchiveNote.mutate(note.id);
  };

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePin.mutate({ id: note.id, isPinned: note.is_pinned });
  };

  const truncateContent = (text: string | null, maxLines: number = 3) => {
    if (!text) return "";
    const lines = text.split("\n");
    if (lines.length > maxLines) {
      return lines.slice(0, maxLines).join("\n") + "...";
    }
    return text;
  };

  return (
    <div
      onClick={() => onEdit(note)}
      className={cn(
        "group relative rounded-lg border border-slate-200 bg-white p-4 cursor-pointer hover:shadow-md transition-all"
      )}
      style={{ backgroundColor: note.bg_color }}
    >
      {/* Content */}
      <div className="mb-8">
        {note.title && (
          <h3 className="mb-2 font-semibold text-slate-900 line-clamp-2">
            {note.title}
          </h3>
        )}
        {note.content && (
          <p className="text-sm text-slate-700 whitespace-pre-wrap line-clamp-3">
            {truncateContent(note.content)}
          </p>
        )}
      </div>

      {/* Pin badge */}
      {note.is_pinned && (
        <div className="absolute top-2 right-2">
          <Pin className="h-4 w-4 text-slate-500 fill-current" />
        </div>
      )}

      {/* Action Buttons */}
      <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-md shadow-sm p-1">
        <button
          onClick={handleUnarchive}
          disabled={unarchiveNote.isPending}
          className="rounded-md p-1.5 text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
          title="Unarchive note"
        >
          <ArchiveRestore className="h-4 w-4" />
        </button>
        <button
          onClick={handleTogglePin}
          disabled={togglePin.isPending}
          className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
          title={note.is_pinned ? "Unpin note" : "Pin note"}
        >
          {note.is_pinned ? (
            <PinOff className="h-4 w-4" />
          ) : (
            <Pin className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
