import { ExerciseDetailClient } from "@/features/exercises/components/exercise-detail-client";
import { extractData } from "@/lib/api/response";
import {
  fetchServerApiArray,
  fetchServerApiJson,
  isServerApiNotFound,
  isServerApiUnauthorized,
} from "@/lib/api/server-fetch";
import { createQueryClient } from "@/lib/query/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getEditorBackgrounds, getEditorShapeGroups } from "@/features/tactical-editor/server/get-editor-assets";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

export default async function ExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = (await cookies()).get("gkx_access_token")?.value;
  const queryClient = createQueryClient();

  const [exerciseResult] = await Promise.all([
    fetchServerApiJson<unknown>(`/exercises/${id}`, token),
    queryClient.prefetchQuery({
      queryKey: ["training-contents", {}],
      queryFn: () => fetchServerApiArray("/training-contents", token),
    }),
    queryClient.prefetchQuery({
      queryKey: ["training-lines"],
      queryFn: () => fetchServerApiArray("/training-lines", token),
    }),
  ]);

  if (isServerApiNotFound(exerciseResult)) {
    notFound();
  }

  if (isServerApiUnauthorized(exerciseResult)) {
    redirect(`/login?next=/exercises/${id}`);
  }

  if (!exerciseResult.ok) {
    throw new Error("No se pudo cargar el ejercicio.");
  }

  const exercise = extractData(exerciseResult.data);
  if (!exercise) {
    notFound();
  }

  queryClient.setQueryData(["exercises", id], exercise);

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
