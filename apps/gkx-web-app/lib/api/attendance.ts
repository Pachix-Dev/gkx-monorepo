import { apiRequest } from "@/lib/api/client";
import { extractArray, extractData } from "@/lib/api/response";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "JUSTIFIED";

export type AttendanceEntity = {
  id: string;
  tenantId: string;
  trainingSessionId: string;
  goalkeeperId: string;
  status: AttendanceStatus;
  notes?: string | null;
  recordedByUserId?: string | null;
  recordedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateAttendanceBulkInput = {
  tenantId: string;
  trainingSessionId: string;
  items: Array<{
    goalkeeperId: string;
    status: AttendanceStatus;
    notes?: string;
  }>;
};

export async function getAttendance() {
  const payload = await apiRequest<unknown>("/attendance", {
    method: "GET",
    auth: true,
  });

  return extractArray<AttendanceEntity>(payload);
}

export async function getAttendanceBySession(sessionId: string) {
  const payload = await apiRequest<unknown>(
    `/attendance/session/${sessionId}`,
    {
    method: "GET",
    auth: true,
    },
  );

  return extractArray<AttendanceEntity>(payload);
}

export async function createAttendanceBulk(input: CreateAttendanceBulkInput) {
  const payload = await apiRequest<unknown>("/attendance/bulk", {
    method: "POST",
    auth: true,
    body: input,
  });

  return extractArray<AttendanceEntity>(payload);
}

export async function updateAttendance(
  id: string,
  input: Partial<CreateAttendanceBulkInput["items"][number]>,
) {
  const payload = await apiRequest<unknown>(`/attendance/${id}`, {
    method: "PATCH",
    auth: true,
    body: input,
  });

  return extractData<AttendanceEntity>(payload);
}
