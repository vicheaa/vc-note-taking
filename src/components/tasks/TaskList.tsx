import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Plus, ChevronDown, ChevronRight } from "lucide-react";
import { TaskItem } from "./TaskItem";
import { Task } from "@/types/database.types";
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useToggleTaskCompletion,
} from "@/hooks/useTasks";

interface TaskListProps {
  noteId: string;
}

export function TaskList({ noteId }: TaskListProps) {
  const [showCompleted, setShowCompleted] = useState(true);
  const [newTaskId, setNewTaskId] = useState<string | null>(null);
  const { data: tasks = [], isLoading } = useTasks(noteId);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const toggleCompletion = useToggleTaskCompletion();

  // Separate tasks into incomplete and completed
  const { incompleteTasks, completedTasks } = useMemo(() => {
    const incomplete = tasks.filter((t) => !t.is_completed);
    const completed = tasks.filter((t) => t.is_completed);
    return { incompleteTasks: incomplete, completedTasks: completed };
  }, [tasks]);

  const handleAddTask = async () => {
    const position = tasks.length;
    const result = await createTask.mutateAsync({
      note_id: noteId,
      content: "",
      position,
    });
    setNewTaskId(result.id);
  };

  const handleToggle = useCallback(
    (id: string, isCompleted: boolean) => {
      toggleCompletion.mutate({ id, noteId, isCompleted });
    },
    [noteId, toggleCompletion]
  );

  const handleUpdate = useCallback(
    (id: string, content: string) => {
      updateTask.mutate({ id, noteId, updates: { content } });
    },
    [noteId, updateTask]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteTask.mutate({ id, noteId });
    },
    [noteId, deleteTask]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-400 text-sm">
        Loading tasks...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Incomplete tasks */}
      <div className="space-y-0.5">
        {incompleteTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={handleToggle}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            isNew={task.id === newTaskId}
          />
        ))}
      </div>

      {/* Add task button */}
      <button
        onClick={handleAddTask}
        className="flex items-center gap-2 px-1 py-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>List item</span>
      </button>

      {/* Completed section */}
      {completedTasks.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-1"
          >
            {showCompleted ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <span>
              {completedTasks.length} completed item
              {completedTasks.length !== 1 ? "s" : ""}
            </span>
          </button>

          {showCompleted && (
            <div className="space-y-0.5">
              {completedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={handleToggle}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
