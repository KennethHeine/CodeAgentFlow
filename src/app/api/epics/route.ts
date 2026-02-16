import { NextResponse } from 'next/server';
import { listEpics, createEpic, generatePlan, createTask } from '@/lib/db';
import type { CreateEpicInput } from '@/lib/types';

export async function GET() {
  const epics = listEpics();
  return NextResponse.json(epics);
}

export async function POST(request: Request) {
  const body = await request.json();

  const { title, intent, repo, defaultBranch, constraints, validationProfile, mergePolicy, generateTasks } = body as CreateEpicInput & { generateTasks?: boolean };

  if (!title || !intent || !repo) {
    return NextResponse.json({ error: 'title, intent, and repo are required' }, { status: 400 });
  }

  const epic = createEpic({
    title,
    intent,
    repo,
    defaultBranch: defaultBranch || 'main',
    constraints: constraints || '',
    validationProfile: validationProfile || 'tests,lint',
    mergePolicy: mergePolicy || 'manual',
  });

  if (generateTasks) {
    const plan = generatePlan(intent, repo);
    for (const taskInput of plan) {
      createTask({ ...taskInput, epicId: epic.id });
    }
  }

  return NextResponse.json(epic, { status: 201 });
}
