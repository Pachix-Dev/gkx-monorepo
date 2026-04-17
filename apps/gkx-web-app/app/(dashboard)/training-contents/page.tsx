import { TrainingContentsClient } from "@/features/training-contents/components/training-contents-client";
import { fetchServerApiArray } from "@/lib/api/server-fetch";
import { queryKeys } from "@/lib/query/keys";
import { createQueryClient } from "@/lib/query/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { cookies } from "next/headers";

export default async function TrainingContentsPage() {
  const queryClient = createQueryClient();
  const token = (await cookies()).get("gkx_access_token")?.value;

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.trainingContents({}),
      queryFn: () => fetchServerApiArray("/training-contents", token),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.trainingLines,
      queryFn: () => fetchServerApiArray("/training-lines", token),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TrainingContentsClient />
    </HydrationBoundary>
  );
}
