import { describe, expect, it, vi } from 'vitest'
import { clearCached, getCached, setCached } from '../cache'

describe('cache', () => {
  it('stores and expires entries', async () => {
    setCached('demo', { value: 1 }, 50)
    expect(getCached<{ value: number }>('demo')?.value).toBe(1)
    vi.useFakeTimers()
    vi.advanceTimersByTime(60)
    expect(getCached('demo')).toBeNull()
    vi.useRealTimers()
  })

  it('clears cache entries', () => {
    setCached('demo-2', { value: 2 }, 1000)
    clearCached('demo-2')
    expect(getCached('demo-2')).toBeNull()
  })
})
