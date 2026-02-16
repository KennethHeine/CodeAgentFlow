import { useState } from 'react'
import type { FormEvent } from 'react'

type Props = {
  open: boolean
  onSubmit: (token: string) => void
}

export function PatGateModal({ open, onSubmit }: Props) {
  const [token, setToken] = useState('')

  if (!open) return null

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!token.trim()) return
    onSubmit(token.trim())
    setToken('')
  }

  return (
    <div className="modal-backdrop" data-testid="pat-modal">
      <div className="modal">
        <div className="modal__header">
          <p className="badge">Required</p>
          <h2>Provide a GitHub PAT to continue</h2>
          <p className="muted">
            The token is only stored locally in your browser. Recommended scopes: <code>repo</code>, <code>workflow</code>,{' '}
            <code>project</code>. No backend keeps a copy.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="modal__form">
          <label htmlFor="pat-input">Personal Access Token</label>
          <input
            id="pat-input"
            data-testid="pat-input"
            type="password"
            placeholder="ghp_xxx..."
            value={token}
            onChange={(event) => setToken(event.target.value)}
            autoFocus
          />
          <div className="modal__actions">
            <button type="submit" data-testid="pat-submit">
              Save token
            </button>
            <p className="micro muted">Scopes are verified by GitHub; revoke any time in your settings.</p>
          </div>
        </form>
      </div>
    </div>
  )
}
