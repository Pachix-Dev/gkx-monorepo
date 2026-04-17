import { TrainingSessionDetailClient } from "@/features/training-sessions/components/training-session-detail-client";
import { extractData } from "@/lib/api/response";
import {
  fetchServerApiArray,
  fetchServerApiJson,
  isServerApiNotFound,
  isServerApiUnauthorized,
} from "@/lib/api/server-fetch";
import { queryKeys } from "@/lib/query/keys";
import { createQueryClient } from "@/lib/query/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

// async-parallel: independents fetched in parallel via Promise.all (vercel-react-best-practices)
export default async function TrainingSessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const queryClient = createQueryClient();
  const token = (await cookies()).get("gkx_access_token")?.value;

  const [sessionResult] = await Promise.all([
    fetchServerApiJson<unknown>(`/training-sessions/${id}`, token),
    queryClient.prefetchQuery({
      queryKey: queryKeys.sessionContents(id),
      queryFn: () => fetchServerApiArray(`/training-sessions/${id}/contents`, token),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.sessionExercises(id),
      queryFn: () => fetchServerApiArray(`/training-sessions/${id}/exercises`, token),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.attendanceBySession(id),
      queryFn: () => fetchServerApiArray(`/attendance/session/${id}`, token),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.evaluationsBySession(id),
      queryFn: () => fetchServerApiArray(`/evaluations/session/${id}`, token),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.trainingContents({}),
      queryFn: () => fetchServerApiArray("/training-contents", token),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.exercises({}),
      queryFn: () => fetchServerApiArray("/exercises", token),
    }),
  ]);

  if (isServerApiNotFound(sessionResult)) {
    notFound();
  }

  if (isServerApiUnauthorized(sessionResult)) {
    redirect(`/login?next=/training-sessions/${id}`);
  }

  if (!sessionResult.ok) {
    throw new Error("No se pudo cargar la sesion de entrenamiento.");
  }

  const session = extractData<unknown>(sessionResult.data);
  if (!session) {
    notFound();
  }

  queryClient.setQueryData(queryKeys.trainingSession(id), session);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TrainingSessionDetailClient id={id} />
    </HydrationBoundary>
  );
}
