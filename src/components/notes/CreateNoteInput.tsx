import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { useCreateNote } from "@/hooks/useNotes";

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

  // Handle keyboard shortcut to expand
  useEffect(() => {
    if (triggerExpand) {
      setIsExpanded(true);
    }
  }, [triggerExpand]);

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
    // Check if content has actual text (not just empty HTML tags)
    const hasContent =
      content && content.replace(/<[^>]*>/g, "").trim().length > 0;

    if (title.trim() || hasContent) {
      await createNote.mutateAsync({
        title: title.trim() || null,
        content: hasContent ? content : null,
        is_pinned: false,
        bg_color: bgColor,
      });
    }
    setTitle("");
    setContent("");
    setIsExpanded(false);
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
          onChange={(e) => setTitle(e.target.value)}
          className="mb-3 border-0 px-0 font-semibold placeholder:font-normal focus-visible:ring-0"
          style={{ backgroundColor: "transparent" }}
        />
        <RichTextEditor
          content={content}
          onChange={setContent}
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
