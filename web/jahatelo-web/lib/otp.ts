import crypto from 'crypto';

/**
 * Normalización genérica E.164: acepta formatos locales e internacionales de cualquier país.
 * - Si el input empieza con '+', se limpia y se respeta como internacional.
 * - Si tiene ≥10 dígitos sin '+', se asume formato internacional sin prefijo.
 * - Los números cortos (7-9 dígitos) se tratan como locales del país por defecto (PY 595).
 */
export function normalizePhone(raw: string): string {
  const trimmed = (raw || '').trim();
  if (trimmed.startsWith('+')) {
    const clean = '+' + trimmed.slice(1).replace(/\D/g, '');
    return clean.length >= 8 ? clean : trimmed;
  }
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return trimmed;
  const stripped = digits.replace(/^0+/, '') || digits;
  if (stripped.length >= 10) return `+${stripped}`;
  const defaultCC = (process.env.OTP_DEFAULT_COUNTRY_CODE || '595').replace(/\D/g, '');
  if (stripped.length >= 7 && stripped.length <= 9) return `+${defaultCC}${stripped}`;
  return `+${stripped}`;
}

export function isValidPhone(raw: string): boolean {
  const normalized = normalizePhone(raw);
  const digits = normalized.replace(/\D/g, '');
  // E.164: mínimo 7 dígitos, máximo 15 (incluyendo código de país)
  return digits.length >= 7 && digits.length <= 15;
}

export function generateOtpCode(): string {
  const code = crypto.randomInt(0, 1000000);
  return code.toString().padStart(6, '0');
}

export function hashOtp(code: string): string {
  const secret = process.env.OTP_SECRET;
  if (!secret) {
    throw new Error('OTP_SECRET is not configured');
  }
  return crypto.createHmac('sha256', secret).update(code).digest('hex');
}
