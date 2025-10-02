import {
  fetchAuthSession,
  signInWithRedirect,
  signOut,
  getCurrentUser,
} from "@aws-amplify/auth";
import { type OAuthConfig, type ResourcesConfig } from "@aws-amplify/core";
import { Amplify } from "@aws-amplify/core";

export function initAuth() {
  const domain = import.meta.env.VITE_COGNITO_DOMAIN;
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
  const redirectUri = window.location.origin + "/";

  const config: ResourcesConfig = {
    Auth: {
      Cognito: {
        userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
        userPoolClientId: clientId,
        loginWith: {
          oauth: {
            domain,
            scopes: ["openid", "email"],
            redirectSignIn: [redirectUri],
            redirectSignOut: [redirectUri],
            responseType: "code",
          } as OAuthConfig,
        },
      },
    },
  };
  Amplify.configure(config);
}

export async function currentAccessToken(): Promise<string | null> {
  const session = await fetchAuthSession().catch(() => null);
  return session?.tokens?.accessToken?.toString() ?? null;
}

export async function getUserSub(): Promise<string | null> {
  try {
    return (await getCurrentUser()).userId;
  } catch {
    return null;
  }
}

export function login() {
  return signInWithRedirect();
}
export function logout() {
  return signOut();
}
