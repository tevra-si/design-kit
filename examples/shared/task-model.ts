export interface Task { id: string; title: string; completed: boolean }
export const initialTasks: Task[] = [
  { id: 'research', title: 'Review the research brief', completed: true },
  { id: 'tokens', title: 'Confirm the design token roles', completed: false },
  { id: 'keyboard', title: 'Check the keyboard experience', completed: false }
];
export type TaskResult = { ok: true; task: Task } | { ok: false; error: string };
export function createTask(title: string, id: string): TaskResult {
  const trimmed = title.trim();
  if (trimmed.length < 3 || trimmed.length > 120) return { ok: false, error: 'Use between 3 and 120 characters for the task.' };
  if (!id.trim()) return { ok: false, error: 'A task identifier is required.' };
  return { ok: true, task: { id, title: trimmed, completed: false } };
}
