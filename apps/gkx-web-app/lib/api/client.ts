import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "@/lib/auth/token-storage";
import { AuthTokens } from "@/lib/auth/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

function endpoint(path: string) {
  if (!API_BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_API_URL environment variable.");
  }

  return `${API_BASE_URL}/api${path}`;
}

function extractTokens(payload: unknown): AuthTokens {
  const root = payload as {
    accessToken?: string;
    refreshToken?: string;
    tokens?: { accessToken?: string; refreshToken?: string };
    data?: {
      accessToken?: string;
      refreshToken?: string;
      tokens?: { accessToken?: string; refreshToken?: string };
    };
  };

  const source = root.data ?? root;

  const accessToken = source.accessToken ?? source.tokens?.accessToken;
  const refreshToken = source.refreshToken ?? source.tokens?.refreshToken;

  if (!accessToken || !refreshToken) {
    throw new Error("Authentication response did not include tokens.");
  }

  return { accessToken, refreshToken };
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    const response = await fetch(endpoint("/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const payload = await response.json();
    const tokens = extractTokens(payload);
    saveTokens(tokens);
    return tokens.accessToken;
  })();

  const result = await refreshPromise;
  refreshPromise = null;
  return result;
}

type ApiRequestInit = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

export async function apiRequest<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const { auth = false, headers, body, ...rest } = init;

  const makeRequest = async (token: string | null) => {
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    const mergedHeaders = {
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(headers ?? {}),
    };

    return fetch(endpoint(path), {
      ...rest,
      headers: mergedHeaders,
      body:
        body === undefined
          ? undefined
          : isFormData
            ? (body as BodyInit)
            : JSON.stringify(body),
    });
  };

  const firstToken = auth ? getAccessToken() : null;
  let response = await makeRequest(firstToken);

  if (auth && response.status === 401) {
    const renewedToken = await refreshAccessToken();
    if (renewedToken) {
      response = await makeRequest(renewedToken);
    }
  }

  if (!response.ok) {
    let message = "Request failed";
    try {
      const payload = (await response.json()) as {
        message?: string | string[];
        error?: string;
      };
      if (Array.isArray(payload.message)) {
        message = payload.message.join(", ");
      } else {
        message = payload.message ?? payload.error ?? message;
      }
    } catch {
      // Ignore invalid JSON errors and keep default message.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export { extractTokens };
