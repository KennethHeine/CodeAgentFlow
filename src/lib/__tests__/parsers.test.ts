import { describe, expect, it } from 'vitest'
import { formatTaskFilename, parsePlanTasks, slugify } from '../parsers'

describe('parsers', () => {
  it('slugifies task names', () => {
    expect(slugify('Hello World!')).toBe('hello-world')
  })

  it('formats task filenames with padded index', () => {
    expect(formatTaskFilename(7, 'Bootstrap Repo')).toBe('tasks/007-bootstrap-repo.md')
  })

  it('extracts checkbox tasks from markdown', () => {
    const tasks = parsePlanTasks('- [ ] First\n- [x] Second')
    expect(tasks).toHaveLength(2)
    expect(tasks[1].done).toBe(true)
  })
})
