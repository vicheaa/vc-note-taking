import { useState } from "react";
import { Trash2, Pin, Edit3, Calendar, CheckSquare, Square } from "lucide-react";
import { Note } from "@/types/database.types";
import { useDeleteNote, useTogglePin } from "@/hooks/useNotes";
import { useTasks } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
}

export function NoteCard({ note, onEdit }: NoteCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const deleteNote = useDeleteNote();
  const togglePin = useTogglePin();
  const { data: tasks = [] } = useTasks(note.id);

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

  // Format due date for display
  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Check if due date is past
  const isOverdue = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const hasTasks = tasks.length > 0;
  const incompleteTasks = tasks.filter((t) => !t.is_completed);
  const completedTasks = tasks.filter((t) => t.is_completed);

  return (
    <div
      onClick={handleEdit}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md cursor-pointer",
        note.is_pinned && "ring-1 ring-note-yellow-400"
      )}
      style={{ backgroundColor: note.bg_color }}
    >
      {/* Content */}
      <div>
        {/* Title */}
        {note.title && (
          <h3 className="mb-2 font-semibold text-slate-900 line-clamp-2">
            {note.title}
          </h3>
        )}

        {/* Task preview or content */}
        {hasTasks ? (
          <div className="space-y-1.5">
            {/* Show first few incomplete tasks */}
            {incompleteTasks.slice(0, 4).map((task) => (
              <div key={task.id} className="flex items-start gap-2 text-sm">
                <Square className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700 line-clamp-1">{task.content}</span>
              </div>
            ))}
            {/* Show completed count if any */}
            {completedTasks.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CheckSquare className="w-4 h-4 flex-shrink-0" />
                <span>
                  + {completedTasks.length} completed
                </span>
              </div>
            )}
            {/* Show remaining incomplete count */}
            {incompleteTasks.length > 4 && (
              <div className="text-xs text-slate-400">
                + {incompleteTasks.length - 4} more
              </div>
            )}
          </div>
        ) : (
          note.content && (
            <div
              className="text-sm text-slate-700 line-clamp-5 prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-semibold"
              dangerouslySetInnerHTML={{ __html: note.content }}
            />
          )
        )}

        {/* Due date badge */}
        {note.due_date && (
          <div className="mt-3">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md",
                isOverdue(note.due_date)
                  ? "bg-red-50 text-red-600 border border-red-200"
                  : "bg-blue-50 text-blue-600 border border-blue-200"
              )}
            >
              <Calendar className="w-3 h-3" />
              {formatDueDate(note.due_date)}
            </span>
          </div>
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
