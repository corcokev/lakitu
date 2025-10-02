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

  // Finalize Hosted UI redirect if we were just sent back with ?code=...&state=...
  completeHostedUiRedirect().catch(() => {
    /* nothing to finalize / ignore */
  });
}

async function completeHostedUiRedirect() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("code") && params.has("state")) {
    // Touch Amplify so it completes the code exchange & stores the session.
    // In early v6, calling getCurrentUser() or fetchAuthSession() triggers this.
    try {
      await getCurrentUser().catch(async () => {
        await fetchAuthSession();
      });
    } finally {
      // Clean the URL so code/state aren’t left around
      const url = new URL(window.location.href);
      url.search = "";
      window.history.replaceState({}, document.title, url.toString());
    }
  }
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
