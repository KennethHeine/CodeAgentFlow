import { describe, expect, it } from 'vitest'
import { deriveTaskState } from '../state'

describe('deriveTaskState', () => {
  const issues = [
    { title: 'bootstrap epic', state: 'open' as const, labels: ['blocked'], html_url: 'issue' },
    { title: 'done work', state: 'closed' as const, labels: [], html_url: 'done' },
  ]

  const pulls = [{ title: 'bootstrap epic', state: 'closed' as const, merged: true, html_url: 'pr' }]

  it('marks merged PR as done', () => {
    const state = deriveTaskState('bootstrap epic', issues, pulls)
    expect(state.status).toBe('done')
    expect(state.reason).toContain('Merged')
  })

  it('marks blocked when label present', () => {
    const state = deriveTaskState('bootstrap epic', [issues[0]], [])
    expect(state.status).toBe('blocked')
  })

  it('matches loosely when titles differ slightly', () => {
    const state = deriveTaskState('bootstrap epic repo', issues, pulls)
    expect(state.status).toBe('done')
  })

  it('marks not started when no signals', () => {
    const state = deriveTaskState('new task', [], [])
    expect(state.status).toBe('not-started')
  })
})
