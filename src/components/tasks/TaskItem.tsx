import { useState, useRef, useEffect } from "react";
import { GripVertical, X, Calendar } from "lucide-react";
import { Task } from "@/types/database.types";

interface TaskItemProps {
  task: Task;
  onToggle: (id: string, isCompleted: boolean) => void;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onDueDateChange: (id: string, dueDate: string | null) => void;
  isNew?: boolean;
}

export function TaskItem({
  task,
  onToggle,
  onUpdate,
  onDelete,
  onDueDateChange,
  isNew = false,
}: TaskItemProps) {
  const [content, setContent] = useState(task.content);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (isNew && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isNew]);

  // Only sync from props when the input is NOT focused
  // This prevents overwriting user's typing when React Query refetches
  useEffect(() => {
    if (!isFocusedRef.current) {
      setContent(task.content);
    }
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

  const handleBlur = () => {
    isFocusedRef.current = false;
    // Save immediately on blur (when clicking outside or closing modal)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (content !== task.content) {
      onUpdate(task.id, content);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      const date = new Date(value);
      onDueDateChange(task.id, date.toISOString());
    } else {
      onDueDateChange(task.id, null);
    }
  };

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getDateInputValue = () => {
    if (!task.due_date) return "";
    const date = new Date(task.due_date);
    return date.toISOString().split("T")[0];
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
        onFocus={() => { isFocusedRef.current = true; }}
        onBlur={handleBlur}
        placeholder="List item"
        className={`flex-1 bg-transparent border-none outline-none text-sm ${
          task.is_completed ? "text-slate-400 line-through" : "text-slate-700"
        }`}
      />

      {/* Due date badge or picker */}
      {task.due_date ? (
        <div className="flex items-center gap-1 px-1.5 py-0.5 text-xs rounded bg-blue-50 text-blue-600">
          <Calendar className="w-3 h-3" />
          <span>{formatDueDate(task.due_date)}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDueDateChange(task.id, null);
            }}
            className="ml-0.5 hover:bg-blue-100 rounded transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        isHovered && (
          <button
            onClick={() => dateInputRef.current?.showPicker()}
            className="p-1 rounded hover:bg-slate-200 transition-colors"
            title="Add due date"
          >
            <Calendar className="w-4 h-4 text-slate-400" />
          </button>
        )
      )}

      {/* Hidden date input */}
      <input
        ref={dateInputRef}
        type="date"
        value={getDateInputValue()}
        onChange={handleDateChange}
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
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
