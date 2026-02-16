import { useCallback, useEffect, useMemo, useState } from 'react'
import { Octokit } from '@octokit/rest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './App.css'
import { PatGateModal } from './components/PatGateModal'
import { EpicScaffold } from './components/EpicScaffold'
import { EpicList } from './components/EpicList'
import { DocumentStack } from './components/DocumentStack'
import { PlanBuilder } from './components/PlanBuilder'
import { ExecutionPanel } from './components/ExecutionPanel'
import { clearToken, loadSession, loadToken, persistSession, persistToken, type SessionState } from './lib/storage'
import { createEpicStructure, listEpics, listTasks, type EpicSummary } from './lib/github'
import { clearCached, getCached, setCached } from './lib/cache'

const queryClient = new QueryClient()

function App() {
  const [token, setToken] = useState(loadToken())
  const [session, setSession] = useState<SessionState>(loadSession())
  const [epics, setEpics] = useState<EpicSummary[]>([])
  const [selectedEpic, setSelectedEpic] = useState<EpicSummary | null>(null)
  const [loadingEpics, setLoadingEpics] = useState(false)
  const [taskTitles, setTaskTitles] = useState<string[]>([])
  const [flash, setFlash] = useState('')

  const client = useMemo(() => (token ? new Octokit({ auth: token }) : null), [token])

  useEffect(() => {
    if (token) persistToken(token)
  }, [token])

  useEffect(() => {
    persistSession(session)
  }, [session])

  const fetchEpics = useCallback(async () => {
    if (!client || !session.owner || !session.repo) return
    setLoadingEpics(true)
    const cacheKey = `${session.owner}/${session.repo}/${session.branch}:epics`
    const cached = getCached<EpicSummary[]>(cacheKey)
    if (cached) setEpics(cached)

    const list = await listEpics({ client, owner: session.owner, repo: session.repo, branch: session.branch })
    setEpics(list)
    setCached(cacheKey, list, 2 * 60 * 1000)
    setLoadingEpics(false)
  }, [client, session.branch, session.owner, session.repo])

  const handleCreateEpic = async (name: string, starter: string) => {
    if (!client) return
    clearCached(`${session.owner}/${session.repo}/${session.branch}:epics`)
    const created = await createEpicStructure({
      client,
      owner: session.owner,
      repo: session.repo,
      branch: session.branch,
      epicName: name,
      initialTaskSummary: starter,
    })
    await fetchEpics()
    const epic = { name, slug: created.slug, path: `epics/${created.slug}` }
    setEpics((prev) => {
      const exists = prev.find((item) => item.slug === epic.slug)
      return exists ? prev : [...prev, epic]
    })
    setSelectedEpic(epic)
    setFlash(`Epic ${epic.slug} scaffolded`)
    setTimeout(() => setFlash(''), 3500)
    return epic
  }

  useEffect(() => {
    if (!session.owner || !session.repo) return
    const id = setTimeout(() => {
      void fetchEpics()
    }, 0)
    return () => clearTimeout(id)
  }, [fetchEpics, session.owner, session.repo])

  const loadTasks = useCallback(
    async (epic = selectedEpic) => {
    if (!client || !epic || !session.owner || !session.repo) {
      setTaskTitles([])
      return
    }
    const files = await listTasks({
        client,
        owner: session.owner,
        repo: session.repo,
      branch: session.branch,
      epicSlug: epic.slug,
    })

    if (files.length) {
      setTaskTitles(files.map((file) => file.title))
    }
  },
    [client, selectedEpic, session.branch, session.owner, session.repo],
  )

  useEffect(() => {
    const id = setTimeout(() => {
      void loadTasks()
    }, 0)
    return () => clearTimeout(id)
  }, [loadTasks])

  const resetToken = () => {
    clearToken()
    setToken('')
    setSelectedEpic(null)
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="chrome">
        <header className="hero">
          <div>
            <p className="badge">CodeAgentFlow</p>
            <h1>Plan. Orchestrate. Ship.</h1>
            <p className="muted">
              Developer-first cockpit that turns intent into GitHub artifacts. Tasks stay sized for a single Coding Agent run; humans approve
              every merge.
            </p>
          </div>
          <div className="hero__actions">
            <span className={`pill ${token ? 'pill--ready' : 'pill--muted'}`}>{token ? 'PAT loaded' : 'PAT required'}</span>
            <button className="ghost" onClick={resetToken}>
              Clear token
            </button>
          </div>
        </header>

        {flash && <div className="callout success">{flash}</div>}

        <main className="layout">
          <div className="column">
            <EpicScaffold session={session} onSessionChange={setSession} onCreateEpic={handleCreateEpic} disabled={!client} />
            <EpicList
              epics={epics}
              loading={loadingEpics}
              onRefresh={fetchEpics}
              onSelect={setSelectedEpic}
              selectedSlug={selectedEpic?.slug}
            />
          </div>

          <div className="column">
            <DocumentStack client={client} session={session} epicSlug={selectedEpic?.slug} />
            <PlanBuilder
              client={client}
              session={session}
              epicSlug={selectedEpic?.slug}
              existingTasks={taskTitles.length}
              onPublish={(titles) => {
                setTaskTitles((prev) => {
                  const merged = [...prev, ...titles]
                  return Array.from(new Set(merged.filter(Boolean)))
                })
                loadTasks()
              }}
            />
          </div>

          <div className="column narrow">
            <ExecutionPanel client={client} session={session} epicSlug={selectedEpic?.slug} taskTitles={taskTitles} />
            <div className="panel">
              <div className="panel__header">
                <div>
                  <p className="badge">Transparency</p>
                  <h3>Deep links</h3>
                  <p className="muted">Every doc, issue, and PR links back to GitHub.</p>
                </div>
              </div>
              <ul className="links">
                <li>
                  <a
                    href={`https://github.com/${session.owner}/${session.repo}/tree/${session.branch}/epics`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Epic folders ↗
                  </a>
                </li>
                {selectedEpic && (
                  <>
                    <li>
                      <a
                        href={`https://github.com/${session.owner}/${session.repo}/tree/${session.branch}/epics/${selectedEpic.slug}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Selected epic ↗
                      </a>
                    </li>
                    <li>
                      <a
                        href={`https://github.com/${session.owner}/${session.repo}/issues?q=${selectedEpic.slug}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Issues tagged {selectedEpic.slug} ↗
                      </a>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </main>
      </div>

      <PatGateModal open={!token} onSubmit={setToken} />
    </QueryClientProvider>
  )
}

export default App
