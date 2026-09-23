import * as Facebook from 'expo-auth-session/providers/facebook';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

const FACEBOOK_APP_ID = Constants.expoConfig?.extra?.facebookAppId || null;

export const useFacebookAuth = () => {
  const [request, response, promptAsync] = Facebook.useAuthRequest(
    FACEBOOK_APP_ID
      ? {
          clientId: FACEBOOK_APP_ID,
          scopes: ['public_profile', 'email'],
        }
      : {
          clientId: 'facebook-not-configured',
          scopes: ['public_profile', 'email'],
        }
  );

  return {
    request: FACEBOOK_APP_ID ? request : null,
    response,
    promptAsync,
  };
};

export const isFacebookConfigured = () => Boolean(FACEBOOK_APP_ID);
