export class FacebookAuthError extends Error {
  constructor(message = 'Credencial de Facebook inválida') {
    super(message);
  }
}

type FacebookProfile = {
  id?: string;
  email?: string;
  name?: string;
};

const GRAPH_VERSION = 'v20.0';

function getFacebookConfig() {
  const appId = process.env.FACEBOOK_APP_ID || process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  if (!appId || !appSecret) throw new FacebookAuthError('Facebook Login no está configurado');
  return { appId: appId.trim(), appSecret: appSecret.trim() };
}

export async function verifyFacebookAccessToken(accessToken: unknown) {
  if (typeof accessToken !== 'string' || !accessToken.trim() || accessToken.length > 8192) {
    throw new FacebookAuthError();
  }

  const { appId, appSecret } = getFacebookConfig();
  const appAccessToken = `${appId}|${appSecret}`;

  try {
    const debugUrl = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/debug_token`);
    debugUrl.searchParams.set('input_token', accessToken);
    debugUrl.searchParams.set('access_token', appAccessToken);

    const debugResponse = await fetch(debugUrl, { cache: 'no-store' });
    if (!debugResponse.ok) throw new FacebookAuthError();

    const debugPayload = await debugResponse.json();
    const tokenData = debugPayload?.data;
    if (!tokenData?.is_valid || tokenData.app_id !== appId || typeof tokenData.user_id !== 'string') {
      throw new FacebookAuthError();
    }

    const profileUrl = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/me`);
    profileUrl.searchParams.set('fields', 'id,name,email');
    profileUrl.searchParams.set('access_token', accessToken);

    const profileResponse = await fetch(profileUrl, { cache: 'no-store' });
    if (!profileResponse.ok) throw new FacebookAuthError();

    const profile = (await profileResponse.json()) as FacebookProfile;
    if (!profile.id || profile.id !== tokenData.user_id) throw new FacebookAuthError();
    if (!profile.email || profile.email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      throw new FacebookAuthError('Facebook no devolvió un email verificable');
    }

    return {
      providerId: profile.id,
      email: profile.email,
      name: typeof profile.name === 'string' ? profile.name : undefined,
    };
  } catch (error) {
    if (error instanceof FacebookAuthError) throw error;
    throw new FacebookAuthError();
  }
}
