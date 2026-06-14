"use client";

<<<<<<< HEAD
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
=======
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
>>>>>>> 494169f7ef27f1625e7a0c5e41aa4c0dea1d9493

export default function AuthCallbackPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
<<<<<<< HEAD
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const searchParams = new URLSearchParams(window.location.search);
    
    // Check for auth errors in query params or hash
    const hasError = searchParams.has("error") || window.location.hash.includes("error=");
    let errorMessage = "";
    
    if (hasError) {
      if (window.location.hash.includes("error=")) {
        errorMessage = new URLSearchParams(window.location.hash.slice(1)).get("error_description") || "Authentication failed";
      } else {
        errorMessage = searchParams.get("error_description") || "Authentication failed";
      }
    }

    if (hasError) {
      toast.error(decodeURIComponent(errorMessage.replace(/\+/g, " ")));
      router.replace("/auth");
      return;
    }

    // Detect if we have active OAuth parameters in the URL
    const hasCode = searchParams.has("code");
    const hasHashToken = window.location.hash.includes("access_token");
    const isExchanging = hasCode || hasHashToken;

    if (!loading) {
      if (user) {
        router.replace("/home");
      } else if (!isExchanging || timedOut) {
        router.replace("/auth");
        if (timedOut) {
          toast.error("Authentication timed out or failed. Please try again.");
        }
      }
    }
  }, [user, loading, timedOut, router]);

  // Set fallback timeout to prevent hanging if code exchange fails or is invalid
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const searchParams = new URLSearchParams(window.location.search);
    const hasCode = searchParams.has("code");
    const hasHashToken = window.location.hash.includes("access_token");
    
    if (hasCode || hasHashToken) {
      const timer = setTimeout(() => {
        setTimedOut(true);
      }, 8000); // 8 seconds timeout
      return () => clearTimeout(timer);
    }
  }, []);
=======

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace("/home");
      } else {
        router.replace("/auth");
      }
    }
  }, [user, loading, router]);
>>>>>>> 494169f7ef27f1625e7a0c5e41aa4c0dea1d9493

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
        <p className="text-sm font-medium tracking-wide">Completing sign in...</p>
      </div>
    </div>
  );
}
