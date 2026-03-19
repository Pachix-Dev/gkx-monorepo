"use client";

import { AuthProvider } from "@/features/auth/auth-provider";
import { createQueryClient } from "@/lib/query/query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sileo";

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster position="top-center" theme="system" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
