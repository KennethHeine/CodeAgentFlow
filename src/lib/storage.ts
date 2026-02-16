const TOKEN_KEY = 'cideagentflow:token'
const SESSION_KEY = 'cideagentflow:session'

export type SessionState = {
  owner: string
  repo: string
  branch: string
}

export function loadToken() {
  if (typeof localStorage === 'undefined') return ''
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function persistToken(token: string) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
}

export function loadSession(): SessionState {
  if (typeof localStorage === 'undefined') return { owner: '', repo: '', branch: 'main' }
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return { owner: '', repo: '', branch: 'main' }
  try {
    return JSON.parse(raw) as SessionState
  } catch {
    return { owner: '', repo: '', branch: 'main' }
  }
}

export function persistSession(session: SessionState) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}
