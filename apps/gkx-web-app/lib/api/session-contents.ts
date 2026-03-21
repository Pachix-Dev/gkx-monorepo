import { apiRequest } from "@/lib/api/client";
import { extractArray, extractData } from "@/lib/api/response";

export type SessionTaskEntity = {
  id: string;
  tenantId: string;
  sessionId: string;
  taskName: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateSessionTaskInput = {
  tenantId: string;
  sessionId: string;
  taskName: string;
};

export type UpdateSessionTaskInput = Partial<CreateSessionTaskInput>;

export async function getSessionTasks(sessionId: string) {
  const payload = await apiRequest<unknown>(`/training-sessions/${sessionId}/contents`, {
    method: "GET",
    auth: true,
  });

  return extractArray<SessionTaskEntity>(payload);
}

export async function createSessionTask(sessionId: string, input: CreateSessionTaskInput) {
  const payload = await apiRequest<unknown>(`/training-sessions/${sessionId}/contents`, {
    method: "POST",
    auth: true,
    body: input,
  });

  return extractData<SessionTaskEntity>(payload);
}

export async function updateSessionTask(sessionId: string, taskId: string, input: UpdateSessionTaskInput) {
  const payload = await apiRequest<unknown>(`/training-sessions/${sessionId}/contents/${taskId}`, {
    method: "PATCH",
    auth: true,
    body: input,
  });

  return extractData<SessionTaskEntity>(payload);
}

export async function deleteSessionTask(sessionId: string, taskId: string) {
  await apiRequest<unknown>(`/training-sessions/${sessionId}/contents/${taskId}`, {
    method: "DELETE",
    auth: true,
  });
}
