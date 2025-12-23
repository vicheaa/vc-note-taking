import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Task, TaskInsert, TaskUpdate } from "@/types/database.types";

// Fetch all tasks for a specific note
export function useTasks(noteId: string | null) {
  return useQuery({
    queryKey: ["tasks", noteId],
    queryFn: async () => {
      if (!noteId) return [];
      
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("note_id", noteId)
        .order("position", { ascending: true });

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!noteId,
  });
}

// Create a new task
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: TaskInsert) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert(task)
        .select()
        .single();

      if (error) throw error;
      return data as Task;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", data.note_id] });
    },
  });
}

// Update a task
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      noteId,
      updates,
    }: {
      id: string;
      noteId: string;
      updates: TaskUpdate;
    }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { task: data as Task, noteId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", result.noteId] });
    },
  });
}

// Delete a task
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, noteId }: { id: string; noteId: string }) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);

      if (error) throw error;
      return { id, noteId };
    },
    onMutate: async ({ id, noteId }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", noteId] });

      const previousTasks = queryClient.getQueryData<Task[]>(["tasks", noteId]);

      queryClient.setQueryData<Task[]>(["tasks", noteId], (old) =>
        old ? old.filter((task) => task.id !== id) : []
      );

      return { previousTasks, noteId };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks", context.noteId], context.previousTasks);
      }
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", variables.noteId] });
    },
  });
}

// Toggle task completion
export function useToggleTaskCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      noteId,
      isCompleted,
    }: {
      id: string;
      noteId: string;
      isCompleted: boolean;
    }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update({
          is_completed: !isCompleted,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { task: data as Task, noteId };
    },
    onMutate: async ({ id, noteId, isCompleted }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", noteId] });

      const previousTasks = queryClient.getQueryData<Task[]>(["tasks", noteId]);

      queryClient.setQueryData<Task[]>(["tasks", noteId], (old) =>
        old
          ? old.map((task) =>
              task.id === id ? { ...task, is_completed: !isCompleted } : task
            )
          : []
      );

      return { previousTasks, noteId };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks", context.noteId], context.previousTasks);
      }
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", variables.noteId] });
    },
  });
}

// Reorder tasks (update positions)
export function useReorderTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      noteId,
      taskIds,
    }: {
      noteId: string;
      taskIds: string[];
    }) => {
      // Update positions for all tasks
      const updates = taskIds.map((id, index) =>
        supabase
          .from("tasks")
          .update({ position: index, updated_at: new Date().toISOString() })
          .eq("id", id)
      );

      await Promise.all(updates);
      return { noteId };
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", variables.noteId] });
    },
  });
}
