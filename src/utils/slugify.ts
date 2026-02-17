/**
 * Slugify a string for use in filenames and paths.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a task filename with zero-padded index.
 */
export function taskFilename(index: number, slug: string): string {
  const padded = String(index + 1).padStart(3, '0');
  return `${padded}-${slug}.md`;
}

/**
 * Parse task index from filename.
 */
export function parseTaskIndex(filename: string): number | null {
  const match = filename.match(/^(\d{3})-/);
  if (!match) return null;
  return parseInt(match[1], 10) - 1;
}

/**
 * Parse task slug from filename.
 */
export function parseTaskSlug(filename: string): string | null {
  const match = filename.match(/^\d{3}-(.+)\.md$/);
  return match ? match[1] : null;
}
