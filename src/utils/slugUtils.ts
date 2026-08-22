export function generateSlug(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .normalize('NFD') // Decompose accents
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Trim hyphens
}

export function buildArticleSlugUrl(id: string, title?: string): string {
  if (!title) return `/article/${id}`;
  return `/article/${generateSlug(title)}-${id}`;
}

export function extractIdFromSlug(slug: string): string {
  if (!slug) return '';
  // UUIDs are 36 chars long. If it's 36 chars, it's probably just the ID.
  if (slug.length === 36) return slug;
  return slug.slice(-36); // Extract UUID from the end
}
