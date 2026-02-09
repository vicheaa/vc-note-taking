import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { AdvancedColorPicker } from "./AdvancedColorPicker";
import {
  Bold,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Palette,
} from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  editorClassName?: string;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Start typing...",
  className,
  editorClassName,
}: RichTextEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState("#000000");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
      }),
      TextStyle,
      Color,
      Placeholder.configure({
        placeholder: placeholder,
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: "underline decoration-current cursor-pointer",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none min-h-[200px] px-3 py-2",
          "prose-a:text-inherit prose-a:no-underline",
          editorClassName
        ),
      },
    },
  });

  // Sync content when it changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const handleColorChange = useCallback(
    (color: string) => {
      setCurrentColor(color);
      if (editor) {
        editor.chain().focus().setColor(color).run();
      }
    },
    [editor]
  );

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({
    onClick,
    isActive,
    children,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "p-2 rounded hover:bg-slate-100 transition-colors",
        isActive && "bg-slate-200 text-slate-900"
      )}
    >
      {children}
    </button>
  );

  return (
    <div
      className={cn(
        "flex flex-col",
        className
      )}
    >
      {/* Toolbar - Sticky at top when scrolling */}
      <div className="sticky top-0 z-10 flex items-center gap-1 p-2 bg-slate-100 flex-wrap rounded-md shadow-sm">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          isActive={editor.isActive("heading", { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        {/* Text Color */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="Text Color"
            className={cn(
              "p-2 rounded hover:bg-slate-100 transition-colors flex items-center gap-1",
              showColorPicker && "bg-slate-200"
            )}
          >
            <Palette className="w-4 h-4" />
            <div
              className="w-3 h-3 rounded-full border border-slate-300"
              style={{ backgroundColor: currentColor }}
            />
          </button>

          {/* Color picker popover */}
          {showColorPicker && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowColorPicker(false)}
              />
              <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-4">
                <AdvancedColorPicker
                  selectedColor={currentColor}
                  onColorChange={handleColorChange}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Editor Content */}
      <div className="bg-white">
        <EditorContent
          editor={editor}
          className={cn(
            "[&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:outline-none [&_.ProseMirror]:px-3 [&_.ProseMirror]:py-2",
            // Placeholder styling
            "[&_.ProseMirror_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
            "[&_.ProseMirror_p.is-editor-empty:first-child]:before:text-slate-400",
            "[&_.ProseMirror_p.is-editor-empty:first-child]:before:float-left",
            "[&_.ProseMirror_p.is-editor-empty:first-child]:before:h-0",
            "[&_.ProseMirror_p.is-editor-empty:first-child]:before:pointer-events-none",
            // List styling - bullet lists
            "[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:ml-6 [&_.ProseMirror_ul]:pl-2",
            "[&_.ProseMirror_ul_li]:pl-1",
            // List styling - ordered lists
            "[&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:ml-6 [&_.ProseMirror_ol]:pl-2",
            "[&_.ProseMirror_ol_li]:pl-1",
            // Heading styling
            "[&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:mb-2",
            "[&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:mb-2",
            // Paragraph styling
            "[&_.ProseMirror_p]:mb-1",
            // Link styling
            "[&_.ProseMirror_a]:underline [&_.ProseMirror_a]:decoration-current [&_.ProseMirror_a]:cursor-pointer"
          )}
        />
      </div>
    </div>
  );
}

