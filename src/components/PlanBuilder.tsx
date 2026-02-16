import { useEffect, useState } from 'react'
import type { Octokit } from '@octokit/rest'
import { buildTaskTemplate } from '../lib/templates'
import { formatTaskFilename } from '../lib/parsers'
import type { SessionState } from '../lib/storage'

type TaskDraft = {
  title: string
  summary: string
  research: string
  work: string
}

type Props = {
  client: Octokit | null
  session: SessionState
  epicSlug?: string
  existingTasks: number
  onPublish?: (titles: string[]) => void
}

export function PlanBuilder({ client, session, epicSlug, existingTasks, onPublish }: Props) {
  const [tasks, setTasks] = useState<TaskDraft[]>([
    { title: 'Generate plan.md outline', summary: 'Size tasks to one Coding Agent run.', research: 'List dependencies', work: 'Draft plan.md' },
  ])
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const id = setTimeout(() => setNotice(''), 0)
    return () => clearTimeout(id)
  }, [epicSlug])

  const updateTask = (index: number, partial: Partial<TaskDraft>) => {
    setTasks((prev) => prev.map((task, i) => (i === index ? { ...task, ...partial } : task)))
  }

  const addTask = () => setTasks((prev) => [...prev, { title: '', summary: '', research: '', work: '' }])

  const toBase64 = (value: string) => {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(value, 'utf8').toString('base64')
    }
    return btoa(unescape(encodeURIComponent(value)))
  }

  const saveTasks = async () => {
    if (!client || !epicSlug) return
    let startIndex = existingTasks + 1

    for (const task of tasks) {
      if (!task.title.trim()) continue
      const content = buildTaskTemplate({
        title: task.title.trim(),
        summary: task.summary.trim(),
        researchSteps: task.research
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
        workSteps: task.work
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
      })

      const path = `epics/${epicSlug}/${formatTaskFilename(startIndex, task.title)}`

      await client.repos.createOrUpdateFileContents({
        owner: session.owner,
        repo: session.repo,
        branch: session.branch,
        path,
        message: `docs(${epicSlug}): add task ${task.title}`,
        content: toBase64(content),
      })

      startIndex += 1
    }

    setNotice('Tasks published to GitHub tasks directory')
    onPublish?.(
      tasks
        .map((task) => task.title.trim())
        .filter(Boolean)
        .map((title) => title || 'task'),
    )
    setTimeout(() => setNotice(''), 3500)
  }

  return (
    <section className="panel" aria-label="Plan builder">
      <div className="panel__header">
        <div>
          <p className="badge">Plan builder</p>
          <h3>Tasks + subtasks</h3>
          <p className="muted">Each task is scoped to fit in a single Coding Agent run.</p>
        </div>
        <button type="button" className="ghost" onClick={addTask} data-testid="add-task">
          Add task
        </button>
      </div>

      {!epicSlug && <p className="muted">Select an epic to edit tasks.</p>}

      {epicSlug && (
        <div className="stack">
          {tasks.map((task, index) => (
            <div className="card" key={index}>
              <header className="card__header">
                <input
                  value={task.title}
                  onChange={(event) => updateTask(index, { title: event.target.value })}
                  placeholder="Task title"
                  data-testid={`task-title-${index}`}
                />
                <span className="mono muted">{formatTaskFilename(existingTasks + index + 1, task.title)}</span>
              </header>
              <label className="stack tight">
                <span>Summary</span>
                <input value={task.summary} onChange={(event) => updateTask(index, { summary: event.target.value })} />
              </label>
              <label className="stack tight">
                <span>Research steps</span>
                <textarea
                  value={task.research}
                  onChange={(event) => updateTask(index, { research: event.target.value })}
                  rows={3}
                  placeholder="One per line"
                />
              </label>
              <label className="stack tight">
                <span>Work steps</span>
                <textarea
                  value={task.work}
                  onChange={(event) => updateTask(index, { work: event.target.value })}
                  rows={3}
                  placeholder="One per line"
                />
              </label>
            </div>
          ))}

          <button type="button" onClick={saveTasks} disabled={!client || !epicSlug} data-testid="save-tasks">
            Publish tasks to GitHub
          </button>
          {notice && <p className="muted">{notice}</p>}
        </div>
      )}
    </section>
  )
}
