type CacheEntry<T> = {
  expiresAt: number
  payload: T
}

const prefix = 'cideagentflow:cache:'

export function getCached<T>(key: string): T | null {
  if (typeof localStorage === 'undefined') return null
  const raw = localStorage.getItem(prefix + key)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as CacheEntry<T>
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(prefix + key)
      return null
    }
    return parsed.payload
  } catch {
    localStorage.removeItem(prefix + key)
    return null
  }
}

export function setCached<T>(key: string, payload: T, ttlMs: number) {
  if (typeof localStorage === 'undefined') return
  const entry: CacheEntry<T> = { payload, expiresAt: Date.now() + ttlMs }
  localStorage.setItem(prefix + key, JSON.stringify(entry))
}

export function clearCached(key: string) {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(prefix + key)
}
