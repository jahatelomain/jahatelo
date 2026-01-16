/**
 * Sanitiza HTML permitiendo solo tags seguros
 * Útil para campos que permiten formato básico (negrita, cursiva, etc.)
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined') {
    return sanitizeText(dirty);
  }

  // Lazy-load to avoid server-side jsdom dependency.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const domPurifyModule = require('isomorphic-dompurify') as typeof import('isomorphic-dompurify');
  const DOMPurify = (domPurifyModule as any).default ?? domPurifyModule;

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p'],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitiza texto eliminando todos los tags HTML
 * Útil para campos de texto plano que no deben contener HTML
 */
export function sanitizeText(text: string): string {
  // Remover scripts y tags HTML
  return text
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Sanitiza un objeto recursivamente, aplicando sanitizeText a todos los strings
 * Útil para sanitizar body completo de requests
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};

  for (const key in obj) {
    const value = obj[key];

    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item: any) =>
        typeof item === 'string' ? sanitizeText(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Escapa caracteres especiales para prevenir XSS
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}
