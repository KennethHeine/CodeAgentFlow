import { useEffect, useState } from 'react'
import type { Octokit } from '@octokit/rest'
import { deriveTaskState, type IssueLike, type PullLike } from '../lib/state'
import type { SessionState } from '../lib/storage'

type Props = {
  client: Octokit | null
  session: SessionState
  epicSlug?: string
  taskTitles: string[]
}

export function ExecutionPanel({ client, session, epicSlug, taskTitles }: Props) {
  const [issues, setIssues] = useState<IssueLike[]>([])
  const [pulls, setPulls] = useState<PullLike[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!client || !epicSlug) return
      setLoading(true)
      setError('')

      try {
        const [issueResponse, pullResponse] = await Promise.all([
          client.issues.listForRepo({ owner: session.owner, repo: session.repo, state: 'all', per_page: 20 }),
          client.pulls.list({ owner: session.owner, repo: session.repo, state: 'all', per_page: 20 }),
        ])

        setIssues(
          issueResponse.data.map((issue) => ({
            title: issue.title,
            state: issue.state === 'closed' ? 'closed' : 'open',
            labels: issue.labels?.map((label) => (typeof label === 'string' ? label : label.name || '')).filter(Boolean),
            html_url: issue.html_url || '',
          })),
        )

        setPulls(
          pullResponse.data.map((pr) => ({
            title: pr.title,
            state: pr.state === 'closed' ? 'closed' : 'open',
            merged: pr.merged_at !== null,
            draft: pr.draft || false,
            html_url: pr.html_url || '',
          })),
        )
      } catch (err) {
        setError('Unable to read GitHub execution signals. Check PAT scopes.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [client, epicSlug, session.owner, session.repo])

  return (
    <section className="panel" aria-label="Execution signals">
      <div className="panel__header">
        <div>
          <p className="badge">GitHub source of truth</p>
          <h3>Issues • PRs • Checks</h3>
          <p className="muted">Statuses are derived from GitHub artifacts, not local state.</p>
        </div>
        <span className="pill pill--muted">{loading ? 'Syncing…' : 'Live pull'}</span>
      </div>

      {error && <div className="callout">{error}</div>}
      {!epicSlug && <p className="muted">Select an epic to see execution signals.</p>}

      {epicSlug && (
        <div className="stack" data-testid="execution-panel">
          {taskTitles.length === 0 && <p className="muted">Add tasks to start tracking progress.</p>}
          {taskTitles.map((title) => {
            const derived = deriveTaskState(title, issues, pulls)
            return (
              <div key={title} className={`list__item list__item--status status-${derived.status}`}>
                <div>
                  <p className="mono muted">{derived.reason}</p>
                  <strong>{title}</strong>
                </div>
                {derived.link && (
                  <a href={derived.link} target="_blank" rel="noreferrer">
                    GitHub ↗
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
