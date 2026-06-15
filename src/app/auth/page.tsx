"use client";

import { useEffect, useState } from "react";
import { BookOpen, Mail, Lock, User, ArrowRight, Sparkles, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SITE_NAME } from "@/lib/brand";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  useEffect(() => {
    if (user) router.push("/home");
  }, [user, router]);

  const [loading, setLoading] = useState(false);

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
