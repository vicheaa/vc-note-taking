import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/Input";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { useCreateNote, useUpdateNote } from "@/hooks/useNotes";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const createdNoteIdRef = useRef<string | null>(null);
  const isSavingRef = useRef(false);

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
        } else {
          // Create new note
          const result = await createNote.mutateAsync({
            title: newTitle.trim() || null,
            content: hasContent ? newContent : null,
            is_pinned: false,
            bg_color: bgColor,
          });
          if (result?.id) {
            createdNoteIdRef.current = result.id;
          }
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

    // Check if content has actual text (not just empty HTML tags)
    const hasContent =
      content && content.replace(/<[^>]*>/g, "").trim().length > 0;

    // Only save if there's content and note hasn't been created yet
    if ((title.trim() || hasContent) && !createdNoteIdRef.current) {
      await createNote.mutateAsync({
        title: title.trim() || null,
        content: hasContent ? content : null,
        is_pinned: false,
        bg_color: bgColor,
      });
    } else if (createdNoteIdRef.current && (title.trim() || hasContent)) {
      // Final update for existing note
      await updateNote.mutateAsync({
        id: createdNoteIdRef.current,
        updates: {
          title: title.trim() || null,
          content: hasContent ? content : null,
          bg_color: bgColor,
        },
      });
    }
    setTitle("");
    setContent("");
    setIsExpanded(false);
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
        <div className="flex justify-end mt-3">
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
