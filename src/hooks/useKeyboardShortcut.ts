import { useEffect } from "react";

interface KeyboardShortcutOptions {
  key: string;
  ctrlOrCmd?: boolean;
  shift?: boolean;
  callback: () => void;
}

export function useKeyboardShortcut({
  key,
  ctrlOrCmd = false,
  shift = false,
  callback,
}: KeyboardShortcutOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifierPressed = ctrlOrCmd
        ? isMac
          ? event.metaKey
          : event.ctrlKey
        : true;
      const shiftPressed = shift ? event.shiftKey : !event.shiftKey;

      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        modifierPressed &&
        shiftPressed
      ) {
        event.preventDefault();
        callback();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [key, ctrlOrCmd, shift, callback]);
}
