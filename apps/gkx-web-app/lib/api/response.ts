type ApiEnvelope<T> = {
  data?: T;
};

export function extractData<T>(payload: unknown): T {
  if (payload == null || typeof payload !== "object") {
    return payload as T;
  }

  const source = payload as ApiEnvelope<T> & T;
  return (source.data ?? source) as T;
}

export function extractArray<T>(payload: unknown): T[] {
  const source = extractData<unknown>(payload);

  if (Array.isArray(source)) {
    return source as T[];
  }

  if (source && typeof source === "object") {
    const record = source as Record<string, unknown>;

    const preferredKeys = ["items", "results", "users", "rows", "list"];
    for (const key of preferredKeys) {
      const value = record[key];
      if (Array.isArray(value)) {
        return value as T[];
      }
    }

    for (const value of Object.values(record)) {
      if (Array.isArray(value)) {
        return value as T[];
      }
    }
  }

  return [];
}
