import { ArrowLeft, Archive } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useArchivedNotes } from "@/hooks/useNotes";
import { ArchiveNoteCard } from "@/components/notes/ArchiveNoteCard";
import { EditNoteModal } from "@/components/notes/EditNoteModal";
import { LoadingContent } from "@/components/ui/LoadingSpinner";
import { Note } from "@/types/database.types";

export function ArchivePage() {
  const { data: archivedNotes, isLoading } = useArchivedNotes();
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-4">
            <Link
              to="/dashboard"
              className="rounded-full p-2 hover:bg-slate-100 transition-colors"
              title="Back to notes"
            >
              <ArrowLeft className="h-5 w-5 text-slate-700" />
            </Link>
            <div className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-slate-700" />
              <h1 className="text-xl font-semibold text-slate-900">Archive</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <LoadingContent text="Loading archived notes..." />
        ) : !archivedNotes || archivedNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Archive className="h-16 w-16 text-slate-300 mb-4" />
            <h2 className="text-lg font-medium text-slate-900 mb-2">No archived notes</h2>
            <p className="text-sm text-slate-500 max-w-sm">
              Notes you archive will appear here. You can archive notes by clicking the archive button on any note.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {archivedNotes.map((note) => (
              <ArchiveNoteCard 
                key={note.id} 
                note={note} 
                onEdit={setEditingNote}
              />
            ))}
          </div>
        )}
      </main>

      {/* Edit Modal for archived notes */}
      <EditNoteModal
        note={editingNote}
        isOpen={!!editingNote}
        onClose={() => setEditingNote(null)}
      />
    </div>
  );
}
