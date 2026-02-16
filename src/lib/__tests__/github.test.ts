import { describe, expect, it, vi } from 'vitest'
import type { Octokit } from '@octokit/rest'
import { listEpics, readMarkdown } from '../github'

describe('github helpers', () => {
  it('returns empty epics on 404', async () => {
    const client = {
      repos: {
        getContent: vi.fn().mockRejectedValue({ status: 404 }),
      },
    } as unknown as Octokit

    const epics = await listEpics({ client, owner: 'a', repo: 'b', branch: 'main' })
    expect(epics).toEqual([])
  })

  it('decodes markdown content', async () => {
    const content = Buffer.from('# Hello', 'utf8').toString('base64')
    const client = {
      repos: {
        getContent: vi.fn().mockResolvedValue({ data: { content, encoding: 'base64' } }),
      },
    } as unknown as Octokit

    const value = await readMarkdown({ client, owner: 'a', repo: 'b', path: 'file.md' })
    expect(value).toContain('# Hello')
  })
})
