function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

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
  // Don't slugify non-UUIDs (e.g., Guardian API IDs) because they are already URL safe
  if (!isUUID(id)) return `/article/${id}`;
  return `/article/${generateSlug(title)}-${id}`;
}

export function extractIdFromSlug(slug: string): string {
  if (!slug) return '';
  
  if (isUUID(slug)) return slug;
  
  // If it's longer than 36 chars and ends with a UUID, extract the UUID
  if (slug.length > 36) {
    const maybeUuid = slug.slice(-36);
    if (isUUID(maybeUuid)) return maybeUuid;
  }
  
  // Otherwise, it must be a non-UUID ID (like a Guardian API ID)
  return slug;
}
