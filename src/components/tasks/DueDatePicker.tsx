import { useState, useRef, useEffect } from "react";
import { Calendar, X } from "lucide-react";

interface DueDatePickerProps {
  dueDate: string | null;
  onChange: (date: string | null) => void;
}

export function DueDatePicker({ dueDate, onChange }: DueDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      // Convert to ISO string with timezone
      const date = new Date(value);
      onChange(date.toISOString());
    } else {
      onChange(null);
    }
    setIsOpen(false);
  };

  const handleClearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  // Get date value for input (YYYY-MM-DD format)
  const getInputValue = () => {
    if (!dueDate) return "";
    const date = new Date(dueDate);
    return date.toISOString().split("T")[0];
  };

  const formattedDate = formatDate(dueDate);

  return (
    <div className="relative">
      {dueDate ? (
        <div className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-blue-50 text-blue-600 border border-blue-200">
          <Calendar className="w-3 h-3" />
          <span>{formattedDate}</span>
          <button
            onClick={handleClearDate}
            className="ml-1 p-0.5 hover:bg-blue-100 rounded transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.showPicker(), 0);
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors text-sm text-slate-600"
        >
          <Calendar className="w-4 h-4" />
          <span>Add due date</span>
        </button>
      )}

      {/* Hidden date input */}
      <input
        ref={inputRef}
        type="date"
        value={getInputValue()}
        onChange={handleDateChange}
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
        onBlur={() => setIsOpen(false)}
      />
    </div>
  );
}
