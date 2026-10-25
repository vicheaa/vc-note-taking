import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import type { Editor } from "@tiptap/core";
import type { Transaction } from "@tiptap/pm/state";
import { useState, useEffect, useRef, ReactNode } from "react";
import { Bold, List, ListOrdered, Heading1, Heading2, Palette, Type, CheckSquare, ImagePlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdvancedColorPicker } from "./AdvancedColorPicker";
import { NoteImage } from "./NoteImage";
import { IMAGE_ACCEPT, uploadNoteImage, validateNoteImage } from "@/lib/noteImages";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  editorClassName?: string;
  variant?: "inline" | "workspace";
  mode?: "text" | "tasks";
  onModeChange?: (mode: "text" | "tasks") => void;
  disabled?: boolean;
  onUploadStateChange?: (uploading: boolean) => void;
  onImageUploaded?: (path: string) => void;
  children?: ReactNode;
}

export function RichTextEditor({ content, onChange, placeholder = "Start typing...", className, editorClassName, variant = "inline", mode = "text", onModeChange, disabled = false, onUploadStateChange, onImageUploaded, children }: RichTextEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState("#354cff");
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploadRef = useRef<(files: File[], target: Editor) => void>(() => {});
  const readOnlyRef = useRef(disabled || mode === "tasks");
  readOnlyRef.current = disabled || mode === "tasks";
  const isWorkspace = variant === "workspace";
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2] }, link: false }),
      TextStyle,
      Color,
      NoteImage,
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: { class: "underline decoration-current", target: "_blank", rel: "noopener noreferrer" },
      }),
    ],
    content,
    autofocus: isWorkspace && content && mode === "text" ? "end" : false,
    shouldRerenderOnTransaction: true,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files || []).filter((file) => file.type.startsWith("image/"));
        if (!files.length) return false;
        event.preventDefault();
        if (editor && !readOnlyRef.current) uploadRef.current(files, editor);
        return true;
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false;
        const files = Array.from(event.dataTransfer?.files || []).filter((file) => file.type.startsWith("image/"));
        if (!files.length) return false;
        event.preventDefault();
        if (editor && !readOnlyRef.current) {
          const position = view.posAtCoords({ left: event.clientX, top: event.clientY });
          if (position) editor.commands.setTextSelection(position.pos);
          uploadRef.current(files, editor);
        }
        return true;
      },
      attributes: {
        class: cn("prose prose-sm max-w-none focus:outline-none min-h-[200px] px-3 py-2", isWorkspace && "editor-prose", editorClassName),
        role: "textbox",
        "aria-label": "Note content",
        "aria-multiline": "true",
      },
    },
  });

  uploadRef.current = async (files, target) => {
    if (uploadingRef.current || readOnlyRef.current || !files.length) return;
    setUploadError(null);
    try { files.forEach(validateNoteImage); }
    catch (error) { setUploadError(error instanceof Error ? error.message : "Unable to upload photo."); return; }
    uploadingRef.current = true;
    setIsUploading(true);
    onUploadStateChange?.(true);
    // Follow edits made while the network upload is in progress.
    let bookmark = target.state.selection.getBookmark();
    const mapSelection = ({ transaction }: { transaction: Transaction }) => { bookmark = bookmark.map(transaction.mapping); };
    target.on("transaction", mapSelection);
    try {
      for (const file of files) {
        const path = await uploadNoteImage(file);
        if (target.isDestroyed) return;
        const selection = bookmark.resolve(target.state.doc);
        target.chain().insertContentAt({ from: selection.from, to: selection.to }, [
          { type: "image", attrs: { storagePath: path, alt: file.name || "Pasted photo" } },
          // Leave a text cursor after the photo so the next file cannot replace it.
          { type: "paragraph" },
        ]).run();
        onImageUploaded?.(path);
        bookmark = target.state.selection.getBookmark();
      }
    } catch (error) {
      if (!target.isDestroyed) setUploadError(error instanceof Error ? error.message : "Unable to upload photo. Please try again.");
    } finally {
      target.off("transaction", mapSelection);
      uploadingRef.current = false;
      onUploadStateChange?.(false);
      if (!target.isDestroyed) setIsUploading(false);
    }
  };

  useEffect(() => {
    if (editor && content !== editor.getHTML()) editor.commands.setContent(content, { emitUpdate: false });
  }, [content, editor]);
  useEffect(() => { editor?.setEditable(!disabled, false); }, [editor, disabled]);
  useEffect(() => {
    if (!showColorPicker) return;
    const dismiss = (event: PointerEvent) => {
      if (!colorPickerRef.current?.contains(event.target as Node)) setShowColorPicker(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); setShowColorPicker(false); } };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", escape); };
  }, [showColorPicker]);

  if (!editor) return null;

  const formattingButtons = [
    { label: "Bold", Icon: Bold, active: editor.isActive("bold"), action: () => editor.chain().focus().toggleBold().run() },
    { label: "Heading 1", Icon: Heading1, active: editor.isActive("heading", { level: 1 }), action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: "Heading 2", Icon: Heading2, active: editor.isActive("heading", { level: 2 }), action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "Bullet list", Icon: List, active: editor.isActive("bulletList"), action: () => editor.chain().focus().toggleBulletList().run() },
    { label: "Numbered list", Icon: ListOrdered, active: editor.isActive("orderedList"), action: () => editor.chain().focus().toggleOrderedList().run() },
  ];

  return (
    <div className={cn("flex flex-col", isWorkspace && "workspace-rich-editor", className)}>
      <div className={isWorkspace ? "editor-formatbar" : "sticky top-0 z-10 flex items-center gap-1 rounded-md bg-slate-100 p-2 shadow-sm"} role="toolbar" aria-label="Note formatting">
        {isWorkspace && <>
          <button className={`editor-format-button ${mode === "text" ? "is-active" : ""}`} title="Text note" aria-label="Text note" aria-pressed={mode === "text"} disabled={disabled} onClick={() => onModeChange?.("text")}><Type size={19} /></button>
          <button className={`editor-format-button ${mode === "tasks" ? "is-active" : ""}`} title="Checklist" aria-label="Checklist" aria-pressed={mode === "tasks"} disabled={disabled} onClick={() => { setShowColorPicker(false); onModeChange?.("tasks"); }}><CheckSquare size={16} /></button>
          <span className="editor-format-divider" />
        </>}
        {formattingButtons.map(({ label, Icon, active, action }) => <button key={label} type="button" onClick={action} onMouseDown={(event) => event.preventDefault()} title={label} aria-label={label} aria-pressed={active} disabled={disabled || mode === "tasks"} className={cn(isWorkspace ? "editor-format-button" : "rounded p-2 transition-colors hover:bg-slate-200", active && (isWorkspace ? "is-active" : "bg-slate-200"))}><Icon size={16} /></button>)}
        <span className={isWorkspace ? "editor-format-divider" : "mx-1 h-6 w-px bg-slate-200"} />
        <div ref={colorPickerRef} className="relative">
          <button type="button" onClick={() => setShowColorPicker(!showColorPicker)} onMouseDown={(event) => event.preventDefault()} title="Text color" aria-label="Text color" aria-expanded={showColorPicker} disabled={disabled || mode === "tasks"} className={cn(isWorkspace ? "editor-format-button" : "flex items-center gap-1 rounded p-2 hover:bg-slate-200", showColorPicker && "is-active")}>
            {!isWorkspace && <Palette size={16} />}
            <span className={isWorkspace ? "editor-color-dot" : "h-3 w-3 rounded-full border border-slate-300"} style={{ backgroundColor: currentColor }} />
          </button>
          {showColorPicker && <div className={isWorkspace ? "editor-color-popover" : "absolute left-0 top-full z-50 mt-2 rounded-xl border border-slate-200 bg-white p-4 shadow-xl"} role="dialog" aria-label="Text color picker" onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setShowColorPicker(false); } }}>
            <AdvancedColorPicker selectedColor={currentColor} onColorChange={(color) => { setCurrentColor(color); editor.chain().focus().setColor(color).run(); }} />
          </div>}
        </div>
        <button type="button" onClick={() => fileInputRef.current?.click()} onMouseDown={(event) => event.preventDefault()} title="Upload photo (or paste from clipboard)" aria-label="Upload photo" disabled={disabled || mode === "tasks" || isUploading} className={isWorkspace ? "editor-format-button" : "rounded p-2 hover:bg-slate-200"}>
          {isUploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
        </button>
      </div>
      <input ref={fileInputRef} type="file" accept={IMAGE_ACCEPT} multiple hidden aria-label="Choose photos" onChange={(event) => {
        const files = Array.from(event.target.files || []);
        event.target.value = "";
        uploadRef.current(files, editor);
      }} />
      {isUploading && <p className="note-photo-feedback" role="status">Optimizing and uploading photos… Keep this note open until the upload finishes.</p>}
      {uploadError && <p className="note-photo-feedback is-error" role="alert">{uploadError}</p>}
      <div hidden={mode === "tasks"}>
        <EditorContent editor={editor} className={cn(
          "[&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:outline-none [&_.ProseMirror]:px-3 [&_.ProseMirror]:py-2",
          "[&_.ProseMirror_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child]:before:text-slate-400 [&_.ProseMirror_p.is-editor-empty:first-child]:before:float-left [&_.ProseMirror_p.is-editor-empty:first-child]:before:h-0 [&_.ProseMirror_p.is-editor-empty:first-child]:before:pointer-events-none",
          "[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:ml-6 [&_.ProseMirror_ul]:pl-2 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:ml-6 [&_.ProseMirror_ol]:pl-2",
          "[&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:mb-2 [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:mb-2 [&_.ProseMirror_p]:mb-1 [&_.ProseMirror_a]:underline"
        )} />
      </div>
      {mode === "tasks" && children}
    </div>
  );
}
