import { describe, expect, it } from 'vitest'
import { buildEpicTemplates, buildTaskTemplate } from '../templates'

describe('templates', () => {
  it('builds epic templates with the epic name', () => {
    const result = buildEpicTemplates('Edge Delivery')
    expect(result.goal).toContain('Edge Delivery')
    expect(result.requirements).toContain('No backend services')
    expect(result.plan).toContain('Enumerate tasks')
  })

  it('builds a task template with default steps', () => {
    const template = buildTaskTemplate({ title: 'Wire epic repo' })
    expect(template).toContain('# Wire epic repo')
    expect(template).toContain('Research')
    expect(template).toContain('Work')
  })
})
