"use client";

import { useEffect, useState, useRef } from "react";
import { BookOpen, Mail, Lock, User, ArrowRight, Sparkles, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SITE_NAME } from "@/lib/brand";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#FFFFFF"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#E0E0E0"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#CCCCCC"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#F0F0F0"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export default function AuthPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  useEffect(() => {
    if (user) router.push("/home");
  }, [user, router]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("error=")) {
      const desc = new URLSearchParams(hash.slice(1)).get("error_description");
      if (desc) toast.error(decodeURIComponent(desc.replace(/\+/g, " ")));
    }
  }, []);

  const [loading, setLoading] = useState(false);

  const onGoogle = async () => {
    setLoading(true);
    const redirectTo = `${window.location.origin}/home`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  const onDiscord = async () => {
    setLoading(true);
    const redirectTo = `${window.location.origin}/home`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  const onSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Welcome back");
  };

  const onSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.auth.signUp({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      options: {
        emailRedirectTo: window.location.origin,
        data: { username: String(fd.get("username") || "") },
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Check your email to verify your account");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-black text-foreground">
      {/* ─── Left hero panel (desktop only) ─── */}
      <div className="relative hidden lg:flex flex-col items-center justify-center overflow-hidden bg-black border-r border-neutral-900">
        {/* Grid pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Hero content */}
        <div className="relative z-10 flex max-w-md flex-col items-center px-6 text-center xl:px-12">
          {/* Logo mark */}
          <div className="mb-8 grid h-16 w-16 place-items-center rounded border border-neutral-800 bg-neutral-950 text-white">
            <BookOpen className="h-8 w-8 stroke-[1.5]" />
          </div>

          <h1 className="mb-4 text-4xl font-bold uppercase tracking-[0.08em] text-white">
            {SITE_NAME}
          </h1>

          <p className="mb-12 text-sm leading-relaxed text-neutral-400 font-light tracking-[0.01em]">
            Your ultimate destination for discovering, reading, and tracking your favorite manhwa series.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3">
            {["Track Progress", "Bookmark Series", "Get Notified"].map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded border border-neutral-800 bg-neutral-950/50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-400"
              >
                <Sparkles className="h-3.5 w-3.5 stroke-[1.5]" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Right auth panel ─── */}
      <div className="relative flex items-center justify-center p-6 sm:p-10 bg-black">
        <div className="relative z-10 w-full max-w-[440px] card-spacex bg-surface-1 p-8 hover:border-hairline-strong transition-all duration-300">
          {/* Mobile-only branding */}
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <div className="mb-4 grid h-14 w-14 place-items-center rounded border border-neutral-850 bg-neutral-950">
              <BookOpen className="h-7 w-7 text-white stroke-[1.5]" />
            </div>
            <h1 className="text-2xl font-bold uppercase tracking-[0.08em] text-white">
              {SITE_NAME}
            </h1>
          </div>

          {/* Welcome heading */}
          <div className="mb-8">
            <h2 className="text-xl font-bold uppercase tracking-[0.04em] text-white">Welcome back</h2>
            <p className="mt-2 text-xs text-neutral-400 font-light">
              Sign in to your account to continue reading
            </p>
          </div>

          {/* ─── OAuth buttons ─── */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={onGoogle}
              disabled={loading}
              id="auth-google-btn"
              className="group relative flex h-12 w-full items-center justify-center gap-3 rounded border border-neutral-800 bg-neutral-950 text-xs font-bold uppercase tracking-[0.08em] text-white transition-all hover:border-neutral-500 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <GoogleIcon className="h-4.5 w-4.5" />
              Continue with Google
            </button>

            <button
              type="button"
              onClick={onDiscord}
              disabled={loading}
              id="auth-discord-btn"
              className="group relative flex h-12 w-full items-center justify-center gap-3 rounded border border-neutral-800 bg-neutral-950 text-xs font-bold uppercase tracking-[0.08em] text-white transition-all hover:border-neutral-500 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <DiscordIcon className="h-4.5 w-4.5 text-neutral-300" />
              Continue with Discord
            </button>
          </div>

          {/* ─── Divider ─── */}
          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-neutral-900" />
            <span className="text-3xs font-bold uppercase tracking-widest text-neutral-550">
              or continue with email
            </span>
            <div className="h-px flex-1 bg-neutral-900" />
          </div>

          {/* ─── Tabs ─── */}
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded border border-neutral-800 bg-neutral-950 p-1">
              <TabsTrigger
                value="signin"
                className="rounded text-xs font-bold uppercase tracking-[0.08em] text-neutral-400 data-[state=active]:bg-white data-[state=active]:text-black transition-all py-2 cursor-pointer"
              >
                Sign in
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="rounded text-xs font-bold uppercase tracking-[0.08em] text-neutral-400 data-[state=active]:bg-white data-[state=active]:text-black transition-all py-2 cursor-pointer"
              >
                Create account
              </TabsTrigger>
            </TabsList>

            {/* Sign In form */}
            <TabsContent value="signin" className="mt-6">
              <form onSubmit={onSignIn} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-[0.04em] text-neutral-300">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                    <Input
                      name="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      id="signin-email"
                      className="h-12 rounded border border-neutral-800 bg-neutral-950 pl-11 text-sm text-white placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-neutral-500 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-[0.04em] text-neutral-300">Password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                    <Input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      id="signin-password"
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

                <button
                  type="submit"
                  disabled={loading}
                  id="signin-submit-btn"
                  className="group relative h-12 w-full rounded bg-white hover:bg-neutral-200 text-black text-xs font-bold uppercase tracking-[0.08em] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Sign in
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 stroke-[2]" />
                </button>
              </form>
            </TabsContent>

            {/* Sign Up form */}
            <TabsContent value="signup" className="mt-6">
              <form onSubmit={onSignUp} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-[0.04em] text-neutral-300">Username</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                    <Input
                      name="username"
                      required
                      minLength={3}
                      placeholder="your_username"
                      id="signup-username"
                      className="h-12 rounded border border-neutral-800 bg-neutral-950 pl-11 text-sm text-white placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-neutral-500 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-[0.04em] text-neutral-300">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                    <Input
                      name="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      id="signup-email"
                      className="h-12 rounded border border-neutral-800 bg-neutral-950 pl-11 text-sm text-white placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-neutral-500 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-[0.04em] text-neutral-300">Password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                    <Input
                      name="password"
                      type={showSignUpPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="Min. 6 characters"
                      id="signup-password"
                      className="h-12 rounded border border-neutral-800 bg-neutral-950 pl-11 pr-11 text-sm text-white placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-neutral-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors text-neutral-500 hover:text-white"
                      tabIndex={-1}
                    >
                      {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  id="signup-submit-btn"
                  className="group relative h-12 w-full rounded bg-white hover:bg-neutral-200 text-black text-xs font-bold uppercase tracking-[0.08em] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Create account
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 stroke-[2]" />
                </button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Footer text */}
          <p className="mt-8 text-center text-3xs tracking-wide text-neutral-500">
            By continuing, you agree to our{" "}
            <a href="/terms" className="underline underline-offset-2 hover:text-white transition-colors">
              Terms
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline underline-offset-2 hover:text-white transition-colors">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
