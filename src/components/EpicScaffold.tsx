import { useState } from 'react'
import type { FormEvent } from 'react'
import type { EpicSummary } from '../lib/github'
import type { SessionState } from '../lib/storage'

type Props = {
  session: SessionState
  onSessionChange: (next: SessionState) => void
  onCreateEpic: (name: string, initialSummary: string) => Promise<EpicSummary | void>
  disabled: boolean
}

export function EpicScaffold({ session, onSessionChange, onCreateEpic, disabled }: Props) {
  const [epicName, setEpicName] = useState('')
  const [summary, setSummary] = useState('Prove the workflow with a thin vertical slice.')
  const [message, setMessage] = useState('')

  const handleSessionChange = (key: keyof SessionState, value: string) => {
    const next = { ...session, [key]: value }
    onSessionChange(next)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!epicName.trim()) return
    const created = await onCreateEpic(epicName.trim(), summary.trim())
    if (created) {
      setMessage(`Created ${created.slug} in ${session.owner}/${session.repo}`)
      setEpicName('')
    }
  }

  return (
    <section className="panel" aria-label="Epic creation">
      <div className="panel__header">
        <div>
          <p className="badge">Epic repo</p>
          <h3>Scaffold a new epic</h3>
          <p className="muted">Creates goal, requirements, plan, and a starter task in the epic repo.</p>
        </div>
        <span className={`pill ${disabled ? 'pill--muted' : 'pill--ready'}`}>{disabled ? 'PAT locked' : 'Ready'}</span>
      </div>

      <form className="stack" onSubmit={handleSubmit}>
        <div className="grid two-col">
          <label className="stack tight">
            <span>Owner</span>
            <input
              value={session.owner}
              onChange={(event) => handleSessionChange('owner', event.target.value)}
              placeholder="github-username"
              required
              data-testid="owner-input"
            />
          </label>
          <label className="stack tight">
            <span>Repo</span>
            <input
              value={session.repo}
              onChange={(event) => handleSessionChange('repo', event.target.value)}
              placeholder="epic-repo"
              required
              data-testid="repo-input"
            />
          </label>
        </div>

        <div className="grid two-col">
          <label className="stack tight">
            <span>Branch</span>
            <input
              value={session.branch}
              onChange={(event) => handleSessionChange('branch', event.target.value)}
              placeholder="main"
              required
              data-testid="branch-input"
            />
          </label>
          <label className="stack tight">
            <span>Epic name</span>
            <input
              value={epicName}
              onChange={(event) => setEpicName(event.target.value)}
              placeholder="Developer-first workflow"
              required
              data-testid="epic-name-input"
            />
          </label>
        </div>

        <label className="stack tight">
          <span>Starter task summary</span>
          <input value={summary} onChange={(event) => setSummary(event.target.value)} data-testid="epic-summary-input" />
          <p className="micro muted">Used inside tasks/001-*.md to kick off execution.</p>
        </label>

        <button type="submit" disabled={disabled} data-testid="create-epic">
          Create epic folder
        </button>

        {message && (
          <div className="callout success" role="status">
            {message}
          </div>
        )}
      </form>
    </section>
  )
}
