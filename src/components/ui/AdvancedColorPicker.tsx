import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Copy } from "lucide-react";

interface AdvancedColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  className?: string;
}

// Convert hex to HSV
function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const rgb = hexToRgb(hex);
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  const s = max === 0 ? 0 : diff / max;
  const v = max;

  if (diff !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / diff + 2) / 6;
        break;
      case b:
        h = ((r - g) / diff + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, v: v * 100 };
}

// Convert HSV to hex
function hsvToHex(h: number, s: number, v: number): string {
  s = s / 100;
  v = v / 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r = 0,
    g = 0,
    b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  const toHex = (val: number) => {
    const hex = Math.round((val + m) * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 255, g: 255, b: 255 };
}

// Validate hex color
function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

export function AdvancedColorPicker({
  selectedColor,
  onColorChange,
  className,
}: AdvancedColorPickerProps) {
  const [hsv, setHsv] = useState(() => hexToHsv(selectedColor));
  const [hexInput, setHexInput] = useState(
    selectedColor.toUpperCase().replace("#", "")
  );
  const saturationRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const isDraggingSaturation = useRef(false);
  const isDraggingHue = useRef(false);

  // Sync hsv state when selectedColor changes externally
  useEffect(() => {
    const newHsv = hexToHsv(selectedColor);
    setHsv(newHsv);
    setHexInput(selectedColor.toUpperCase().replace("#", ""));
  }, [selectedColor]);

  const updateColor = useCallback(
    (newHsv: { h: number; s: number; v: number }) => {
      setHsv(newHsv);
      const hex = hsvToHex(newHsv.h, newHsv.s, newHsv.v);
      setHexInput(hex.toUpperCase().replace("#", ""));
      onColorChange(hex);
    },
    [onColorChange]
  );

  // Saturation/Value picker handlers
  const handleSaturationMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDraggingSaturation.current = true;
      handleSaturationMove(e);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hsv.h]
  );

  const handleSaturationMove = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (!saturationRef.current) return;
      const rect = saturationRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
      const s = (x / rect.width) * 100;
      const v = 100 - (y / rect.height) * 100;
      updateColor({ h: hsv.h, s, v });
    },
    [hsv.h, updateColor]
  );

  // Hue slider handlers
  const handleHueMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDraggingHue.current = true;
      handleHueMove(e);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hsv.s, hsv.v]
  );

  const handleHueMove = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (!hueRef.current) return;
      const rect = hueRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const h = (x / rect.width) * 360;
      updateColor({ h, s: hsv.s, v: hsv.v });
    },
    [hsv.s, hsv.v, updateColor]
  );

  // Global mouse events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSaturation.current) {
        handleSaturationMove(e);
      } else if (isDraggingHue.current) {
        handleHueMove(e);
      }
    };

    const handleMouseUp = () => {
      isDraggingSaturation.current = false;
      isDraggingHue.current = false;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleSaturationMove, handleHueMove]);

  // Handle hex input
  const handleHexInputChange = (value: string) => {
    const cleanValue = value.replace("#", "").toUpperCase();
    setHexInput(cleanValue);
    if (cleanValue.length === 6 && isValidHex(`#${cleanValue}`)) {
      const newHsv = hexToHsv(`#${cleanValue}`);
      setHsv(newHsv);
      onColorChange(`#${cleanValue}`);
    }
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(`#${hexInput}`);
  };

  const currentHex = hsvToHex(hsv.h, hsv.s, hsv.v);
  const pureHueColor = hsvToHex(hsv.h, 100, 100);

  return (
    <div className={cn("w-full max-w-sm space-y-3", className)}>
      {/* Saturation/Value Picker */}
      <div
        ref={saturationRef}
        className="relative w-full h-48 rounded-lg cursor-crosshair overflow-hidden"
        style={{ backgroundColor: pureHueColor }}
        onMouseDown={handleSaturationMouseDown}
      >
        {/* White to transparent gradient (left to right) */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to right, white, transparent)",
          }}
        />
        {/* Black to transparent gradient (bottom to top) */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top, black, transparent)",
          }}
        />
        {/* Picker indicator */}
        <div
          className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${hsv.s}%`,
            top: `${100 - hsv.v}%`,
            boxShadow: "0 0 0 1px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)",
          }}
        />
      </div>

      {/* Hue Slider */}
      <div
        ref={hueRef}
        className="relative w-full h-4 rounded-full cursor-pointer"
        style={{
          background:
            "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
        }}
        onMouseDown={handleHueMouseDown}
      >
        {/* Hue indicator */}
        <div
          className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${(hsv.h / 360) * 100}%`,
            top: "50%",
            backgroundColor: pureHueColor,
            boxShadow: "0 0 0 1px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)",
          }}
        />
      </div>

      {/* Hex Input */}
      <div className="flex items-center gap-2">
        {/* Color preview */}
        <div
          className="w-10 h-10 rounded-lg border border-slate-200 flex-shrink-0"
          style={{ backgroundColor: currentHex }}
        />

        {/* Hex input with label */}
        <div className="flex items-center flex-1 border border-slate-200 rounded-lg overflow-hidden bg-white">
          <span className="px-3 text-slate-500 text-sm font-medium">#</span>
          <input
            type="text"
            value={hexInput}
            onChange={(e) => handleHexInputChange(e.target.value)}
            maxLength={6}
            className="flex-1 py-2 pr-2 text-sm font-mono outline-none bg-transparent"
            placeholder="000000"
          />
          <button
            onClick={copyToClipboard}
            className="p-2 hover:bg-slate-100 transition-colors"
            title="Copy hex color"
          >
            <Copy className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Format dropdown (visual only for now) */}
        <div className="flex items-center gap-1 px-3 py-2 bg-slate-100 rounded-lg text-sm">
          <span>Hex</span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
