import { NextResponse } from 'next/server';
import { getTask, deleteTask, listValidationRuns, listAuditLogs } from '@/lib/db';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = getTask(id);
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
  const validationRuns = listValidationRuns(id);
  const auditLogs = listAuditLogs(undefined, id);
  return NextResponse.json({ ...task, validationRuns, auditLogs });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deleted = deleteTask(id);
  if (!deleted) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
