import { SignJWT, jwtVerify } from 'jose';

function verificationSecret() {
  const value = process.env.EMAIL_VERIFICATION_SECRET || process.env.JWT_SECRET;
  if (!value || value === 'your-secret-key-change-in-production') {
    throw new Error('EMAIL_VERIFICATION_SECRET or JWT_SECRET must be configured');
  }
  return new TextEncoder().encode(value);
}

export async function createEmailVerificationToken(email: string) {
  return await new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(verificationSecret());
}

export async function verifyEmailVerificationToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, verificationSecret());
    const email = payload.email;
    if (typeof email !== 'string') return null;
    return email;
  } catch (error) {
    console.error('Error verifying email token:', error);
    return null;
  }
}
