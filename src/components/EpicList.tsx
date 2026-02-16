import type { EpicSummary } from '../lib/github'

type Props = {
  epics: EpicSummary[]
  loading: boolean
  onRefresh: () => void
  onSelect: (epic: EpicSummary) => void
  selectedSlug?: string
}

export function EpicList({ epics, loading, onRefresh, onSelect, selectedSlug }: Props) {
  return (
    <section className="panel" aria-label="Epic list">
      <div className="panel__header">
        <div>
          <p className="badge">Explorer</p>
          <h3>Epics in repo</h3>
          <p className="muted">Cached locally with TTL; GitHub is still the source of truth.</p>
        </div>
        <button type="button" onClick={onRefresh} disabled={loading} className="ghost" data-testid="refresh-epics">
          Refresh
        </button>
      </div>

      <div className="list" data-testid="epic-list">
        {loading && <p className="muted">Loading epics from GitHub…</p>}
        {!loading && epics.length === 0 && <p className="muted">No epics yet. Create the first one.</p>}
        {epics.map((epic) => (
          <button
            key={epic.slug}
            className={`list__item ${selectedSlug === epic.slug ? 'list__item--active' : ''}`}
            onClick={() => onSelect(epic)}
            data-testid={`epic-${epic.slug}`}
          >
            <div>
              <p className="mono muted">{epic.path}</p>
              <strong>{epic.name}</strong>
            </div>
            <span aria-hidden>→</span>
          </button>
        ))}
      </div>
    </section>
  )
}
