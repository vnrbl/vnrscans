"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export const dynamic = "force-dynamic";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-[50vh] items-center justify-center" suppressHydrationWarning>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" suppressHydrationWarning />
      </div>
    );
  }

  return <>{children}</>;
}
