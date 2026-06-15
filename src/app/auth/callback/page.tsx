"use client";
 
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
 
export default function AuthCallbackPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);
  const exchangeStarted = useRef(false);
 
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
    const code = searchParams.get("code");
    const hasHashToken = window.location.hash.includes("access_token");
    const isExchanging = !!code || hasHashToken;
 
    if (user) {
      router.replace("/home");
      return;
    }
 
    if (code && !exchangeStarted.current) {
      exchangeStarted.current = true;
      supabase.auth.exchangeCodeForSession(code)
        .then(({ error }) => {
          if (error) {
            console.error("Error exchanging code for session:", error);
            toast.error(error.message);
            router.replace("/auth");
          } else {
            router.replace("/home");
          }
        })
        .catch((err) => {
          console.error("Failed to exchange code:", err);
          router.replace("/auth");
        });
      return;
    }
 
    if (timedOut) {
      router.replace("/auth");
      toast.error("Authentication timed out or failed. Please try again.");
      return;
    }
 
    if (!loading && !isExchanging) {
      router.replace("/auth");
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
 
  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
        <p className="text-sm font-medium tracking-wide">Completing sign in...</p>
      </div>
    </div>
  );
}
