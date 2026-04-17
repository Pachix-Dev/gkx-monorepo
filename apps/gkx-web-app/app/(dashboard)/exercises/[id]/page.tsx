import { ExerciseDetailClient } from "@/features/exercises/components/exercise-detail-client";
import { extractArray, extractData } from "@/lib/api/response";
import { createQueryClient } from "@/lib/query/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getEditorBackgrounds, getEditorShapeGroups } from "@/features/tactical-editor/server/get-editor-assets";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

const API_BASE_URL = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL;

async function fetchAuthed<T>(path: string, token: string | undefined): Promise<T | null> {
  if (!API_BASE_URL || !token) return null;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api${path}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
  } catch {
    return null;
  }

  if (!response.ok) return null;

  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function fetchAuthedArray(path: string, token: string | undefined) {
  if (!API_BASE_URL || !token) return [];
  const payload = await fetchAuthed<unknown>(path, token);
  return extractArray(payload);
}

export default async function ExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = (await cookies()).get("gkx_access_token")?.value;
  const queryClient = createQueryClient();

  const [exercisePayload] = await Promise.all([
    fetchAuthed<unknown>(`/exercises/${id}`, token),
    queryClient.prefetchQuery({
      queryKey: ["exercises", id],
      queryFn: () => fetchAuthed(`/exercises/${id}`, token).then((p) => extractData(p)),
    }),
    queryClient.prefetchQuery({
      queryKey: ["training-contents", {}],
      queryFn: () => fetchAuthedArray("/training-contents", token),
    }),
    queryClient.prefetchQuery({
      queryKey: ["training-lines"],
      queryFn: () => fetchAuthedArray("/training-lines", token),
    }),
  ]);

  const exercise = extractData(exercisePayload);
  if (!exercise) {
    notFound();
  }

  const [backgrounds, shapeGroups] = await Promise.all([
    getEditorBackgrounds(),
    getEditorShapeGroups(),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ExerciseDetailClient
        exerciseId={id}
        backgrounds={backgrounds}
        shapeGroups={shapeGroups}
      />
    </HydrationBoundary>
  );
}
