import { getAccessToken } from "@/lib/auth/token-storage";

function endpoint(path: string) {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}/api${normalizedPath}`;
}

async function fetchReport(path: string): Promise<Blob> {
  const token = getAccessToken();
  const response = await fetch(endpoint(path), {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Error generating report (${response.status})`);
  }

  return response.blob();
}

export async function downloadGoalkeeperReport(
  goalkeeperId: string,
  from?: string,
  to?: string,
) {
  const query = new URLSearchParams();
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return fetchReport(`/reports/goalkeeper/${goalkeeperId}${suffix}`);
}

export async function downloadTeamReport(
  teamId: string,
  from?: string,
  to?: string,
) {
  const query = new URLSearchParams();
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return fetchReport(`/reports/team/${teamId}${suffix}`);
}

export async function downloadSessionReport(sessionId: string) {
  return fetchReport(`/reports/session/${sessionId}`);
}

export function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
