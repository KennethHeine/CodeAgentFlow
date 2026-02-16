import { NextResponse } from 'next/server';
import { getTask, updateTaskState } from '@/lib/db';
import { canTransition } from '@/lib/state-machine';
import type { TransitionInput } from '@/lib/types';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = getTask(id);
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const body = await request.json() as TransitionInput;
  const { targetState, prUrl, branchName, blockedReason } = body;

  if (!targetState) {
    return NextResponse.json({ error: 'targetState is required' }, { status: 400 });
  }

  if (!canTransition(task.state, targetState)) {
    return NextResponse.json(
      { error: `Invalid transition: ${task.state} → ${targetState}` },
      { status: 422 }
    );
  }

  if (targetState === 'BLOCKED' && !blockedReason) {
    return NextResponse.json(
      { error: 'blockedReason is required when transitioning to BLOCKED' },
      { status: 400 }
    );
  }

  const updated = updateTaskState(id, targetState, { prUrl, branchName, blockedReason });
  return NextResponse.json(updated);
}
