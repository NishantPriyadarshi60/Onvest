"use client";

// apps/web/src/app/providers.tsx
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";
import { useState } from "react";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";

function isNetworkError(error: unknown): boolean {
  const msg = String(error instanceof Error ? error.message : error).toLowerCase();
  return msg.includes("fetch") || msg.includes("network") || msg.includes("failed to fetch");
}

function getUserFriendlyMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (isNetworkError(error)) return "Check your connection and try again.";
  if (msg.includes("401") || msg.includes("Unauthorized")) return "Please sign in again.";
  if (msg.includes("403") || msg.includes("Forbidden")) return "You don't have permission for this action.";
  if (msg.includes("404")) return "The requested resource was not found.";
  if (msg.includes("500") || msg.includes("Internal Server Error")) return "Something went wrong. Please try again.";
  if (msg.length > 100) return "Something went wrong. Please try again.";
  return msg;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: (failureCount, error) => {
              const msg = String(error);
              if (msg.includes("401") || msg.includes("403")) return false;
              return failureCount < 2;
            },
          },
        },
        queryCache: new QueryCache({
          onError: (error) => {
            const message = getUserFriendlyMessage(error);
            toast.error(message, {
              ...(isNetworkError(error) && {
                action: {
                  label: "Retry",
                  onClick: () => window.location.reload(),
                },
              }),
            });
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            const message = getUserFriendlyMessage(error);
            toast.error(message, {
              ...(isNetworkError(error) && {
                action: {
                  label: "Retry",
                  onClick: () => window.location.reload(),
                },
              }),
            });
          },
        }),
      })
  );

  return (
    <ErrorBoundary>
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ["email", "wallet"],
        appearance: {
          theme: "light",
          accentColor: "#1D4ED8",
          logo: "/logo.svg",
        },
        embeddedWallets: {
          ethereum: { createOnLogin: "off" },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </PrivyProvider>
    </ErrorBoundary>
  );
}
