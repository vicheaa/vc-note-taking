import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { CreateNoteInput } from "@/components/notes/CreateNoteInput";
import { NoteGrid } from "@/components/notes/NoteGrid";
import { EditNoteModal } from "@/components/notes/EditNoteModal";
import { KeyboardHelp } from "@/components/ui/KeyboardHelp";
import { useNotes } from "@/hooks/useNotes";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { Note } from "@/types/database.types";

export function Dashboard() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [triggerNewNote, setTriggerNewNote] = useState(false);
  const { data: notes, isLoading } = useNotes();

  // Keyboard shortcuts
  useKeyboardShortcut({
    key: "k",
    ctrlOrCmd: true,
    callback: () => {
      // Focus search will be handled in Header
      const searchInput = document.querySelector(
        'input[type="text"]'
      ) as HTMLInputElement;
      searchInput?.focus();
    },
  });

  useKeyboardShortcut({
    key: "n",
    ctrlOrCmd: true,
    callback: () => {
      setTriggerNewNote(true);
      setTimeout(() => setTriggerNewNote(false), 100);
    },
  });

  useKeyboardShortcut({
    key: "/",
    ctrlOrCmd: true,
    callback: () => {
      setShowKeyboardHelp(true);
    },
  });

  // Filter notes based on search query
  const filteredNotes = useMemo(() => {
    if (!notes) return [];
    if (!searchQuery.trim()) return notes;

    const query = searchQuery.toLowerCase();
    return notes.filter((note) => {
      const titleMatch = note.title?.toLowerCase().includes(query);
      const contentMatch = note.content?.toLowerCase().includes(query);
      return titleMatch || contentMatch;
    });
  }, [notes, searchQuery]);

  return (
    <div className="min-h-screen bg-white">
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="mx-auto max-w-7xl">
        <CreateNoteInput triggerExpand={triggerNewNote} />

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="text-slate-600">Loading notes...</div>
          </div>
        ) : (
          <NoteGrid
            notes={filteredNotes}
            viewMode={viewMode}
            onEditNote={setEditingNote}
            isSearching={!!searchQuery.trim()}
          />
        )}
      </main>

      <EditNoteModal
        note={editingNote}
        isOpen={!!editingNote}
        onClose={() => setEditingNote(null)}
      />

      <KeyboardHelp
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />
    </div>
  );
}
