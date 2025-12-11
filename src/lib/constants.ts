export const NOTE_COLORS = [
  { name: "White", value: "#ffffff", textColor: "#0f172a" },
  { name: "Red", value: "#fecaca", textColor: "#0f172a" },
  { name: "Orange", value: "#fed7aa", textColor: "#0f172a" },
  { name: "Yellow", value: "#fef08a", textColor: "#0f172a" },
  { name: "Green", value: "#bbf7d0", textColor: "#0f172a" },
  { name: "Teal", value: "#99f6e4", textColor: "#0f172a" },
  { name: "Blue", value: "#bfdbfe", textColor: "#0f172a" },
  { name: "Purple", value: "#e9d5ff", textColor: "#0f172a" },
  { name: "Pink", value: "#fbcfe8", textColor: "#0f172a" },
  { name: "Gray", value: "#e2e8f0", textColor: "#0f172a" },
] as const;

export type NoteColor = (typeof NOTE_COLORS)[number]["value"];
