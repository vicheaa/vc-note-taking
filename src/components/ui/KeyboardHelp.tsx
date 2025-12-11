import { Modal } from "./Modal";
import { X } from "lucide-react";

interface KeyboardHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardHelp({ isOpen, onClose }: KeyboardHelpProps) {
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const modKey = isMac ? "⌘" : "Ctrl";

  const shortcuts = [
    { keys: `${modKey} + K`, description: "Focus search bar" },
    { keys: `${modKey} + N`, description: "Create new note" },
    { keys: `${modKey} + /`, description: "Show keyboard shortcuts" },
    { keys: "Esc", description: "Close modals and inputs" },
    { keys: `${modKey} + Enter`, description: "Save note (in edit mode)" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-xl font-semibold text-slate-900">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50"
            >
              <span className="text-slate-700">{shortcut.description}</span>
              <kbd className="px-3 py-1 text-sm font-semibold text-slate-900 bg-slate-100 border border-slate-200 rounded-lg">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>

        <div className="text-sm text-slate-500 text-center pt-2 border-t border-slate-200">
          Press{" "}
          <kbd className="px-2 py-1 text-xs bg-slate-100 border border-slate-200 rounded">
            Esc
          </kbd>{" "}
          or click outside to close
        </div>
      </div>
    </Modal>
  );
}
