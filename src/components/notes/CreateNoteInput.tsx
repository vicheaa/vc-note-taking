import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/Input";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useCreateNote, useUpdateNote } from "@/hooks/useNotes";
import { Check } from "lucide-react";

interface CreateNoteInputProps {
  triggerExpand?: boolean;
}

export function CreateNoteInput({
  triggerExpand = false,
}: CreateNoteInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [bgColor] = useState("#ffffff");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const containerRef = useRef<HTMLDivElement>(null);
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const createdNoteIdRef = useRef<string | null>(null);
  const isSavingRef = useRef(false);
  const isCreatingRef = useRef(false); // Track if a CREATE operation is in progress

  // Handle keyboard shortcut to expand
  useEffect(() => {
    if (triggerExpand) {
      setIsExpanded(true);
    }
  }, [triggerExpand]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Reset created note ID when collapsing
  useEffect(() => {
    if (!isExpanded) {
      createdNoteIdRef.current = null;
    }
  }, [isExpanded]);

  // Debounced auto-save function
  const debouncedSave = useCallback(
    async (newTitle: string, newContent: string) => {
      // Check if content has actual text (not just empty HTML tags)
      const hasContent =
        newContent && newContent.replace(/<[^>]*>/g, "").trim().length > 0;

      // Only save if there's actual content
      if (!newTitle.trim() && !hasContent) return;

      // Prevent concurrent saves
      if (isSavingRef.current) return;
      isSavingRef.current = true;

      try {
        if (createdNoteIdRef.current) {
          // Update existing note
          await updateNote.mutateAsync({
            id: createdNoteIdRef.current,
            updates: {
              title: newTitle.trim() || null,
              content: hasContent ? newContent : null,
              bg_color: bgColor,
            },
          });
        } else if (!isCreatingRef.current) {
          // Create new note only if not already creating
          isCreatingRef.current = true;
          const result = await createNote.mutateAsync({
            title: newTitle.trim() || null,
            content: hasContent ? newContent : null,
            is_pinned: false,
            bg_color: bgColor,
          });
          if (result?.id) {
            createdNoteIdRef.current = result.id;
          }
          isCreatingRef.current = false;
        }
      } finally {
        isSavingRef.current = false;
      }
    },
    [bgColor, createNote, updateNote]
  );

  // Trigger debounced save on content change
  const triggerDebouncedSave = useCallback(
    (newTitle: string, newContent: string) => {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer for 1 second
      debounceTimerRef.current = setTimeout(() => {
        debouncedSave(newTitle, newContent);
      }, 1000);
    },
    [debouncedSave]
  );

  // Handle title change with auto-save
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    triggerDebouncedSave(newTitle, content);
  };

  // Handle content change with auto-save
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    triggerDebouncedSave(title, newContent);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded, title, content]);

  const handleClose = async () => {
    // Cancel any pending debounced save
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If a save or create is already in progress, just close without creating duplicate
    // The in-flight operation will complete and handle the note creation/update
    if (isSavingRef.current || isCreatingRef.current) {
      setTitle("");
      setContent("");
      setIsExpanded(false);
      setSaveStatus("idle");
      return;
    }

    // Check if content has actual text (not just empty HTML tags)
    const hasContent =
      content && content.replace(/<[^>]*>/g, "").trim().length > 0;

    // Only save if there's content and note hasn't been created yet
    if ((title.trim() || hasContent) && !createdNoteIdRef.current) {
      isCreatingRef.current = true; // Prevent race condition
      setSaveStatus("saving");
      try {
        await createNote.mutateAsync({
          title: title.trim() || null,
          content: hasContent ? content : null,
          is_pinned: false,
          bg_color: bgColor,
        });
        setSaveStatus("saved");
      } finally {
        isCreatingRef.current = false;
      }
    } else if (createdNoteIdRef.current && (title.trim() || hasContent)) {
      // Final update for existing note
      setSaveStatus("saving");
      await updateNote.mutateAsync({
        id: createdNoteIdRef.current,
        updates: {
          title: title.trim() || null,
          content: hasContent ? content : null,
          bg_color: bgColor,
        },
      });
      setSaveStatus("saved");
    }
    setTitle("");
    setContent("");
    setIsExpanded(false);
    setSaveStatus("idle");
    createdNoteIdRef.current = null;
  };

  if (!isExpanded) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-slate-500 shadow-sm hover:shadow-md transition-shadow"
        >
          Take a note...
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div
        ref={containerRef}
        className="rounded-lg border border-slate-200 p-4 shadow-md transition-colors"
        style={{ backgroundColor: bgColor }}
      >
        <Input
          type="text"
          placeholder="Title"
          value={title}
          onChange={handleTitleChange}
          className="mb-3 border-0 px-0 font-semibold placeholder:font-normal focus-visible:ring-0"
          style={{ backgroundColor: "transparent" }}
        />
        <RichTextEditor
          content={content}
          onChange={handleContentChange}
          placeholder="Take a note..."
          className="min-h-[100px] border-0"
        />
        <div className="flex justify-end items-center gap-2 mt-3">
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1 text-xs text-blue-500">
              <LoadingSpinner size="sm" className="!w-3 !h-3" />
              <span>Saving...</span>
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-xs text-green-500">
              <Check className="w-3 h-3" />
              <span>Saved</span>
            </span>
          )}
          <button
            onClick={handleClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
