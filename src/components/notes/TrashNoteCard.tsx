import { RotateCcw, Trash2 } from "lucide-react";
import { Note } from "@/types/database.types";
import { useRestoreNote, usePermanentDeleteNote } from "@/hooks/useNotes";
import { cn } from "@/lib/utils";

interface TrashNoteCardProps {
  note: Note;
}

export function TrashNoteCard({ note }: TrashNoteCardProps) {
  const restoreNote = useRestoreNote();
  const permanentDeleteNote = usePermanentDeleteNote();

  const handleRestore = (e: React.MouseEvent) => {
    e.stopPropagation();
    restoreNote.mutate(note.id);
  };

  const handlePermanentDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to permanently delete this note? This cannot be undone.")) {
      permanentDeleteNote.mutate(note.id);
    }
  };

  // Calculate days remaining before auto-deletion
  const getDaysRemaining = () => {
    if (!note.deleted_at) return 0;
    const deletedDate = new Date(note.deleted_at);
    const expiryDate = new Date(deletedDate);
    expiryDate.setDate(expiryDate.getDate() + 7);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const daysRemaining = getDaysRemaining();

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
      className={cn(
        "group relative rounded-lg border border-slate-200 bg-white p-4 opacity-75 hover:opacity-100 transition-opacity"
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

      {/* Days remaining badge */}
      <div className="absolute top-2 right-2">
        <span className={cn(
          "text-xs px-2 py-1 rounded-full font-medium",
          daysRemaining <= 1 
            ? "bg-red-100 text-red-700" 
            : daysRemaining <= 3 
              ? "bg-amber-100 text-amber-700"
              : "bg-slate-100 text-slate-600"
        )}>
          {daysRemaining} {daysRemaining === 1 ? "day" : "days"} left
        </span>
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-2 right-2 flex gap-1 bg-white rounded-md shadow-sm p-1">
        <button
          onClick={handleRestore}
          disabled={restoreNote.isPending}
          className="rounded-md p-1.5 text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
          title="Restore note"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          onClick={handlePermanentDelete}
          disabled={permanentDeleteNote.isPending}
          className="rounded-md p-1.5 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          title="Delete forever"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
