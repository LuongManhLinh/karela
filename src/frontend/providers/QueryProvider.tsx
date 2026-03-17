"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is fresh for 1 minute
            staleTime: 60 * 1000, 
            // No refetch on window focus
            refetchOnWindowFocus: false, 
            // Polling default 0 (disabled) is standard, but explicit here if needed
            refetchInterval: 0, 
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
