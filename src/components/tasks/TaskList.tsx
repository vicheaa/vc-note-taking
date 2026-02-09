import { useState, useMemo, useCallback } from "react";
import { Plus, ChevronDown } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableTaskItem } from "./SortableTaskItem";
import { TaskItem } from "./TaskItem";
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useToggleTaskCompletion,
  useReorderTasks,
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
  const reorderTasks = useReorderTasks();

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Separate tasks into incomplete and completed
  const { incompleteTasks, completedTasks } = useMemo(() => {
    const incomplete = tasks.filter((t) => !t.is_completed);
    const completed = tasks.filter((t) => t.is_completed);
    return { incompleteTasks: incomplete, completedTasks: completed };
  }, [tasks]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = incompleteTasks.findIndex((t) => t.id === active.id);
        const newIndex = incompleteTasks.findIndex((t) => t.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(incompleteTasks, oldIndex, newIndex);
          const taskIds = newOrder.map((t) => t.id);
          
          // Also include completed tasks at the end
          const completedIds = completedTasks.map((t) => t.id);
          
          reorderTasks.mutate({
            noteId,
            taskIds: [...taskIds, ...completedIds],
          });
        }
      }
    },
    [incompleteTasks, completedTasks, noteId, reorderTasks]
  );

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

  const handleDueDateChange = useCallback(
    (id: string, dueDate: string | null) => {
      updateTask.mutate({ id, noteId, updates: { due_date: dueDate } });
    },
    [noteId, updateTask]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-400 text-sm">
        Loading tasks...
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Incomplete tasks - Sortable */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={incompleteTasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-0.5">
            {incompleteTasks.map((task) => (
              <SortableTaskItem
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onDueDateChange={handleDueDateChange}
                isNew={task.id === newTaskId}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add task button */}
      <button
        onClick={handleAddTask}
        className="group flex items-center gap-2.5 w-full px-8 py-2.5 -mx-2 text-sm text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all duration-200"
      >
        <Plus className="w-5 h-5" />
        <span className="font-medium">Add item</span>
      </button>

      {/* Completed section - Not sortable */}
      {completedTasks.length > 0 && (
        <div className="pt-3 mt-2 border-t border-slate-200">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="group flex items-center gap-2 px-2 py-1.5 -mx-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all duration-200 w-full"
          >
            <div className={`transition-transform duration-200 ${showCompleted ? "rotate-0" : "-rotate-90"}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
            <span className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-semibold bg-emerald-100 text-emerald-600 rounded-full">
                {completedTasks.length}
              </span>
              completed item{completedTasks.length !== 1 ? "s" : ""}
            </span>
          </button>

          <div className={`overflow-hidden transition-all duration-300 ease-out ${
            showCompleted ? "max-h-[2000px] opacity-100 mt-1" : "max-h-0 opacity-0"
          }`}>
            <div className="space-y-0.5">
              {completedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={handleToggle}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onDueDateChange={handleDueDateChange}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
