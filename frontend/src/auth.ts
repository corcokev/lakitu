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

  // Use a minimal storage adapter (avoid passing host objects directly)
  const localStorageAdapter = {
    getItem: (k: string) => window.localStorage.getItem(k),
    setItem: (k: string, v: string) => window.localStorage.setItem(k, v),
    removeItem: (k: string) => window.localStorage.removeItem(k),
  };

  // Configure Amplify with the app resources and the storage adapter.
  // Casts are used because Amplify.configure accepts multiple shapes.
  Amplify.configure({ ...(config as any), storage: localStorageAdapter } as any);

  // Debug helpers: expose helpers on window so we can call them from the browser console
  // without using dynamic imports. These are safe to keep but can be removed later.
  try {
    (window as any).__lakitu_fetchSession = async (force = false) => {
      try {
        const s = await fetchAuthSession((force ? { forceRefresh: true } : undefined) as any);
        console.log('__lakitu_fetchSession result:', s);
        return s;
      } catch (e) {
        console.error('__lakitu_fetchSession error:', e);
        throw e;
      }
    };
    (window as any).__lakitu_inspectStorage = () => {
      try {
        console.log('localStorage keys:', Object.keys(localStorage));
        console.log('localStorage preview:', Object.fromEntries(Object.keys(localStorage).map(k => [k, (localStorage.getItem(k)||'').slice(0,200)])));
        console.log('sessionStorage keys:', Object.keys(sessionStorage));
        console.log('document.cookie:', document.cookie.slice(0,500));
      } catch (e) {
        console.warn('__lakitu_inspectStorage error:', e);
      }
    };
  } catch (e) {
    /* ignore in restrictive environments */
  }

  // Finalize Hosted UI redirect if we were just sent back with ?code=...&state=...
  completeHostedUiRedirect().catch(() => {
    /* nothing to finalize / ignore */
  });
}

async function completeHostedUiRedirect() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("code") && params.has("state")) {
    // Exchange the authorization code for tokens and populate Amplify's session.
    try {
      // forceRefresh ensures the library parses and persists any returned tokens
      await fetchAuthSession({ forceRefresh: true } as any);
    } catch (err) {
      console.error("Error finalizing hosted UI redirect (token exchange):", err);
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
