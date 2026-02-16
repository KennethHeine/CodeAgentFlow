export function parsePlanTasks(markdown) {
  return markdown
    .split('\n')
    .map((line) => line.match(/^\s*\d+\.\s+(.+)$/)?.[1]?.trim())
    .filter(Boolean)
    .map((title, index) => ({
      id: String(index + 1).padStart(3, '0'),
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    }));
}
