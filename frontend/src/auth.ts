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

  // Ensure Amplify uses browser localStorage for persistence (avoid in-memory storage)
  // Amplify.configure accepts a non-ResourcesConfig object too, so cast to any to satisfy TS.
  Amplify.configure({ ...(config as any), storage: window.localStorage } as any);

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
      await getCurrentUser().catch(async (err) => {
        // log the error before attempting the session exchange
        console.warn(
          "getCurrentUser failed during hosted UI finalization:",
          err
        );
        await fetchAuthSession().catch((e) => {
          console.error(
            "fetchAuthSession failed during hosted UI finalization:",
            e
          );
          throw e;
        });
        // Log the session and storage contents to help diagnose persistence issues
        try {
          const s = await fetchAuthSession();
          console.log('fetchAuthSession succeeded during hosted UI finalization:', s);
        } catch (err) {
          console.warn('fetchAuthSession succeeded earlier but reading session now failed:', err);
        }
        // Force a refresh to ensure tokens are parsed/stored by the library
        try {
          const s2 = await fetchAuthSession({ forceRefresh: true } as any);
          console.log('fetchAuthSession(forceRefresh:true) result:', s2);
        } catch (err) {
          console.warn('fetchAuthSession(forceRefresh) failed:', err);
        }
        try {
          console.log('localStorage keys after hosted UI finalization:', Object.keys(localStorage));
          const preview = Object.fromEntries(Object.keys(localStorage).map(k => [k, (localStorage.getItem(k) || '').slice(0,200)]));
          console.log('localStorage preview:', preview);
        } catch (err) {
          console.warn('Could not read localStorage:', err);
        }
      });
    } catch (err) {
      console.error("Error finalizing hosted UI redirect:", err);
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
