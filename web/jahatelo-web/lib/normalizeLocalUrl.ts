export const normalizeLocalUrl = (
  value?: string | null,
  baseUrl?: string | null,
): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;

  const resolveBaseUrl = () => {
    if (baseUrl) return baseUrl;
    if (typeof window !== 'undefined') return window.location.origin;
    return null;
  };

  const resolvedBase = resolveBaseUrl();

  if (trimmed.startsWith('/uploads/')) {
    return resolvedBase ? `${resolvedBase}${trimmed}` : trimmed;
  }

  const isLocal =
    /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?\//.test(trimmed) ||
    /^https?:\/\/192\.168\.\d+\.\d+(?::\d+)?\//.test(trimmed);

  if (isLocal && resolvedBase) {
    return trimmed.replace(/^https?:\/\/[^/]+/, resolvedBase);
  }

  return trimmed;
};

export const normalizeLocalUploadPath = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const match = trimmed.match(/\/uploads\/.+$/);
  if (match) return match[0];
  return trimmed;
};

export const normalizeLocalUrls = (
  list?: Array<string | null | undefined> | null,
  baseUrl?: string | null,
): string[] => {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => normalizeLocalUrl(item || null, baseUrl))
    .filter((item): item is string => Boolean(item));
};
