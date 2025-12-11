import { Note } from "@/types/database.types";
import { NoteCard } from "./NoteCard";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface NoteGridProps {
  notes: Note[];
  viewMode: "grid" | "list";
  onEditNote: (note: Note) => void;
  isSearching?: boolean;
}

export function NoteGrid({
  notes,
  viewMode,
  onEditNote,
  isSearching = false,
}: NoteGridProps) {
  const pinnedNotes = notes.filter((note) => note.is_pinned);
  const otherNotes = notes.filter((note) => !note.is_pinned);

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        {isSearching ? (
          <>
            <Search className="mb-4 h-16 w-16 text-slate-300" />
            <h3 className="text-xl font-medium text-slate-900 mb-2">
              No notes found
            </h3>
            <p className="text-slate-600">
              Try searching with different keywords
            </p>
          </>
        ) : (
          <>
            <div className="mb-4 text-6xl">📝</div>
            <h3 className="text-xl font-medium text-slate-900 mb-2">
              No notes yet
            </h3>
            <p className="text-slate-600">
              Click "Take a note..." above to create your first note
            </p>
          </>
        )}
      </div>
    );
  }

  const gridClasses = cn(
    "grid gap-4",
    viewMode === "grid"
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      : "grid-cols-1 max-w-2xl mx-auto"
  );

  return (
    <div className="px-4 pb-8">
      {/* Pinned Notes */}
      {pinnedNotes.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-600">
            Pinned
          </h2>
          <div className={gridClasses}>
            {pinnedNotes.map((note) => (
              <NoteCard key={note.id} note={note} onEdit={onEditNote} />
            ))}
          </div>
        </div>
      )}

      {/* Other Notes */}
      {otherNotes.length > 0 && (
        <div>
          {pinnedNotes.length > 0 && (
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-600">
              Others
            </h2>
          )}
          <div className={gridClasses}>
            {otherNotes.map((note) => (
              <NoteCard key={note.id} note={note} onEdit={onEditNote} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
