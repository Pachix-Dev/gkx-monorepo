import { TeamsClient } from "@/features/teams/components/teams-client";
import { requireServerRole } from "@/lib/auth/server-guard";
import { fetchServerApiArray } from "@/lib/api/server-fetch";
import { queryKeys } from "@/lib/query/keys";
import { createQueryClient } from "@/lib/query/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { cookies } from "next/headers";

export default async function TeamsPage() {
  await requireServerRole(["SUPER_ADMIN", "USER"]);

  const queryClient = createQueryClient();
  const token = (await cookies()).get("gkx_access_token")?.value;

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.teams,
      queryFn: () => fetchServerApiArray("/teams", token),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.users,
      queryFn: () => fetchServerApiArray("/users", token),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.goalkeepers,
      queryFn: () => fetchServerApiArray("/goalkeepers", token),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TeamsClient />
    </HydrationBoundary>
  );
}
