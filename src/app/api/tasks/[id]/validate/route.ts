import { NextResponse } from 'next/server';
import { getTask, createValidationRun, updateValidationRun } from '@/lib/db';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = getTask(id);
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const action = body.action;

  if (action === 'create') {
    const run = createValidationRun(id);
    return NextResponse.json(run, { status: 201 });
  }

  if (action === 'update' && body.runId) {
    const run = updateValidationRun(body.runId, body.status, body.checks, body.logsUrl);
    if (!run) {
      return NextResponse.json({ error: 'Validation run not found' }, { status: 404 });
    }
    return NextResponse.json(run);
  }

  return NextResponse.json({ error: 'action is required (create or update)' }, { status: 400 });
}
