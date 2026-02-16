import { useEffect, useState } from 'react'
import type { Octokit } from '@octokit/rest'
import { readMarkdown, updateDocument } from '../lib/github'
import type { SessionState } from '../lib/storage'

type Props = {
  client: Octokit | null
  session: SessionState
  epicSlug?: string
}

type DocKind = 'goal' | 'requirements' | 'plan'

export function DocumentStack({ client, session, epicSlug }: Props) {
  const [docs, setDocs] = useState<Record<DocKind, string>>({ goal: '', requirements: '', plan: '' })
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!client || !epicSlug) return
      setLoading(true)
      try {
        const [goal, requirements, plan] = await Promise.all([
          readMarkdown({ client, owner: session.owner, repo: session.repo, path: `epics/${epicSlug}/goal.md`, ref: session.branch }),
          readMarkdown({
            client,
            owner: session.owner,
            repo: session.repo,
            path: `epics/${epicSlug}/requirements.md`,
            ref: session.branch,
          }),
          readMarkdown({ client, owner: session.owner, repo: session.repo, path: `epics/${epicSlug}/plan.md`, ref: session.branch }),
        ])

        setDocs({
          goal: goal || '',
          requirements: requirements || '',
          plan: plan || '',
        })
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [client, epicSlug, session.branch, session.owner, session.repo])

  const handleSave = async (kind: DocKind) => {
    if (!client || !epicSlug) return
    await updateDocument({
      client,
      owner: session.owner,
      repo: session.repo,
      branch: session.branch,
      epicSlug,
      kind,
      content: docs[kind],
    })
    setNotice(`Saved ${kind} at epics/${epicSlug}/${kind}.md`)
    setTimeout(() => setNotice(''), 4000)
  }

  return (
    <section className="panel" aria-label="Epic documents">
      <div className="panel__header">
        <div>
          <p className="badge">Source of truth</p>
          <h3>goal.md, requirements.md, plan.md</h3>
          <p className="muted">Edits write directly to GitHub. Manual approval and merge remain with you.</p>
        </div>
        {notice && <span className="pill pill--ready">{notice}</span>}
      </div>

      {loading && <p className="muted">Loading documents…</p>}
      {!loading && !epicSlug && <p className="muted">Select an epic to edit its docs.</p>}

      {epicSlug && (
        <div className="doc-grid">
          {(['goal', 'requirements', 'plan'] as DocKind[]).map((kind) => (
            <div className="doc" key={kind}>
              <header>
                <p className="mono muted">{kind}.md</p>
                <button className="ghost" onClick={() => handleSave(kind)} data-testid={`save-${kind}`}>
                  Save
                </button>
              </header>
              <textarea
                value={docs[kind]}
                onChange={(event) => setDocs((prev) => ({ ...prev, [kind]: event.target.value }))}
                rows={10}
                data-testid={`${kind}-editor`}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
