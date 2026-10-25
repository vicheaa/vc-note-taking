import { useState, useMemo, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { CreateNoteInput } from "@/components/notes/CreateNoteInput";
import { NoteGrid } from "@/components/notes/NoteGrid";
import { EditNoteModal } from "@/components/notes/EditNoteModal";
import { KeyboardHelp } from "@/components/ui/KeyboardHelp";
import { LoadingContent } from "@/components/ui/LoadingSpinner";
import { useNotes } from "@/hooks/useNotes";
import { useTasksForNotes } from "@/hooks/useTasks";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { getNoteKind, notePlainText, NoteFilter } from "@/lib/notePresentation";
import { Note, Task } from "@/types/database.types";

const filters: { value: NoteFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "checklist", label: "Checklists" },
  { value: "code", label: "Code" },
  { value: "link", label: "Links" },
];

export function Dashboard() {
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [activeFilter, setActiveFilter] = useState<NoteFilter>("all");
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [triggerNewNote, setTriggerNewNote] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const { data: notes = [], isLoading, isError, refetch } = useNotes();
  const taskQueries = useTasksForNotes(notes.map((note) => note.id));
  const tasksByNote = new Map<string, Task[]>(notes.map((note, index) => [note.id, taskQueries[index]?.data || []]));

  const openSearch = () => {
    setShowSearch(true);
    searchRef.current?.focus();
  };
  const showAllNotes = () => {
    setShowSearch(false);
    setSearchQuery("");
    setActiveFilter("all");
  };

  useEffect(() => {
    if (showSearch) searchRef.current?.focus();
  }, [showSearch]);

  useKeyboardShortcut({ key: "k", ctrlOrCmd: true, callback: openSearch });
  useKeyboardShortcut({ key: "n", ctrlOrCmd: true, callback: () => setTriggerNewNote(true) });
  useKeyboardShortcut({ key: "/", ctrlOrCmd: true, callback: () => setShowKeyboardHelp(true) });

  const searchedNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return notes;
    return notes.filter((note) => `${note.title || ""} ${notePlainText(note.content)}`.toLowerCase().includes(query));
  }, [notes, searchQuery]);

  const filteredNotes = searchedNotes.filter((note) => activeFilter === "all" || getNoteKind(note, tasksByNote.get(note.id)) === activeFilter);
  const loadingChecklists = activeFilter === "checklist" && taskQueries.some((query) => query.isLoading);

  return (
    <div className="notes-app">
      <Header isSearching={showSearch} onSearchToggle={() => showSearch ? showAllNotes() : openSearch()} onShowNotes={showAllNotes} onNewNote={() => setTriggerNewNote(true)} />
      <div className="notes-workspace">
        <main className="notes-main">
          <header className="notes-page-header">
            <p className="notes-eyebrow">VC NOTES</p>
            <div className="notes-heading-line">
              <h1>All notes</h1>
              <span className="notes-count" aria-live="polite">{filteredNotes.length} {filteredNotes.length === 1 ? "NOTE" : "NOTES"}</span>
            </div>
          </header>
          <div className="notes-filters" role="group" aria-label="Filter notes by type">
            {filters.map((filter) => (
              <button key={filter.value} className={`notes-filter ${activeFilter === filter.value ? "is-active" : ""}`} onClick={() => setActiveFilter(filter.value)} aria-pressed={activeFilter === filter.value}>
                {filter.label}
              </button>
            ))}
          </div>
          {showSearch && (
            <div className="notes-search">
              <Search size={18} />
              <input ref={searchRef} type="search" placeholder="Search your notes..." aria-label="Search your notes" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") showAllNotes(); }} />
              <button onClick={showAllNotes} aria-label="Close search"><X size={17} /></button>
            </div>
          )}
          {isLoading || loadingChecklists ? (
            <LoadingContent text="Loading notes..." />
          ) : isError ? (
            <div className="notes-empty" role="alert">
              <h2>Unable to load your notes</h2>
              <p>Please try again in a moment.</p>
              <button className="notes-filter" onClick={() => refetch()}>Try again</button>
            </div>
          ) : (
            <NoteGrid notes={filteredNotes} tasksByNote={tasksByNote} onEditNote={setEditingNote} isSearching={!!searchQuery.trim() || activeFilter !== "all"} />
          )}
        </main>
      </div>
      {!editingNote && <CreateNoteInput triggerExpand={triggerNewNote} onExpanded={() => setTriggerNewNote(false)} onOpenNote={setEditingNote} onSearch={openSearch} />}
      <EditNoteModal note={editingNote} isOpen={!!editingNote} onClose={() => setEditingNote(null)} onSelectNote={setEditingNote} onSearch={() => { setEditingNote(null); openSearch(); }} />
      <KeyboardHelp isOpen={showKeyboardHelp} onClose={() => setShowKeyboardHelp(false)} />
    </div>
  );
}
