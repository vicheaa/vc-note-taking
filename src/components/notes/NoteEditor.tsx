import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { Check, List, Pin, Plus, Trash2, X } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { DueDatePicker } from "@/components/tasks/DueDatePicker";
import { TaskList } from "@/components/tasks/TaskList";
import { useCreateNote, useDeleteNote, useNotes, useTogglePin, useUpdateNote } from "@/hooks/useNotes";
import { useCreateTask, useTasks } from "@/hooks/useTasks";
import { getNoteKind, noteHasContent, notePlainText, notePreview } from "@/lib/notePresentation";
import { deleteNoteImages, getNoteImagePaths } from "@/lib/noteImages";
import { Note } from "@/types/database.types";

export type NoteMode = "text" | "tasks";

interface NoteEditorProps {
  note?: Note | null;
  initialMode?: NoteMode;
  onClose: () => void;
  onSelectNote: (note: Note) => void;
  onSearch?: () => void;
}

type Draft = { title: string | null; content: string | null; due_date: string | null };

function editedDate(value: string) {
  const date = new Date(value);
  const day = date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${day} · ${time}`;
}

export function NoteEditor({ note = null, initialMode = "text", onClose, onSelectNote, onSearch }: NoteEditorProps) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [dueDate, setDueDate] = useState(note?.due_date || null);
  const [savedNote, setSavedNote] = useState(note);
  const [mode, setMode] = useState<NoteMode>(() => {
    const savedMode = note && localStorage.getItem(`note-mode-${note.id}`);
    return savedMode === "tasks" || savedMode === "text" ? savedMode : initialMode;
  });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const [initialTaskId, setInitialTaskId] = useState<string | null>(null);
  const { data: notes = [] } = useNotes();
  const { data: tasks = [] } = useTasks(savedNote?.id || null);
  const { mutateAsync: createNote } = useCreateNote();
  const { mutateAsync: updateNote } = useUpdateNote();
  const deleteNote = useDeleteNote();
  const togglePin = useTogglePin();
  const createTask = useCreateTask();
  const noteRef = useRef(note);
  const shellRef = useRef<HTMLDivElement>(null);
  const showRecentRef = useRef(false);
  showRecentRef.current = showRecent;
  const leavingRef = useRef(false);
  const uploadingRef = useRef(false);
  const uploadedImagePathsRef = useRef(new Set<string>());
  const pendingImageDeletesRef = useRef(new Set<string>());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queueRef = useRef<Promise<Note | null>>(Promise.resolve(note));
  const draftRef = useRef<Draft>({ title: note?.title || null, content: note?.content || null, due_date: note?.due_date || null });
  const lastSavedRef = useRef(JSON.stringify(draftRef.current));
  draftRef.current = { title: title.trim() || null, content: noteHasContent(content) ? content : null, due_date: dueDate };

  const cleanRemovedImages = async () => {
    const pending = [...pendingImageDeletesRef.current];
    if (!pending.length) return true;
    try {
      await deleteNoteImages(pending);
      pending.forEach((path) => pendingImageDeletesRef.current.delete(path));
      return true;
    } catch {
      setSaveError("Your note was saved, but a removed photo could not be deleted from storage. Click Retry to try again.");
      return false;
    }
  };

  // Queue every save, including the final save before changing notes or leaving.
  const saveDraft = useCallback((draft: Draft, forceCreate = false) => {
    const serialized = JSON.stringify(draft);
    const save = queueRef.current.catch(() => null).then(async () => {
      const currentImagePaths = new Set(getNoteImagePaths(draft.content));
      uploadedImagePathsRef.current.forEach((path) => {
        if (!currentImagePaths.has(path)) pendingImageDeletesRef.current.add(path);
      });
      if (!noteRef.current && !forceCreate && !draft.title && !draft.content) {
        await cleanRemovedImages();
        return null;
      }
      if (noteRef.current && serialized === lastSavedRef.current) {
        await cleanRemovedImages();
        return noteRef.current;
      }
      setSaveStatus("saving");
      setSaveError(null);
      try {
        const previousContent = noteRef.current?.content || null;
        const result = noteRef.current
          ? await updateNote({ id: noteRef.current.id, updates: draft })
          : await createNote({ ...draft, bg_color: "#ffffff", is_pinned: false });
        const savedImagePaths = new Set(getNoteImagePaths(result.content));
        getNoteImagePaths(previousContent).forEach((path) => {
          if (!savedImagePaths.has(path)) pendingImageDeletesRef.current.add(path);
        });
        uploadedImagePathsRef.current.forEach((path) => {
          if (savedImagePaths.has(path)) uploadedImagePathsRef.current.delete(path);
          else pendingImageDeletesRef.current.add(path);
        });
        noteRef.current = result;
        lastSavedRef.current = serialized;
        setSavedNote(result);
        setSaveStatus("saved");
        await cleanRemovedImages();
        return result;
      } catch (error) {
        setSaveStatus("idle");
        setSaveError("Unable to save your note. Your changes are still here. Try again.");
        throw error;
      }
    });
    queueRef.current = save;
    return save;
  }, [createNote, updateNote]);

  useEffect(() => {
    if (isLeaving) return;
    timerRef.current = setTimeout(() => { void saveDraft(draftRef.current).catch(() => {}); }, 800);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [title, content, dueDate, isLeaving, saveDraft]);

  useEffect(() => {
    if (note && tasks.length && !localStorage.getItem(`note-mode-${note.id}`)) setMode("tasks");
  }, [note, tasks.length]);

  useEffect(() => {
    if (savedNote) {
      // Wait for existing tasks before storing a default mode for an older note.
      if (!note || localStorage.getItem(`note-mode-${savedNote.id}`)) localStorage.setItem(`note-mode-${savedNote.id}`, mode);
    }
  }, [savedNote, mode, note]);

  const finish = async (action: () => void | Promise<void>) => {
    if (uploadingRef.current) {
      setSaveError("Please wait for your photos to finish uploading before leaving this note.");
      return false;
    }
    if (leavingRef.current) return false;
    leavingRef.current = true;
    setIsLeaving(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    try {
      await saveDraft(draftRef.current);
      await action();
      return true;
    } catch {
      setSaveError("Unable to save your note. Your changes are still here. Try again.");
      return false;
    } finally {
      leavingRef.current = false;
      setIsLeaving(false);
    }
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === "Escape") {
        if (document.querySelector('[aria-label="Text color picker"]')) return;
        event.preventDefault();
        if (showRecentRef.current) { setShowRecent(false); return; }
        void finishRef.current(onClose);
      }
      if (event.key === "Tab") {
        const focusable = Array.from(shellRef.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), [contenteditable="true"]') || []).filter((element) => element.getClientRects().length);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        void finishRef.current(onClose);
      }
      // Keep the dashboard's new-note shortcut from opening a second editor.
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        event.stopImmediatePropagation();
        void finishRef.current(onSearch || onClose);
      }
    };
    const previousOverflow = document.body.style.overflow;
    const background = Array.from(document.body.children).filter((element): element is HTMLElement => element instanceof HTMLElement && element !== shellRef.current);
    const previousInert = background.map((element) => element.inert);
    background.forEach((element) => { element.inert = true; });
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      background.forEach((element, index) => { element.inert = previousInert[index]; });
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [onClose, onSearch]);

  const changeMode = (nextMode: NoteMode) => {
    setMode(nextMode);
    if (noteRef.current) localStorage.setItem(`note-mode-${noteRef.current.id}`, nextMode);
  };

  const handlePin = async () => {
    if (togglePin.isPending || leavingRef.current) return;
    await finish(async () => {
      const current = await saveDraft(draftRef.current, true);
      if (!current) return;
      const result = await togglePin.mutateAsync({ id: current.id, isPinned: current.is_pinned });
      noteRef.current = result;
      setSavedNote(result);
    });
  };

  const handleDelete = () => {
    if (uploadingRef.current) {
      setSaveError("Please wait for your photos to finish uploading before leaving this note.");
      return;
    }
    if (!noteRef.current && !draftRef.current.title && !draftRef.current.content) { onClose(); return; }
    if (!confirm("Move this note to trash?")) return;
    void finish(async () => {
      if (noteRef.current) await deleteNote.mutateAsync(noteRef.current.id);
      onClose();
    });
  };

  const addFirstTask = async () => {
    if (createTask.isPending || leavingRef.current) return;
    await finish(async () => {
      const current = await saveDraft(draftRef.current, true);
      if (!current) return;
      localStorage.setItem(`note-mode-${current.id}`, "tasks");
      const task = await createTask.mutateAsync({ note_id: current.id, content: "", position: 0 });
      setInitialTaskId(task.id);
    });
  };

  const historyNotes = notes.filter((item) => item.id !== savedNote?.id)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  const wordText = mode === "tasks" ? tasks.map((task) => task.content).join(" ") : notePlainText(content);
  const wordCount = wordText.trim() ? wordText.trim().split(/\s+/).length : 0;

  return createPortal(
    <div ref={shellRef} className="notes-app note-editor-shell" role="dialog" aria-modal="true" aria-label="Note editor">
      <Header isSearching={false} onShowNotes={() => { void finish(() => { onClose(); navigate("/dashboard"); }); }} onSearchToggle={() => { void finish(onSearch || onClose); }} onNavigate={(path) => { void finish(() => { onClose(); navigate(path); }); }} beforeSignOut={() => finish(() => {})} />
      <div className="note-editor-workspace">
        {showRecent && <button className="editor-recent-backdrop" aria-label="Close note history" onClick={() => setShowRecent(false)} />}
        <aside className={`editor-recent ${showRecent ? "is-open" : ""}`} aria-label="Note history">
          <div className="editor-recent-heading"><h2>History</h2><button aria-label="Close note history" onClick={() => setShowRecent(false)}><X size={16} /></button></div>
          <nav aria-label="Note history list">
            <button className="editor-recent-note is-current" aria-current="page" title={title || "Untitled"}>
              <span>{title || "Untitled"}</span><p>{notePreview(content) || (mode === "tasks" ? "Checklist" : "No additional text")}</p>
            </button>
            {historyNotes.map((item) => <button key={item.id} className="editor-recent-note" onClick={() => { void finish(() => onSelectNote(item)); }} title={item.title || "Untitled"} aria-label={`Open note ${item.title || "Untitled"}`} disabled={isLeaving}>
              <span>{item.title || "Untitled"}</span><p className={getNoteKind(item) === "code" || getNoteKind(item) === "link" ? "is-monospace" : ""}>{notePreview(item.content) || "No additional text"}</p>
            </button>)}
          </nav>
        </aside>
        <section className="editor-document" aria-label="Note editor" aria-busy={isLeaving}>
          <header className="editor-topbar">
            <div className="editor-breadcrumb"><button className="editor-recent-toggle" aria-label="Show note history" aria-expanded={showRecent} onClick={() => setShowRecent(!showRecent)}><List size={18} /></button><button onClick={() => { void finish(onClose); }}>Notes</button><span>/</span><span className="editor-breadcrumb-title">{title || "Untitled"}</span></div>
            <div className="editor-topbar-actions">
              <button className={`editor-icon-button ${savedNote?.is_pinned ? "is-pinned" : ""}`} title={savedNote?.is_pinned ? "Unpin note" : "Pin note"} aria-label={savedNote?.is_pinned ? "Unpin note" : "Pin note"} aria-pressed={!!savedNote?.is_pinned} disabled={isLeaving} onClick={handlePin}><Pin size={18} fill={savedNote?.is_pinned ? "currentColor" : "none"} /></button>
              <button className="editor-icon-button" title="Move to trash" aria-label="Move to trash" disabled={isLeaving} onClick={handleDelete}><Trash2 size={17} /></button>
              <button className="editor-done" onClick={() => { void finish(onClose); }} disabled={isLeaving}>{isLeaving ? "Saving..." : "Done"}</button>
            </div>
          </header>
          {saveError && <div className="editor-save-error" role="alert">{saveError}<button onClick={() => { void saveDraft(draftRef.current).catch(() => {}); }}>Retry</button></div>}
          <div className="editor-scroll-area">
            <div className="editor-writing-area">
              <input className="editor-title-input" aria-label="Note title" placeholder="Untitled" autoFocus={!note} value={title} onChange={(event) => setTitle(event.target.value)} disabled={isLeaving} />
              {dueDate && <div className="editor-due-date"><DueDatePicker dueDate={dueDate} onChange={setDueDate} /></div>}
              <RichTextEditor content={content} onChange={(nextContent) => {
                draftRef.current.content = noteHasContent(nextContent) ? nextContent : null;
                setContent(nextContent);
              }} placeholder="Start writing..." variant="workspace" mode={mode} onModeChange={changeMode} disabled={isLeaving} onImageUploaded={(path) => uploadedImagePathsRef.current.add(path)} onUploadStateChange={(uploading) => {
                uploadingRef.current = uploading;
                if (!uploading) setSaveError((error) => error?.startsWith("Please wait for your photos") ? null : error);
              }}>
                {savedNote ? <TaskList key={savedNote.id} noteId={savedNote.id} initialTaskId={initialTaskId} /> : <button className="editor-first-task" onClick={addFirstTask} disabled={isLeaving}><Plus size={20} /> Add item</button>}
              </RichTextEditor>
            </div>
          </div>
          <footer className="editor-footer">
            <span>{savedNote ? `Edited ${editedDate(savedNote.updated_at)}` : "Draft"}</span><span aria-hidden="true">·</span><span>{wordCount} {wordCount === 1 ? "word" : "words"}</span>
            {saveStatus === "saving" && <span className="editor-save-status" role="status"><LoadingSpinner size="sm" /> Saving</span>}
            {saveStatus === "saved" && <span className="editor-save-status is-saved" role="status"><Check size={12} /> Saved</span>}
          </footer>
        </section>
      </div>
    </div>, document.body
  );
}
