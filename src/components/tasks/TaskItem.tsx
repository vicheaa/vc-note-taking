import { useState, useRef, useEffect } from "react";
import { GripVertical, X } from "lucide-react";
import { Task } from "@/types/database.types";

interface TaskItemProps {
  task: Task;
  onToggle: (id: string, isCompleted: boolean) => void;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  isNew?: boolean;
}

export function TaskItem({
  task,
  onToggle,
  onUpdate,
  onDelete,
  isNew = false,
}: TaskItemProps) {
  const [content, setContent] = useState(task.content);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isNew && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isNew]);

  useEffect(() => {
    setContent(task.content);
  }, [task.content]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Debounced auto-save
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      if (newContent !== task.content) {
        onUpdate(task.id, newContent);
      }
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Save immediately on enter
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (content !== task.content) {
        onUpdate(task.id, content);
      }
    }
  };

  return (
    <div
      className="group flex items-center gap-2 py-1.5 px-1 -mx-1 rounded-md hover:bg-slate-50 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Drag handle */}
      <button
        className="cursor-grab opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4 text-slate-400" />
      </button>

      {/* Checkbox */}
      <input
        type="checkbox"
        checked={task.is_completed}
        onChange={() => onToggle(task.id, task.is_completed)}
        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
      />

      {/* Content input */}
      <input
        ref={inputRef}
        type="text"
        value={content}
        onChange={handleContentChange}
        onKeyDown={handleKeyDown}
        placeholder="List item"
        className={`flex-1 bg-transparent border-none outline-none text-sm ${
          task.is_completed ? "text-slate-400 line-through" : "text-slate-700"
        }`}
      />

      {/* Delete button */}
      {isHovered && (
        <button
          onClick={() => onDelete(task.id)}
          className="p-1 rounded hover:bg-slate-200 transition-colors"
          title="Delete task"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      )}
    </div>
  );
}
