import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.EMAIL_VERIFICATION_SECRET ||
  process.env.JWT_SECRET ||
  'your-secret-key-change-in-production'
);

export async function createEmailVerificationToken(email: string) {
  return await new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
}

export async function verifyEmailVerificationToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    const email = payload.email;
    if (typeof email !== 'string') return null;
    return email;
  } catch (error) {
    console.error('Error verifying email token:', error);
    return null;
  }
}
