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
    onMutate: async (newTask) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["tasks", newTask.note_id] });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks", newTask.note_id]);

      // Optimistically add the new task with a temp ID
      const optimisticTask: Task = {
        id: `temp-${Date.now()}`,
        note_id: newTask.note_id,
        content: newTask.content || "",
        is_completed: false,
        position: newTask.position || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        due_date: null,
      };

      queryClient.setQueryData<Task[]>(["tasks", newTask.note_id], (old) =>
        old ? [...old, optimisticTask] : [optimisticTask]
      );

      return { previousTasks, noteId: newTask.note_id, tempId: optimisticTask.id };
    },
    onError: (_err, newTask, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks", newTask.note_id], context.previousTasks);
      }
    },
    onSuccess: (data, _variables, context) => {
      // Replace temp task with real one
      queryClient.setQueryData<Task[]>(["tasks", data.note_id], (old) =>
        old ? old.map((t) => (t.id === context?.tempId ? data : t)) : [data]
      );
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
    onMutate: async ({ id, noteId, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["tasks", noteId] });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks", noteId]);

      // Optimistically update the task
      queryClient.setQueryData<Task[]>(["tasks", noteId], (old) =>
        old
          ? old.map((task) =>
              task.id === id
                ? { ...task, ...updates, updated_at: new Date().toISOString() }
                : task
            )
          : []
      );

      return { previousTasks, noteId };
    },
    onError: (_err, variables, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks", variables.noteId], context.previousTasks);
      }
    },
    // No need to invalidate - optimistic update is sufficient
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
