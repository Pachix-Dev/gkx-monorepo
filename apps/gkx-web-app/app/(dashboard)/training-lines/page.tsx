import { TrainingLinesClient } from "@/features/training-lines/components/training-lines-client";
import { extractArray } from "@/lib/api/response";
import { queryKeys } from "@/lib/query/keys";
import { createQueryClient } from "@/lib/query/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL;

async function fetchAuthedArray(path: string, token: string | undefined) {
  if (!API_BASE_URL || !token) {
    return [];
  }

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
    return [];
  }

  if (!response.ok) {
    return [];
  }

  try {
    const payload = await response.json();
    return extractArray(payload);
  } catch {
    return [];
  }
}

export default async function TrainingLinesPage() {
  const queryClient = createQueryClient();
  const token = (await cookies()).get("gkx_access_token")?.value;

  await queryClient.prefetchQuery({
    queryKey: queryKeys.trainingLines,
    queryFn: () => fetchAuthedArray("/training-lines", token),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TrainingLinesClient />
    </HydrationBoundary>
  );
}
