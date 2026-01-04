import { useState, useEffect, useRef, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { AdvancedColorPicker } from "@/components/ui/AdvancedColorPicker";
import { TaskList } from "@/components/tasks/TaskList";
import { DueDatePicker } from "@/components/tasks/DueDatePicker";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Note } from "@/types/database.types";
import { useUpdateNote } from "@/hooks/useNotes";
import { useTasks } from "@/hooks/useTasks";
import { Palette, Type, CheckSquare, Check } from "lucide-react";

interface EditNoteModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
}

type NoteMode = "text" | "tasks";

export function EditNoteModal({ note, isOpen, onClose }: EditNoteModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [mode, setMode] = useState<NoteMode>("text");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const updateNote = useUpdateNote();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const saveStatusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  // Check if this note has tasks
  const { data: tasks = [] } = useTasks(note?.id || null);
  const hasTasks = tasks.length > 0;

  useEffect(() => {
    if (note) {
      setTitle(note.title || "");
      setContent(note.content || "");
      setBgColor(note.bg_color || "#ffffff");
      setDueDate(note.due_date || null);
      setShowColorPicker(false);
      // Auto-detect mode based on existing tasks
      // Will be updated when tasks load
    }
  }, [note]);

  // Switch to tasks mode if note has tasks
  useEffect(() => {
    if (hasTasks) {
      setMode("tasks");
    }
  }, [hasTasks]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (saveStatusTimerRef.current) {
        clearTimeout(saveStatusTimerRef.current);
      }
    };
  }, []);

  // Debounced auto-save function
  const debouncedSave = useCallback(
    (
      newTitle: string,
      newContent: string,
      newBgColor: string,
      newDueDate: string | null
    ) => {
      if (!note) return;

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer for 1 second
      debounceTimerRef.current = setTimeout(async () => {
        // Prevent concurrent saves
        if (isSavingRef.current) return;

        // Only save if there are changes
        if (
          newTitle !== (note.title || "") ||
          newContent !== (note.content || "") ||
          newBgColor !== note.bg_color ||
          newDueDate !== note.due_date
        ) {
          isSavingRef.current = true;
          setSaveStatus("saving");
          try {
            await updateNote.mutateAsync({
              id: note.id,
              updates: {
                title: newTitle.trim() || null,
                content: newContent || null,
                bg_color: newBgColor,
                due_date: newDueDate,
              },
            });
            setSaveStatus("saved");
            // Clear "Saved" status after 2 seconds
            if (saveStatusTimerRef.current) {
              clearTimeout(saveStatusTimerRef.current);
            }
            saveStatusTimerRef.current = setTimeout(() => {
              setSaveStatus("idle");
            }, 2000);
          } finally {
            isSavingRef.current = false;
          }
        }
      }, 1000);
    },
    [note, updateNote]
  );

  // Handle title change with auto-save
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    debouncedSave(newTitle, content, bgColor, dueDate);
  };

  // Handle content change with auto-save
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    debouncedSave(title, newContent, bgColor, dueDate);
  };

  // Handle color change with auto-save
  const handleColorChange = (newColor: string) => {
    setBgColor(newColor);
    debouncedSave(title, content, newColor, dueDate);
  };

  // Handle due date change with auto-save
  const handleDueDateChange = (newDueDate: string | null) => {
    setDueDate(newDueDate);
    debouncedSave(title, content, bgColor, newDueDate);
  };

  const handleSave = async () => {
    if (!note) return;

    // Cancel any pending debounced save
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setSaveStatus("saving");
    try {
      await updateNote.mutateAsync({
        id: note.id,
        updates: {
          title: title.trim() || null,
          content: mode === "text" ? content || null : note.content,
          bg_color: bgColor,
          due_date: dueDate,
        },
      });
      setSaveStatus("saved");
    } finally {
      onClose();
    }
  };

  const handleClose = () => {
    // Cancel any pending debounced save
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If a save is already in progress, just close without duplicate save
    // The in-flight save will complete on its own
    if (isSavingRef.current) {
      onClose();
      return;
    }

    if (
      note &&
      (title !== (note.title || "") ||
        content !== (note.content || "") ||
        bgColor !== note.bg_color ||
        dueDate !== note.due_date)
    ) {
      handleSave();
    } else {
      onClose();
    }
  };

  // Format the last edited time
  const formatEditedTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    const time = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    if (isToday) {
      return time;
    }

    // Format: "12 Dec 26, 21:02"
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const year = date.getFullYear().toString().slice(-2);
    return `${day} ${month} ${year}, ${time}`;
  };

  if (!note) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="" bgColor={bgColor}>
      <div className="flex flex-col h-[calc(100vh-8rem)] md:h-auto md:max-h-[70vh]">
        {/* Title input with mode toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Input
            type="text"
            placeholder={mode === "tasks" ? "Task" : "Title"}
            value={title}
            onChange={handleTitleChange}
            className="font-semibold flex-1"
            style={{ backgroundColor: "transparent" }}
          />
        </div>

        {/* Content area - switches based on mode */}
        <div className="flex-1 min-h-0 overflow-y-auto mt-4">
          {mode === "text" ? (
            <RichTextEditor
              content={content}
              onChange={handleContentChange}
              placeholder="Take a note..."
              className="min-h-[200px]"
            />
          ) : (
            <TaskList noteId={note.id} />
          )}
        </div>

        {/* Edited time and save status */}
        <div className="text-right text-xs text-slate-400 py-2 flex-shrink-0 flex items-center justify-end gap-2">
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1 text-blue-500">
              <LoadingSpinner size="sm" className="!w-3 !h-3" />
              <span>Saving...</span>
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-green-500">
              <Check className="w-3 h-3" />
              <span>Saved</span>
            </span>
          )}
          <span>Edited at {formatEditedTime(note.updated_at)}</span>
        </div>

        {/* Toolbar */}
        <div className="border-t border-slate-200 pt-3 flex items-center gap-2 flex-wrap flex-shrink-0">
          {/* Mode toggle buttons */}
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setMode("text")}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm transition-colors ${
                mode === "text"
                  ? "bg-slate-100 text-slate-700"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
              title="Text note"
            >
              <Type className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMode("tasks")}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm transition-colors ${
                mode === "tasks"
                  ? "bg-slate-100 text-slate-700"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
              title="Task list"
            >
              <CheckSquare className="w-4 h-4" />
            </button>
          </div>

          {/* Due date picker - only show for text notes */}
          {mode === "text" && (
            <DueDatePicker dueDate={dueDate} onChange={handleDueDateChange} />
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Color picker - hidden on mobile */}
          <div className="hidden md:block relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors text-sm text-slate-600"
            >
              <Palette className="w-4 h-4" />
              <span>Background</span>
            </button>

            {showColorPicker && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowColorPicker(false)}
                />
                <div className="absolute bottom-full right-0 mb-2 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-4">
                  <AdvancedColorPicker
                    selectedColor={bgColor}
                    onColorChange={handleColorChange}
                  />
                </div>
              </>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );}
