import { NextResponse } from 'next/server';
import { listAuditLogs } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const epicId = searchParams.get('epicId') || undefined;
  const taskId = searchParams.get('taskId') || undefined;
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  const logs = listAuditLogs(epicId, taskId, limit);
  return NextResponse.json(logs);
}
