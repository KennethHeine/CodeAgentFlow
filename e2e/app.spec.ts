import { test, expect } from '@playwright/test'

const encode = (value: string) => Buffer.from(value, 'utf8').toString('base64')

test('PAT gate, epic creation, plan, and navigation', async ({ page }) => {
  const slug = 'developer-first-workflow'
  const epicDir = `epics/${slug}`

  await page.route('https://api.github.com/**', (route) => {
    const url = route.request().url()
    const method = route.request().method()

    if (method === 'GET' && url.endsWith('/contents/epics')) {
      return route.fulfill({
        status: 200,
        body: JSON.stringify([{ name: slug, path: epicDir, type: 'dir', html_url: `https://github.com/x/${epicDir}` }]),
      })
    }

    if (method === 'GET' && url.includes(`/contents/${epicDir}/goal.md`)) {
      return route.fulfill({ status: 200, body: JSON.stringify({ type: 'file', content: encode('# Goal'), encoding: 'base64' }) })
    }

    if (method === 'GET' && url.includes(`/contents/${epicDir}/requirements.md`)) {
      return route.fulfill({
        status: 200,
        body: JSON.stringify({ type: 'file', content: encode('# Requirements'), encoding: 'base64' }),
      })
    }

    if (method === 'GET' && url.includes(`/contents/${epicDir}/plan.md`)) {
      return route.fulfill({
        status: 200,
        body: JSON.stringify({ type: 'file', content: encode('- [ ] Bootstrap'), encoding: 'base64' }),
      })
    }

    if (method === 'GET' && url.includes(`/contents/${epicDir}/tasks`)) {
      return route.fulfill({
        status: 200,
        body: JSON.stringify([
          { name: '001-bootstrap-epic.md', path: `${epicDir}/tasks/001-bootstrap-epic.md`, type: 'file', html_url: 'https://github.com/x' },
        ]),
      })
    }

    if (url.includes('/issues')) {
      return route.fulfill({
        status: 200,
        body: JSON.stringify([{ title: 'bootstrap epic', state: 'closed', labels: [{ name: 'done' }], html_url: 'https://github.com/x/issue/1' }]),
      })
    }

    if (url.includes('/pulls')) {
      return route.fulfill({
        status: 200,
        body: JSON.stringify([
          { title: 'bootstrap epic', state: 'closed', merged_at: '2024-01-01', html_url: 'https://github.com/x/pull/1', draft: false },
        ]),
      })
    }

    if (method === 'PUT') {
      return route.fulfill({ status: 200, body: JSON.stringify({ content: { path: 'ok' } }) })
    }

    return route.fulfill({ status: 200, body: '[]' })
  })

  await page.goto('/')

  await expect(page.getByTestId('pat-modal')).toBeVisible()
  await page.getByTestId('pat-input').fill('ghp_mock')
  await page.getByTestId('pat-submit').click()
  await expect(page.getByTestId('pat-modal')).toBeHidden()

  await page.getByTestId('owner-input').fill('octo')
  await page.getByTestId('repo-input').fill('epic-repo')
  await page.getByTestId('branch-input').fill('main')
  await page.getByTestId('epic-name-input').fill('Developer First Workflow')
  await page.getByTestId('create-epic').click()

  await expect(page.getByText('Epic developer-first-workflow scaffolded')).toBeVisible()
  await expect(page.getByTestId(`epic-${slug}`)).toBeVisible()
  await page.getByTestId(`epic-${slug}`).click()

  await expect(page.getByTestId('goal-editor')).toBeVisible()
  await page.getByTestId('task-title-0').fill('Bootstrap epic repo')
  await page.getByTestId('save-tasks').click()

  const executionPanel = page.getByTestId('execution-panel')
  await expect(executionPanel).toContainText('Bootstrap epic repo')

  await expect(page.getByText('Epic folders ↗')).toBeVisible()

  await page.screenshot({ path: 'public/app-preview.png', fullPage: true })
})
