import { useState, useEffect, useRef } from "react";
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title || "");
      setContent(note.content || "");
      setBgColor(note.bg_color || "#ffffff");
    }
  }, [note]);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = "auto";
      // Set height to scrollHeight, capped by max-height (CSS handles the cap)
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [content]);

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
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Note" bgColor={bgColor}>
      <div className="space-y-4">
        <Input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="font-semibold"
          style={{ backgroundColor: "transparent" }}
        />
        <Textarea
          ref={textareaRef}
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[100px] md:max-h-[60vh] max-h-[90vh] overflow-y-auto resize-none"
          style={{ backgroundColor: "transparent" }}
        />
        <div className="border-t border-slate-200 pt-3 hidden md:block">
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

