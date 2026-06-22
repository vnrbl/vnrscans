"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Analytics } from "@vercel/analytics/react";

import { Navbar } from "@/components/Navbar";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { isReaderLayoutPath } from "@/lib/layout";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ReaderSettingsProvider } from "@/contexts/ReaderSettingsContext";
import { AuthProvider } from "@/hooks/useAuth";
import { NavigationProgress } from "@/components/NavigationProgress";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 2,
            gcTime: 1000 * 60 * 20,
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <ReaderSettingsProvider>
            <AppShell>{children}</AppShell>
          </ReaderSettingsProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const bare = isReaderLayoutPath(pathname) || pathname.startsWith("/auth");
  const lastAuthUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code && (pathname === "/" || pathname === "/auth" || pathname === "")) {
        router.push(`/auth/reset-password?code=${code}`);
      }
    }
  }, [pathname, router]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUserId = session?.user?.id ?? null;
      if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") {
        lastAuthUserId.current = nextUserId;
        return;
      }

      if (lastAuthUserId.current === nextUserId && event !== "USER_UPDATED") {
        return;
      }

      lastAuthUserId.current = nextUserId;
      router.refresh();
    });
    return () => subscription.unsubscribe();
  }, [router]);

  if (bare) {
    return (
      <>
        <NavigationProgress />
        {children}
        <Toaster />
        <Analytics />
      </>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <NavigationProgress />
      <AnnouncementBanner />
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <Toaster />
      <Analytics />
    </div>
  );
}
