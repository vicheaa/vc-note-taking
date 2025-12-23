export interface Note {
  id: string;
  user_id: string;
  title: string | null;
  content: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  bg_color: string;
  deleted_at: string | null;
  due_date: string | null;
}

export interface NoteInsert {
  title?: string | null;
  content?: string | null;
  is_pinned?: boolean;
  bg_color?: string;
  user_id?: string;
  due_date?: string | null;
}

export interface NoteUpdate {
  title?: string | null;
  content?: string | null;
  is_pinned?: boolean;
  bg_color?: string;
  updated_at?: string;
  deleted_at?: string | null;
  due_date?: string | null;
}

// Task types for todo items within notes
export interface Task {
  id: string;
  note_id: string;
  content: string;
  is_completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface TaskInsert {
  note_id: string;
  content: string;
  is_completed?: boolean;
  position?: number;
}

export interface TaskUpdate {
  content?: string;
  is_completed?: boolean;
  position?: number;
  updated_at?: string;
}

export type Database = {
  public: {
    Tables: {
      notes: {
        Row: Note;
        Insert: NoteInsert;
        Update: NoteUpdate;
      };
      tasks: {
        Row: Task;
        Insert: TaskInsert;
        Update: TaskUpdate;
      };
    };
  };
};
