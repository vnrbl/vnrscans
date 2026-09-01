"use client";

import { useEffect, useState, Suspense } from "react";
import { BookOpen, Lock, ArrowRight, Sparkles, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SITE_NAME } from "@/lib/brand";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const code = searchParams?.get("code") || null;

  const [exchanging, setExchanging] = useState(!!code);
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (code) {
      setExchanging(true);
      supabase.auth.exchangeCodeForSession(code)
        .then(({ error }) => {
          setExchanging(false);
          if (error) {
            console.error("Exchange code error:", error);
            setExchangeError(error.message);
            toast.error("Failed to verify reset link: " + error.message);
          } else {
            toast.success("Identity verified. Please set your new password.");
          }
        })
        .catch((err) => {
          setExchanging(false);
          console.error("Exchange code exception:", err);
          setExchangeError(err.message || "An error occurred");
        });
    }
  }, [code]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset successfully! Redirecting...");
      setTimeout(() => {
        router.push("/home");
      }, 1500);
    }
  };

  const isReady = user && !exchanging && !exchangeError;

  return (
    <div className="relative z-10 w-full max-w-[440px] card-spacex bg-surface-1 p-8 hover:border-hairline-strong transition-all duration-300">
      {/* Brand logo */}
      <div className="mb-8 flex flex-col items-center">
        <div className="mb-4 grid h-14 w-14 place-items-center rounded border border-neutral-850 bg-neutral-950">
          <BookOpen className="h-7 w-7 text-white stroke-[1.5]" />
        </div>
        <h1 className="text-2xl font-bold uppercase tracking-[0.08em] text-white">
          {SITE_NAME}
        </h1>
      </div>

      <div className="mb-8 text-center sm:text-left">
        <h2 className="text-xl font-bold uppercase tracking-[0.04em] text-white">Reset Password</h2>
        <p className="mt-2 text-xs text-neutral-400 font-light">
          {isReady ? "Please choose a strong password to secure your account" : "Verifying recovery link..."}
        </p>
      </div>

      {authLoading || exchanging ? (
        <div className="space-y-4 text-center py-6">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <p className="text-xs text-neutral-400">Verifying security token...</p>
        </div>
      ) : exchangeError ? (
        <div className="space-y-6 text-center py-4">
          <div className="rounded border border-red-900/50 bg-red-950/20 p-4 text-xs text-red-400">
            {exchangeError}
          </div>
          <button
            onClick={() => router.push("/auth")}
            className="group relative h-12 w-full rounded bg-white hover:bg-neutral-200 text-black text-xs font-bold uppercase tracking-[0.08em] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            Back to login
          </button>
        </div>
      ) : !user ? (
        <div className="space-y-6 text-center py-4">
          <div className="rounded border border-neutral-850 bg-neutral-950/50 p-4 text-xs text-neutral-400">
            Invalid or expired password reset link. Please request a new link from the login page.
          </div>
          <button
            onClick={() => router.push("/auth")}
            className="group relative h-12 w-full rounded bg-white hover:bg-neutral-200 text-black text-xs font-bold uppercase tracking-[0.08em] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            Go to login
          </button>
        </div>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-[0.04em] text-neutral-300">New Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <Input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="h-12 rounded border border-neutral-800 bg-neutral-950 pl-11 pr-11 text-sm text-white placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-neutral-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors text-neutral-500 hover:text-white"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-[0.04em] text-neutral-300">Confirm Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <Input
                type={showConfirmPassword ? "text" : "password"}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 rounded border border-neutral-800 bg-neutral-950 pl-11 pr-11 text-sm text-white placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-neutral-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors text-neutral-500 hover:text-white"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="group relative h-12 w-full rounded bg-white hover:bg-neutral-200 text-black text-xs font-bold uppercase tracking-[0.08em] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? "Updating..." : "Update Password"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 stroke-[2]" />
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-black text-foreground">
      {/* Left hero panel (desktop only) */}
      <div className="relative hidden lg:flex flex-col items-center justify-center overflow-hidden bg-black border-r border-neutral-900">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 flex max-w-md flex-col items-center px-6 text-center xl:px-12">
          <div className="mb-8 grid h-16 w-16 place-items-center rounded border border-neutral-800 bg-neutral-950 text-white">
            <BookOpen className="h-8 w-8 stroke-[1.5]" />
          </div>

          <h1 className="mb-4 text-4xl font-bold uppercase tracking-[0.08em] text-white">
            {SITE_NAME}
          </h1>

          <p className="mb-12 text-sm leading-relaxed text-neutral-400 font-light tracking-[0.01em]">
            Keep your account secure. If you have any issues accessing your account, please contact our administrator.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded border border-neutral-800 bg-neutral-950/50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              <Sparkles className="h-3.5 w-3.5 stroke-[1.5]" />
              Secure Authentication
            </span>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="relative flex items-center justify-center p-6 sm:p-10 bg-black">
        <Suspense
          fallback={
            <div className="relative z-10 w-full max-w-[440px] card-spacex bg-surface-1 p-8 text-center py-12">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent mb-4" />
              <p className="text-xs text-neutral-400">Loading form components...</p>
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
