import type { Octokit } from '@octokit/rest'
import { buildEpicTemplates, buildTaskTemplate } from './templates'
import { formatTaskFilename, slugify } from './parsers'

export type EpicSummary = {
  name: string
  slug: string
  path: string
  url?: string
}

export type TaskFile = {
  path?: string
  url?: string
  title: string
  summary?: string
  researchSteps?: string[]
  workSteps?: string[]
}

type FileParams = {
  owner: string
  repo: string
  branch: string
  message: string
  path: string
  content: string
  client: Octokit
}

function encodeContent(content: string) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(content, 'utf8').toString('base64')
  }

  return btoa(unescape(encodeURIComponent(content)))
}

function decodeContent(raw: string) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(raw, 'base64').toString('utf8')
  }

  return decodeURIComponent(escape(atob(raw)))
}

async function createFile({
  client,
  content,
  message,
  owner,
  path,
  branch,
  repo,
}: FileParams) {
  return client.repos.createOrUpdateFileContents({
    owner,
    repo,
    branch,
    path,
    message,
    content: encodeContent(content),
  })
}

export async function readMarkdown(params: {
  client: Octokit
  owner: string
  repo: string
  path: string
  ref?: string
}): Promise<string | null> {
  try {
    const response = await params.client.repos.getContent({
      owner: params.owner,
      repo: params.repo,
      path: params.path,
      ref: params.ref,
    })

    if (!('content' in response.data)) return null
    const body = response.data.content
    if (typeof body !== 'string') return null
    return decodeContent(body)
  } catch (error: unknown) {
    const status = (error as { status?: number }).status
    if (status === 404) return null
    throw error
  }
}

export async function listEpics(params: {
  client: Octokit
  owner: string
  repo: string
  branch: string
}): Promise<EpicSummary[]> {
  try {
    const response = await params.client.repos.getContent({
      owner: params.owner,
      repo: params.repo,
      path: 'epics',
      ref: params.branch,
    })

    if (!Array.isArray(response.data)) return []

    return response.data
      .filter((item) => item.type === 'dir')
      .map((item) => ({
        name: item.name,
        slug: item.name,
        path: item.path,
        url: item.html_url || undefined,
      }))
  } catch (error: unknown) {
    const status = (error as { status?: number }).status
    if (status === 404) return []
    throw error
  }
}

export async function listTasks(params: {
  client: Octokit
  owner: string
  repo: string
  branch: string
  epicSlug: string
}): Promise<TaskFile[]> {
  try {
    const response = await params.client.repos.getContent({
      owner: params.owner,
      repo: params.repo,
      path: `epics/${params.epicSlug}/tasks`,
      ref: params.branch,
    })

    if (!Array.isArray(response.data)) return []

    return response.data
      .filter((item) => item.type === 'file')
      .map((item) => ({
        path: item.path,
        title: item.name.replace(/^\d+-|\.md$/g, '').replace(/-/g, ' '),
        url: item.html_url || undefined,
      }))
  } catch (error: unknown) {
    const status = (error as { status?: number }).status
    if (status === 404) return []
    throw error
  }
}

export async function createEpicStructure(params: {
  client: Octokit
  owner: string
  repo: string
  branch: string
  epicName: string
  initialTaskSummary?: string
}) {
  const { goal, requirements, plan } = buildEpicTemplates(params.epicName)
  const slug = slugify(params.epicName)
  const basePath = `epics/${slug}`
  const message = `chore: scaffold epic ${params.epicName}`

  await createFile({
    client: params.client,
    owner: params.owner,
    repo: params.repo,
    branch: params.branch,
    path: `${basePath}/goal.md`,
    content: goal,
    message,
  })

  await createFile({
    client: params.client,
    owner: params.owner,
    repo: params.repo,
    branch: params.branch,
    path: `${basePath}/requirements.md`,
    content: requirements,
    message,
  })

  await createFile({
    client: params.client,
    owner: params.owner,
    repo: params.repo,
    branch: params.branch,
    path: `${basePath}/plan.md`,
    content: plan,
    message,
  })

  const starterTask = buildTaskTemplate({
    title: 'Create the first execution lane',
    summary: params.initialTaskSummary || 'Set labels, issues, and PR placeholders for the epic.',
    researchSteps: ['Confirm GitHub repo permissions', 'Collect recent issues that relate to this epic'],
    workSteps: ['Open tracking issue with checklist', 'Create first PR that links back to this epic'],
  })

  const taskPath = `${basePath}/${formatTaskFilename(1, 'bootstrap-epic')}`

  await createFile({
    client: params.client,
    owner: params.owner,
    repo: params.repo,
    branch: params.branch,
    path: taskPath,
    content: starterTask,
    message,
  })

  return { slug, basePath }
}

export async function updateDocument(params: {
  client: Octokit
  owner: string
  repo: string
  branch: string
  epicSlug: string
  kind: 'goal' | 'requirements' | 'plan'
  content: string
}) {
  return createFile({
    client: params.client,
    owner: params.owner,
    repo: params.repo,
    branch: params.branch,
    path: `epics/${params.epicSlug}/${params.kind}.md`,
    content: params.content,
    message: `docs(${params.epicSlug}): update ${params.kind}`,
  })
}

export async function writeTasks(
  params: {
    client: Octokit
    owner: string
    repo: string
    branch: string
    epicSlug: string
    startIndex?: number
  },
  tasks: TaskFile[],
) {
  let index = params.startIndex ?? 1
  for (const task of tasks) {
    const path = `epics/${params.epicSlug}/${formatTaskFilename(index, task.title)}`
    const content = buildTaskTemplate({
      title: task.title,
      summary: task.summary,
      researchSteps: task.researchSteps,
      workSteps: task.workSteps,
    })

    await createFile({
      client: params.client,
      owner: params.owner,
      repo: params.repo,
      branch: params.branch,
      path,
      content,
      message: `docs(${params.epicSlug}): add task ${task.title}`,
    })

    index += 1
  }
}
