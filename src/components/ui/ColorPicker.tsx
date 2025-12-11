import { NOTE_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

export function ColorPicker({
  selectedColor,
  onColorChange,
}: ColorPickerProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {NOTE_COLORS.map((color) => (
        <button
          key={color.value}
          onClick={() => onColorChange(color.value)}
          className={cn(
            "h-8 w-8 rounded-full border-2 transition-all hover:scale-110",
            selectedColor === color.value
              ? "border-slate-900 ring-2 ring-slate-300"
              : "border-slate-200 hover:border-slate-300"
          )}
          style={{ backgroundColor: color.value }}
          title={color.name}
        >
          {selectedColor === color.value && (
            <Check
              className="h-4 w-4 mx-auto"
              style={{ color: color.textColor }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
