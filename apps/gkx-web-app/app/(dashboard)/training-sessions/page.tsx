import { TrainingSessionsClient } from "@/features/training-sessions/components/training-sessions-client";
import { fetchServerApiArray } from "@/lib/api/server-fetch";
import { queryKeys } from "@/lib/query/keys";
import { createQueryClient } from "@/lib/query/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { cookies } from "next/headers";

export default async function TrainingSessionsPage() {
  const queryClient = createQueryClient();
  const token = (await cookies()).get("gkx_access_token")?.value;

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.trainingSessions,
      queryFn: () => fetchServerApiArray("/training-sessions", token),
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

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TrainingSessionsClient />
    </HydrationBoundary>
  );
}
