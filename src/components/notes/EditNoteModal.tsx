import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { Button } from "@/components/ui/Button";
import { Note } from "@/types/database.types";
import { useUpdateNote } from "@/hooks/useNotes";

interface EditNoteModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditNoteModal({ note, isOpen, onClose }: EditNoteModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [bgColor, setBgColor] = useState("#ffffff");
  const updateNote = useUpdateNote();

  useEffect(() => {
    if (note) {
      setTitle(note.title || "");
      setContent(note.content || "");
      setBgColor(note.bg_color || "#ffffff");
    }
  }, [note]);

  const handleSave = async () => {
    if (!note) return;

    await updateNote.mutateAsync({
      id: note.id,
      updates: {
        title: title.trim() || null,
        content: content.trim() || null,
        bg_color: bgColor,
      },
    });
    onClose();
  };

  const handleClose = () => {
    // Auto-save on close
    if (
      note &&
      (title !== (note.title || "") ||
        content !== (note.content || "") ||
        bgColor !== note.bg_color)
    ) {
      handleSave();
    } else {
      onClose();
    }
  };

  if (!note) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Note">
      <div className="space-y-4" style={{ backgroundColor: bgColor }}>
        <Input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="font-semibold"
          style={{ backgroundColor: "transparent" }}
        />
        <Textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[200px]"
          style={{ backgroundColor: "transparent" }}
        />
        <div className="border-t border-slate-200 pt-3">
          <ColorPicker selectedColor={bgColor} onColorChange={setBgColor} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateNote.isPending}>
            {updateNote.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
