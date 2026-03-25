import { apiRequest } from "@/lib/api/client";
import { extractArray, extractData } from "@/lib/api/response";

export type EvaluationItemInput = {
  criterionCode: string;
  criterionLabel: string;
  score: number;
  comment?: string;
};

export type EvaluationEntity = {
  id: string;
  tenantId: string;
  trainingSessionId?: string | null;
  goalkeeperId: string;
  evaluatedByUserId: string;
  evaluationDate: string;
  overallScore: number;
  generalComment?: string | null;
  items: Array<{
    id: string;
    evaluationId: string;
    criterionCode: string;
    criterionLabel: string;
    score: number;
    comment?: string | null;
  }>;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateEvaluationInput = {
  tenantId: string;
  trainingSessionId: string;
  goalkeeperId: string;
  evaluationDate: string;
  generalComment?: string;
  items: EvaluationItemInput[];
};

export async function getEvaluations() {
  const payload = await apiRequest<unknown>("/evaluations", {
    method: "GET",
    auth: true,
  });

  return extractArray<EvaluationEntity>(payload);
}

export async function getEvaluationsBySession(sessionId: string) {
  const payload = await apiRequest<unknown>(`/evaluations/session/${sessionId}`, {
    method: "GET",
    auth: true,
  });

  return extractArray<EvaluationEntity>(payload);
}

export async function createEvaluation(input: CreateEvaluationInput) {
  const payload = await apiRequest<unknown>("/evaluations", {
    method: "POST",
    auth: true,
    body: input,
  });

  return extractData<EvaluationEntity>(payload);
}

export async function deleteEvaluation(id: string) {
  await apiRequest<unknown>(`/evaluations/${id}`, {
    method: "DELETE",
    auth: true,
  });
}
