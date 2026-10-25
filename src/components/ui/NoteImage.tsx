import { useEffect, useState } from "react";
import Image from "@tiptap/extension-image";
import { NodeViewProps, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { signNoteImage } from "@/lib/noteImages";

function NoteImageView({ node, selected }: NodeViewProps) {
  const path = node.attrs.storagePath as string | null;
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setUrl(null);
    setFailed(false);
    if (!path) return;
    const refresh = async () => {
      try {
        const signedUrl = await signNoteImage(path);
        if (active) { setUrl(signedUrl); setFailed(false); }
      } catch {
        if (active) setFailed(true);
      }
    };
    void refresh();
    const interval = window.setInterval(() => { void refresh(); }, 50 * 60 * 1000);
    return () => { active = false; window.clearInterval(interval); };
  }, [path, attempt]);

  const source = path ? url : node.attrs.src as string | null;
  return <NodeViewWrapper className={`note-image ${selected ? "is-selected" : ""}`} contentEditable={false}>
    {failed ? <div className="note-image-status" role="alert">Unable to load photo. <button type="button" onClick={() => { setFailed(false); setAttempt((value) => value + 1); }}>Retry</button></div>
      : source ? <img src={source} alt={node.attrs.alt || "Note photo"} title={node.attrs.title || undefined} onError={() => setFailed(true)} />
        : <div className="note-image-status" role="status">Loading photo…</div>}
  </NodeViewWrapper>;
}

// Persist the object path, not a signed URL that expires after the note is saved.
export const NoteImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      storagePath: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-storage-path"),
        renderHTML: (attributes) => attributes.storagePath ? { "data-storage-path": attributes.storagePath } : {},
      },
    };
  },
  parseHTML() {
    return [{ tag: "img[data-storage-path]" }, ...(this.parent?.() || [])];
  },
  addNodeView() { return ReactNodeViewRenderer(NoteImageView); },
}).configure({ allowBase64: false });
