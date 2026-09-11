import { createRemoteJWKSet, jwtVerify } from 'jose';

const googleKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

export class GoogleAuthError extends Error {
  constructor() { super('Credencial de Google inválida'); }
}

/** Verify Google-signed ID tokens; never accept client-supplied identity fields. */
export async function verifyGoogleIdToken(idToken: unknown, platform: 'web' | 'mobile') {
  if (typeof idToken !== 'string' || !idToken || idToken.length > 16384) {
    throw new GoogleAuthError();
  }
  const webClient = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const audience = [webClient, ...(platform === 'mobile'
    ? (process.env.GOOGLE_MOBILE_CLIENT_IDS || '').split(',') : [])]
    .filter((value): value is string => !!value?.trim()).map(value => value.trim());
  if (!audience.length) throw new GoogleAuthError();
  try {
    const { payload } = await jwtVerify(idToken, googleKeys, {
      algorithms: ['RS256'],
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience,
      requiredClaims: ['exp', 'sub', 'email'],
    });
    if (payload.email_verified !== true || typeof payload.sub !== 'string' ||
        !payload.sub.trim() || payload.sub.length > 255 ||
        typeof payload.email !== 'string' || payload.email.length > 255 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      throw new GoogleAuthError();
    }
    return { providerId: payload.sub, email: payload.email,
      name: typeof payload.name === 'string' ? payload.name : undefined };
  } catch {
    // Avoid leaking tokens, provider responses or verifier internals into logs.
    throw new GoogleAuthError();
  }
}
