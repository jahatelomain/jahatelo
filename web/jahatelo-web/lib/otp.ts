import crypto from 'crypto';

export function normalizePhone(raw: string): string {
  const defaultCountry = (process.env.OTP_DEFAULT_COUNTRY_CODE || '').replace(/\D/g, '');
  const digits = raw.replace(/\D/g, '');
  const stripped = digits.replace(/^0+/, '');
  let normalized = stripped;

  if (defaultCountry && stripped.length === 9 && !stripped.startsWith(defaultCountry)) {
    normalized = `${defaultCountry}${stripped}`;
  }

  return normalized.startsWith('+') ? normalized : `+${normalized}`;
}

export function isValidPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  return digits.length >= 9 && digits.length <= 15;
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
