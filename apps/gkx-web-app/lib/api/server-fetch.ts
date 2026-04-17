import { extractArray } from "@/lib/api/response";

const API_BASE_URL = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_TIMEOUT_MS = Number(process.env.INTERNAL_API_TIMEOUT_MS ?? "12000");

type ServerApiErrorKind =
  | "missing-config"
  | "missing-token"
  | "timeout"
  | "network"
  | "http-error"
  | "invalid-json";

export type ServerApiResult<T> =
  | {
      ok: true;
      status: number;
      data: T;
    }
  | {
      ok: false;
      status: number | null;
      kind: ServerApiErrorKind;
    };

function buildAbortController(timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeoutId),
  };
}

export async function fetchServerApiJson<T>(
  path: string,
  token: string | undefined,
  init: { timeoutMs?: number } = {},
): Promise<ServerApiResult<T>> {
  if (!API_BASE_URL) {
    return {
      ok: false,
      status: null,
      kind: "missing-config",
    };
  }

  if (!token) {
    return {
      ok: false,
      status: 401,
      kind: "missing-token",
    };
  }

  const timeoutMs = init.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const { signal, clear } = buildAbortController(timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api${path}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      signal,
    });
  } catch (error) {
    clear();
    const isAbort = error instanceof Error && error.name === "AbortError";
    return {
      ok: false,
      status: null,
      kind: isAbort ? "timeout" : "network",
    };
  }

  clear();

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      kind: "http-error",
    };
  }

  try {
    const payload = (await response.json()) as T;
    return {
      ok: true,
      status: response.status,
      data: payload,
    };
  } catch {
    return {
      ok: false,
      status: response.status,
      kind: "invalid-json",
    };
  }
}

export async function fetchServerApiArray<T>(
  path: string,
  token: string | undefined,
): Promise<T[]> {
  const result = await fetchServerApiJson<unknown>(path, token);
  if (!result.ok) {
    return [];
  }

  return extractArray<T>(result.data);
}

export function isServerApiNotFound(result: ServerApiResult<unknown>) {
  return !result.ok && result.status === 404;
}

export function isServerApiUnauthorized(result: ServerApiResult<unknown>) {
  return !result.ok && (result.status === 401 || result.status === 403 || result.kind === "missing-token");
}