import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

const FACEBOOK_APP_ID = Constants.expoConfig?.extra?.facebookAppId || null;

const discovery = {
  authorizationEndpoint: 'https://www.facebook.com/v20.0/dialog/oauth',
};

export const useFacebookAuth = () => {
  const redirectUri = 'https://www.jahatelo.com/auth/facebook-popup';

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    FACEBOOK_APP_ID
      ? {
          clientId: FACEBOOK_APP_ID,
          redirectUri,
          responseType: AuthSession.ResponseType.Token,
          scopes: ['public_profile', 'email'],
        }
      : {
          clientId: 'facebook-not-configured',
          redirectUri,
          responseType: AuthSession.ResponseType.Token,
          scopes: ['public_profile', 'email'],
        },
    discovery
  );

  return {
    request: FACEBOOK_APP_ID ? request : null,
    response,
    promptAsync,
  };
};

export const isFacebookConfigured = () => Boolean(FACEBOOK_APP_ID);
