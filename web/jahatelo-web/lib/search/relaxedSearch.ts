import { Prisma } from '@prisma/client';

export const SEARCH_ACCENT_FROM = 'áéíóúñÁÉÍÓÚÑäëïöüÄËÏÖÜàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛ';
export const SEARCH_ACCENT_TO = 'aeiounAEIOUNaeiouAEIOUaeiouAEIOUaeiouAEIOU';

/**
 * Normaliza exclusivamente para comparar búsquedas: no modifica ni persiste
 * el texto original. Quita acentos, espacios y cualquier símbolo.
 */
export function normalizeRelaxedSearch(value?: string | null) {
  return (value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

export function relaxedSearchSql(column: Prisma.Sql) {
  // La función se crea por migración y es la misma normalización que usa el
  // cliente. Centralizarla en PostgreSQL permite índices trigram sin cambiar
  // resultados al ignorar acentos, espacios o símbolos.
  return Prisma.sql`public.jahatelo_normalize_search(${column})`;
}
