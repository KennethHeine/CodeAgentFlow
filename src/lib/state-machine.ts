import { TaskState } from "@/lib/types";

const directedTransitions: Record<TaskState, TaskState[]> = {
  PLANNED: ["RUNNING", "BLOCKED", "DONE"],
  RUNNING: ["PR_READY", "BLOCKED"],
  PR_READY: ["VALIDATING", "BLOCKED"],
  VALIDATING: ["APPROVAL_PENDING", "FIXING", "BLOCKED"],
  FIXING: ["VALIDATING", "BLOCKED"],
  APPROVAL_PENDING: ["MERGED", "BLOCKED"],
  MERGED: ["DONE", "BLOCKED"],
  DONE: ["BLOCKED"],
  BLOCKED: ["PLANNED", "RUNNING", "DONE"],
};

export function canTransition(from: TaskState, to: TaskState) {
  return directedTransitions[from].includes(to);
}

export function assertTransition(from: TaskState, to: TaskState) {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid transition ${from} -> ${to}`);
  }
}
