import { TeamsClient } from "@/features/teams/components/teams-client";
import { extractArray } from "@/lib/api/response";
import { queryKeys } from "@/lib/query/keys";
import { createQueryClient } from "@/lib/query/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function fetchAuthedArray(path: string, token: string | undefined) {
  if (!API_BASE_URL || !token) {
    return [];
  }

  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  const payload = await response.json();
  return extractArray(payload);
}

export default async function TeamsPage() {
  const queryClient = createQueryClient();
  const token = (await cookies()).get("gkx_access_token")?.value;

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.teams,
      queryFn: () => fetchAuthedArray("/teams", token),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.users,
      queryFn: () => fetchAuthedArray("/users", token),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.goalkeepers,
      queryFn: () => fetchAuthedArray("/goalkeepers", token),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TeamsClient />
    </HydrationBoundary>
  );
}
