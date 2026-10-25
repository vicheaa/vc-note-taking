import { useEffect, useState } from "react";
import { Note } from "@/types/database.types";
import { NoteEditor } from "./NoteEditor";

interface EditNoteModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectNote?: (note: Note) => void;
  onSearch?: () => void;
}

export function EditNoteModal({ note, isOpen, onClose, onSelectNote, onSearch }: EditNoteModalProps) {
  const [selectedNote, setSelectedNote] = useState(note);
  useEffect(() => { setSelectedNote(note); }, [note]);
  if (!isOpen || !selectedNote) return null;
  return <NoteEditor key={selectedNote.id} note={selectedNote} onClose={onClose} onSearch={onSearch} onSelectNote={(nextNote) => { setSelectedNote(nextNote); onSelectNote?.(nextNote); }} />;
}
