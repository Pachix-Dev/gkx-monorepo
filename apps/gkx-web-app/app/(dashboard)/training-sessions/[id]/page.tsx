import { TrainingSessionDetailClient } from "@/features/training-sessions/components/training-session-detail-client";
import { extractArray, extractData } from "@/lib/api/response";
import { queryKeys } from "@/lib/query/keys";
import { createQueryClient } from "@/lib/query/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function fetchAuthed(path: string, token: string | undefined) {
  if (!API_BASE_URL || !token) return null;

  const res = await fetch(`${API_BASE_URL}/api${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

// async-parallel: independents fetched in parallel via Promise.all (vercel-react-best-practices)
export default async function TrainingSessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const queryClient = createQueryClient();
  const token = (await cookies()).get("gkx_access_token")?.value;

  const [sessionPayload] = await Promise.all([
    fetchAuthed(`/training-sessions/${id}`, token),
    queryClient.prefetchQuery({
      queryKey: queryKeys.trainingSession(id),
      queryFn: () => fetchAuthed(`/training-sessions/${id}`, token).then((p) => (p ? extractData(p) : null)),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.sessionContents(id),
      queryFn: () => fetchAuthed(`/training-sessions/${id}/contents`, token).then((p) => (p ? extractArray(p) : [])),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.sessionExercises(id),
      queryFn: () => fetchAuthed(`/training-sessions/${id}/exercises`, token).then((p) => (p ? extractArray(p) : [])),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.trainingContents({}),
      queryFn: () => fetchAuthed("/training-contents", token).then((p) => (p ? extractArray(p) : [])),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.exercises({}),
      queryFn: () => fetchAuthed("/exercises", token).then((p) => (p ? extractArray(p) : [])),
    }),
  ]);

  if (!sessionPayload) {
    notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TrainingSessionDetailClient id={id} />
    </HydrationBoundary>
  );
}
