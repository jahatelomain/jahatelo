export function normalizeLocationName(value: string) {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('es');
}

export function cleanLocationName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}
