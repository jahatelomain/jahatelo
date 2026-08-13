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
  return Prisma.sql`REGEXP_REPLACE(LOWER(TRANSLATE(COALESCE(${column}, ''), ${SEARCH_ACCENT_FROM}, ${SEARCH_ACCENT_TO})), '[^a-z0-9]+', '', 'g')`;
}
