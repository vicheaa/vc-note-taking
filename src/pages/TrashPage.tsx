import { ArrowLeft, Trash2, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useTrashedNotes, useEmptyTrash } from "@/hooks/useNotes";
import { TrashNoteCard } from "@/components/notes/TrashNoteCard";
import { LoadingContent } from "@/components/ui/LoadingSpinner";

export function TrashPage() {
  const { data: trashedNotes, isLoading } = useTrashedNotes();
  const emptyTrash = useEmptyTrash();

  const handleEmptyTrash = () => {
    if (trashedNotes && trashedNotes.length > 0) {
      if (confirm(`Are you sure you want to permanently delete all ${trashedNotes.length} notes in the trash? This cannot be undone.`)) {
        emptyTrash.mutate();
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="rounded-full p-2 hover:bg-slate-100 transition-colors"
                title="Back to notes"
              >
                <ArrowLeft className="h-5 w-5 text-slate-700" />
              </Link>
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-slate-700" />
                <h1 className="text-xl font-semibold text-slate-900">Trash</h1>
              </div>
            </div>

            {trashedNotes && trashedNotes.length > 0 && (
              <button
                onClick={handleEmptyTrash}
                disabled={emptyTrash.isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Empty Trash
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="mb-6 flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">Notes in Trash</p>
            <p>Notes in trash will be automatically deleted after 7 days. You can restore them before they expire.</p>
          </div>
        </div>

        {isLoading ? (
          <LoadingContent text="Loading trashed notes..." />
        ) : !trashedNotes || trashedNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Trash2 className="h-16 w-16 text-slate-300 mb-4" />
            <h2 className="text-lg font-medium text-slate-900 mb-2">Trash is empty</h2>
            <p className="text-sm text-slate-500 max-w-sm">
              Notes you delete will appear here for 7 days before being permanently removed.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {trashedNotes.map((note) => (
              <TrashNoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
