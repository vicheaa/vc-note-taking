import { useState, useRef, useEffect } from "react";
import { GripVertical, X, Calendar } from "lucide-react";
import { Task } from "@/types/database.types";

export interface TaskItemProps {
  task: Task;
  onToggle: (id: string, isCompleted: boolean) => void;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onDueDateChange: (id: string, dueDate: string | null) => void;
  isNew?: boolean;
  dragHandleProps?: Record<string, unknown>;
  isDragging?: boolean;
}

export function TaskItem({
  task,
  onToggle,
  onUpdate,
  onDelete,
  onDueDateChange,
  isNew = false,
  dragHandleProps,
  isDragging = false,
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
      className={`group flex items-center gap-2.5 py-2 px-2 -mx-2 rounded-lg transition-all duration-200 ease-out
        ${isDragging ? "bg-slate-200 shadow-lg ring-2 ring-blue-300" : isHovered ? "bg-slate-100/80 shadow-sm" : "hover:bg-slate-50"}
        ${task.is_completed ? "opacity-75" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Drag handle */}
      <button
        className={`cursor-grab active:cursor-grabbing transition-all duration-200 hover:scale-110 touch-none
          ${dragHandleProps ? "opacity-40 hover:opacity-100" : "opacity-0 group-hover:opacity-40 hover:!opacity-100"}`}
        title="Drag to reorder"
        {...dragHandleProps}
      >
        <GripVertical className="w-4 h-4 text-slate-400" />
      </button>

      {/* Custom Checkbox */}
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          checked={task.is_completed}
          onChange={() => onToggle(task.id, task.is_completed)}
          className="peer sr-only"
          id={`task-${task.id}`}
        />
        <label
          htmlFor={`task-${task.id}`}
          className={`flex items-center justify-center w-5 h-5 rounded-full border-2 cursor-pointer transition-all duration-200
            ${task.is_completed 
              ? "bg-gradient-to-br from-emerald-400 to-emerald-500 border-emerald-500 shadow-sm shadow-emerald-200" 
              : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"}`}
        >
          {task.is_completed && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </label>
      </div>

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
        className={`flex-1 bg-transparent border-none outline-none text-sm transition-colors duration-200 ${
          task.is_completed 
            ? "text-slate-400 line-through decoration-slate-300" 
            : "text-slate-700 placeholder:text-slate-400"
        }`}
      />

      {/* Due date badge or picker */}
      {task.due_date ? (
        <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 border border-blue-100 shadow-sm">
          <Calendar className="w-3 h-3" />
          <span>{formatDueDate(task.due_date)}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDueDateChange(task.id, null);
            }}
            className="ml-0.5 p-0.5 hover:bg-blue-100 rounded-full transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => dateInputRef.current?.showPicker()}
          className={`p-1.5 rounded-lg transition-all duration-200 ${
            isHovered 
              ? "opacity-100 hover:bg-slate-200 hover:scale-110" 
              : "opacity-0"
          }`}
          title="Add due date"
        >
          <Calendar className="w-4 h-4 text-slate-400" />
        </button>
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
      <button
        onClick={() => onDelete(task.id)}
        className={`p-1.5 rounded-lg transition-all duration-200 ${
          isHovered 
            ? "opacity-100 hover:bg-red-100 hover:scale-110" 
            : "opacity-0"
        }`}
        title="Delete task"
      >
        <X className={`w-4 h-4 transition-colors ${isHovered ? "text-red-400 hover:text-red-500" : "text-slate-400"}`} />
      </button>
    </div>
  );
}
