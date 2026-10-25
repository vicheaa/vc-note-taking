import { useEffect, useState } from "react";
import { CheckSquare, Plus } from "lucide-react";
import { Note } from "@/types/database.types";
import { NoteEditor, NoteMode } from "./NoteEditor";

interface CreateNoteInputProps {
  triggerExpand?: boolean;
  onExpanded?: () => void;
  onOpenNote: (note: Note) => void;
  onSearch?: () => void;
}

export function CreateNoteInput({ triggerExpand = false, onExpanded, onOpenNote, onSearch }: CreateNoteInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mode, setMode] = useState<NoteMode>("text");
  useEffect(() => {
    if (triggerExpand) {
      setMode("text");
      setIsExpanded(true);
      onExpanded?.();
    }
  }, [triggerExpand, onExpanded]);

  const openNote = (nextMode: NoteMode) => { setMode(nextMode); setIsExpanded(true); };
  if (isExpanded) {
    return <NoteEditor initialMode={mode} onClose={() => setIsExpanded(false)} onSearch={() => { setIsExpanded(false); onSearch?.(); }} onSelectNote={(note) => { setIsExpanded(false); onOpenNote(note); }} />;
  }
  return (
    <div className="note-composer-dock">
      <button onClick={() => openNote("text")} className="composer-prompt">Take a note...</button>
      <kbd className="composer-shortcut" aria-label="Command or Control N">{navigator.platform.toUpperCase().includes("MAC") ? "⌘" : "⌃"}N</kbd>
      <button className="composer-checklist" title="New checklist" aria-label="New checklist" onClick={() => openNote("tasks")}><CheckSquare size={16} /></button>
      <button className="composer-add" onClick={() => openNote("text")} aria-label="New note" title="New note"><Plus size={20} /></button>
    </div>
  );
}
