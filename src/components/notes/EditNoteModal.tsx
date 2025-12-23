import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { AdvancedColorPicker } from "@/components/ui/AdvancedColorPicker";
import { Button } from "@/components/ui/Button";
import { Note } from "@/types/database.types";
import { useUpdateNote } from "@/hooks/useNotes";
import { Palette } from "lucide-react";

interface EditNoteModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditNoteModal({ note, isOpen, onClose }: EditNoteModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const updateNote = useUpdateNote();

  useEffect(() => {
    if (note) {
      setTitle(note.title || "");
      setContent(note.content || "");
      setBgColor(note.bg_color || "#ffffff");
      setShowColorPicker(false);
    }
  }, [note]);

  const handleSave = async () => {
    if (!note) return;

    await updateNote.mutateAsync({
      id: note.id,
      updates: {
        title: title.trim() || null,
        content: content || null,
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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Note"
      bgColor={bgColor}
    >
      <div className="space-y-4">
        <Input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="font-semibold"
          style={{ backgroundColor: "transparent" }}
        />
        <RichTextEditor
          content={content}
          onChange={setContent}
          placeholder="Take a note..."
          className="min-h-[300px] md:max-h-[60vh] max-h-[90vh] overflow-y-auto"
        />
        <div className="border-t border-slate-200 pt-3 hidden md:block relative">
          {/* Background color picker toggle button */}
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors text-sm text-slate-600"
          >
            <div
              className="w-5 h-5 rounded-full border-2 border-slate-300"
              style={{ backgroundColor: bgColor }}
            />
            <Palette className="w-4 h-4" />
            <span>Background color</span>
          </button>

          {/* Advanced color picker popover (floats above content) */}
          {showColorPicker && (
            <>
              {/* Backdrop to close picker when clicking outside */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowColorPicker(false)}
              />
              {/* Floating color picker */}
              <div className="absolute bottom-full left-0 mb-2 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-4">
                <AdvancedColorPicker
                  selectedColor={bgColor}
                  onColorChange={setBgColor}
                />
              </div>
            </>
          )}
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
