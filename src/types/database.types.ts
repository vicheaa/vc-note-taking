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
}

export interface NoteInsert {
  title?: string | null;
  content?: string | null;
  is_pinned?: boolean;
  bg_color?: string;
  user_id?: string;
}

export interface NoteUpdate {
  title?: string | null;
  content?: string | null;
  is_pinned?: boolean;
  bg_color?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export type Database = {
  public: {
    Tables: {
      notes: {
        Row: Note;
        Insert: NoteInsert;
        Update: NoteUpdate;
      };
    };
  };
};
