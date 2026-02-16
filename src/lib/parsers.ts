export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function formatTaskFilename(index: number, title: string) {
  const slug = slugify(title || `task-${index}`)
  const padded = String(index).padStart(3, '0')
  return `tasks/${padded}-${slug}.md`
}

export type ParsedTask = {
  title: string
  done: boolean
}

export function parsePlanTasks(markdown: string): ParsedTask[] {
  const lines = markdown.split('\n')
  const tasks: ParsedTask[] = []

  for (const line of lines) {
    const match = line.match(/^- \[( |x)\]\s+(.*)$/i)
    if (match) {
      tasks.push({
        title: match[2].trim(),
        done: match[1].toLowerCase() === 'x',
      })
    }
  }

  return tasks
}
