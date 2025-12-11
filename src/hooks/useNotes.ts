import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Note, NoteInsert, NoteUpdate } from "@/types/database.types";

// Calculate date 7 days ago for trash filtering
const getTrashCutoffDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString();
};

// Fetch all active notes for the current user (not in trash)
export function useNotes() {
  return useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Note[];
    },
  });
}

// Fetch all trashed notes (deleted within the last 7 days)
export function useTrashedNotes() {
  return useQuery({
    queryKey: ["trashed-notes"],
    queryFn: async () => {
      const cutoffDate = getTrashCutoffDate();
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .not("deleted_at", "is", null)
        .gte("deleted_at", cutoffDate)
        .order("deleted_at", { ascending: false });

      if (error) throw error;
      return data as Note[];
    },
  });
}

// Create a new note
export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (note: NoteInsert) => {
      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("notes")
        .insert({
          ...note,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

// Update a note
export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: NoteUpdate;
    }) => {
      const { data, error } = await supabase
        .from("notes")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

// Soft delete a note (move to trash)
export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("notes")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Note;
    },
    onMutate: async (noteId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["notes"] });

      // Snapshot the previous value
      const previousNotes = queryClient.getQueryData<Note[]>(["notes"]);

      // Optimistically update to remove the note from active list
      queryClient.setQueryData<Note[]>(["notes"], (old) =>
        old ? old.filter((note) => note.id !== noteId) : []
      );

      return { previousNotes };
    },
    onError: (_err, _noteId, context) => {
      // Rollback on error
      if (context?.previousNotes) {
        queryClient.setQueryData(["notes"], context.previousNotes);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["trashed-notes"] });
    },
  });
}

// Restore a note from trash
export function useRestoreNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("notes")
        .update({ deleted_at: null })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Note;
    },
    onMutate: async (noteId) => {
      await queryClient.cancelQueries({ queryKey: ["trashed-notes"] });

      const previousTrashedNotes = queryClient.getQueryData<Note[]>(["trashed-notes"]);

      queryClient.setQueryData<Note[]>(["trashed-notes"], (old) =>
        old ? old.filter((note) => note.id !== noteId) : []
      );

      return { previousTrashedNotes };
    },
    onError: (_err, _noteId, context) => {
      if (context?.previousTrashedNotes) {
        queryClient.setQueryData(["trashed-notes"], context.previousTrashedNotes);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["trashed-notes"] });
    },
  });
}

// Permanently delete a note
export function usePermanentDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notes").delete().eq("id", id);

      if (error) throw error;
      return id;
    },
    onMutate: async (noteId) => {
      await queryClient.cancelQueries({ queryKey: ["trashed-notes"] });

      const previousTrashedNotes = queryClient.getQueryData<Note[]>(["trashed-notes"]);

      queryClient.setQueryData<Note[]>(["trashed-notes"], (old) =>
        old ? old.filter((note) => note.id !== noteId) : []
      );

      return { previousTrashedNotes };
    },
    onError: (_err, _noteId, context) => {
      if (context?.previousTrashedNotes) {
        queryClient.setQueryData(["trashed-notes"], context.previousTrashedNotes);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["trashed-notes"] });
    },
  });
}

// Empty all trash (permanently delete all trashed notes)
export function useEmptyTrash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const cutoffDate = getTrashCutoffDate();
      const { error } = await supabase
        .from("notes")
        .delete()
        .not("deleted_at", "is", null)
        .gte("deleted_at", cutoffDate);

      if (error) throw error;
      return true;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["trashed-notes"] });

      const previousTrashedNotes = queryClient.getQueryData<Note[]>(["trashed-notes"]);

      queryClient.setQueryData<Note[]>(["trashed-notes"], []);

      return { previousTrashedNotes };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTrashedNotes) {
        queryClient.setQueryData(["trashed-notes"], context.previousTrashedNotes);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["trashed-notes"] });
    },
  });
}

// Toggle pin status
export function useTogglePin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isPinned }: { id: string; isPinned: boolean }) => {
      const { data, error } = await supabase
        .from("notes")
        .update({ is_pinned: !isPinned, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

