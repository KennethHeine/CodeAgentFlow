import { NextResponse } from 'next/server';
import { listTasks, createTask } from '@/lib/db';
import type { CreateTaskInput } from '@/lib/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const epicId = searchParams.get('epicId');
  if (!epicId) {
    return NextResponse.json({ error: 'epicId query param is required' }, { status: 400 });
  }
  const tasks = listTasks(epicId);
  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const body = await request.json() as CreateTaskInput;
  if (!body.epicId || !body.title) {
    return NextResponse.json({ error: 'epicId and title are required' }, { status: 400 });
  }
  const task = createTask(body);
  return NextResponse.json(task, { status: 201 });
}
