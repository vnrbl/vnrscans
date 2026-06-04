import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { BookOpen, Mail, Lock, User, ArrowRight, Sparkles, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SITE_NAME, pageTitle } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: pageTitle("Sign in") }] }),
  component: AuthPage,
});

/* ─── SVG brand icons ─── */

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
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

/* ─── Animated background orbs for the hero panel ─── */

function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Large purple orb */}
      <div
        className="absolute rounded-full opacity-30 blur-[80px]"
        style={{
          width: 420,
          height: 420,
          background: "oklch(0.68 0.22 305)",
          top: "10%",
          left: "15%",
          animation: "floatOrb1 14s ease-in-out infinite",
        }}
      />
      {/* Medium cyan orb */}
      <div
        className="absolute rounded-full opacity-25 blur-[60px]"
        style={{
          width: 280,
          height: 280,
          background: "oklch(0.78 0.16 200)",
          bottom: "15%",
          right: "10%",
          animation: "floatOrb2 18s ease-in-out infinite",
        }}
      />
      {/* Small accent orb */}
      <div
        className="absolute rounded-full opacity-20 blur-[50px]"
        style={{
          width: 180,
          height: 180,
          background: "oklch(0.72 0.20 260)",
          top: "55%",
          left: "55%",
          animation: "floatOrb3 12s ease-in-out infinite",
        }}
      />
    </div>
  );
}

/* ─── Keyframe styles injected once ─── */

const keyframeStyles = `
@keyframes floatOrb1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -40px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}
@keyframes floatOrb2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-25px, 30px) scale(1.08); }
  66% { transform: translate(35px, -15px) scale(0.92); }
}
@keyframes floatOrb3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(20px, -30px) scale(1.1); }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 20px oklch(0.68 0.22 305 / 0.3), 0 0 40px oklch(0.68 0.22 305 / 0.1); }
  50% { box-shadow: 0 0 30px oklch(0.68 0.22 305 / 0.5), 0 0 60px oklch(0.68 0.22 305 / 0.2); }
}
@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}
`;

/* ─── Main page ─── */

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const stylesInjected = useRef(false);

  useEffect(() => {
    if (user) navigate({ to: "/home" });
  }, [user, navigate]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("error=")) {
      const desc = new URLSearchParams(hash.slice(1)).get("error_description");
      if (desc) toast.error(decodeURIComponent(desc.replace(/\+/g, " ")));
    }
  }, []);

  // Inject keyframes once
  useEffect(() => {
    if (stylesInjected.current) return;
    stylesInjected.current = true;
    const style = document.createElement("style");
    style.textContent = keyframeStyles;
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
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
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ─── Left hero panel (desktop only) ─── */}
      <div
        className="relative hidden lg:flex flex-col items-center justify-center overflow-hidden"
        style={{
          background: "linear-gradient(145deg, oklch(0.18 0.01 286), oklch(0.14 0.02 305), oklch(0.16 0.015 240))",
        }}
      >
        <FloatingOrbs />

        {/* Grid pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.97 0 0 / 0.3) 1px, transparent 1px), linear-gradient(90deg, oklch(0.97 0 0 / 0.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Hero content */}
        <div
          className="relative z-10 flex max-w-md flex-col items-center px-12 text-center"
          style={{ animation: "slideInLeft 0.8s ease-out both" }}
        >
          {/* Logo mark */}
          <div
            className="mb-8 grid h-20 w-20 place-items-center rounded-2xl"
            style={{
              background: "linear-gradient(135deg, oklch(0.68 0.22 305), oklch(0.55 0.25 290))",
              animation: "pulseGlow 4s ease-in-out infinite",
            }}
          >
            <BookOpen className="h-10 w-10 text-white" strokeWidth={2} />
          </div>

          <h1
            className="mb-4 text-4xl font-extrabold tracking-tight"
            style={{
              background: "linear-gradient(135deg, oklch(0.95 0.01 286), oklch(0.78 0.16 200), oklch(0.68 0.22 305))",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {SITE_NAME}
          </h1>

          <p
            className="mb-10 text-lg leading-relaxed"
            style={{ color: "oklch(0.7 0.01 286)" }}
          >
            Your ultimate destination for discovering, reading, and tracking your favorite manhwa series.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3">
            {["Track Progress", "Bookmark Series", "Get Notified"].map((label, i) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium"
                style={{
                  borderColor: "oklch(0.68 0.22 305 / 0.3)",
                  background: "oklch(0.68 0.22 305 / 0.08)",
                  color: "oklch(0.82 0.12 305)",
                  animation: `fadeInUp 0.5s ease-out ${0.3 + i * 0.15}s both`,
                }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
          style={{
            background: "linear-gradient(to top, oklch(0.14 0.02 305), transparent)",
          }}
        />
      </div>

      {/* ─── Right auth panel ─── */}
      <div
        className="relative flex items-center justify-center p-6 sm:p-10"
        style={{
          background: "linear-gradient(180deg, oklch(0.21 0.006 286), oklch(0.19 0.008 300))",
        }}
      >
        {/* Subtle glow behind the card */}
        <div
          className="pointer-events-none absolute opacity-40 blur-[100px] lg:hidden"
          style={{
            width: 300,
            height: 300,
            background: "oklch(0.68 0.22 305)",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        />

        <div
          className="relative z-10 w-full max-w-[440px]"
          style={{ animation: "fadeInUp 0.6s ease-out both" }}
        >
          {/* Mobile-only branding */}
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <div
              className="mb-4 grid h-14 w-14 place-items-center rounded-xl"
              style={{
                background: "linear-gradient(135deg, oklch(0.68 0.22 305), oklch(0.55 0.25 290))",
                boxShadow: "0 0 30px oklch(0.68 0.22 305 / 0.4)",
              }}
            >
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <h1
              className="text-2xl font-extrabold tracking-tight"
              style={{
                background: "linear-gradient(135deg, oklch(0.95 0.01 286), oklch(0.78 0.16 200))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {SITE_NAME}
            </h1>
          </div>

          {/* Welcome heading */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="mt-1 text-sm" style={{ color: "oklch(0.6 0.006 286)" }}>
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
              className="group relative flex h-12 w-full items-center justify-center gap-3 rounded-xl border text-sm font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
              style={{
                borderColor: "oklch(0.35 0.004 286 / 0.6)",
                background: "oklch(0.255 0.004 286)",
                color: "oklch(0.92 0.003 286)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "oklch(0.68 0.22 305 / 0.5)";
                e.currentTarget.style.background = "oklch(0.28 0.006 286)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "oklch(0.35 0.004 286 / 0.6)";
                e.currentTarget.style.background = "oklch(0.255 0.004 286)";
              }}
            >
              <GoogleIcon className="h-5 w-5" />
              Continue with Google
            </button>

            <button
              type="button"
              onClick={onDiscord}
              disabled={loading}
              id="auth-discord-btn"
              className="group relative flex h-12 w-full items-center justify-center gap-3 rounded-xl border text-sm font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
              style={{
                borderColor: "oklch(0.35 0.004 286 / 0.6)",
                background: "oklch(0.255 0.004 286)",
                color: "oklch(0.92 0.003 286)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "oklch(0.55 0.18 265 / 0.6)";
                e.currentTarget.style.background = "oklch(0.28 0.006 286)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "oklch(0.35 0.004 286 / 0.6)";
                e.currentTarget.style.background = "oklch(0.255 0.004 286)";
              }}
            >
              <DiscordIcon className="h-5 w-5" />
              Continue with Discord
            </button>
          </div>

          {/* ─── Divider ─── */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1" style={{ background: "oklch(0.35 0.004 286 / 0.5)" }} />
            <span
              className="text-xs font-medium uppercase tracking-widest"
              style={{ color: "oklch(0.5 0.006 286)" }}
            >
              or continue with email
            </span>
            <div className="h-px flex-1" style={{ background: "oklch(0.35 0.004 286 / 0.5)" }} />
          </div>

          {/* ─── Tabs ─── */}
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-xl p-1" style={{ background: "oklch(0.24 0.004 286)" }}>
              <TabsTrigger
                value="signin"
                className="rounded-lg text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground transition-all"
              >
                Sign in
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="rounded-lg text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground transition-all"
              >
                Create account
              </TabsTrigger>
            </TabsList>

            {/* Sign In form */}
            <TabsContent value="signin" className="mt-5">
              <form onSubmit={onSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "oklch(0.5 0.006 286)" }} />
                    <Input
                      name="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      id="signin-email"
                      className="h-12 rounded-xl border pl-11 text-sm placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/50 transition-all"
                      style={{
                        borderColor: "oklch(0.35 0.004 286 / 0.5)",
                        background: "oklch(0.24 0.004 286)",
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "oklch(0.5 0.006 286)" }} />
                    <Input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      id="signin-password"
                      className="h-12 rounded-xl border pl-11 pr-11 text-sm placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/50 transition-all"
                      style={{
                        borderColor: "oklch(0.35 0.004 286 / 0.5)",
                        background: "oklch(0.24 0.004 286)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md transition-colors hover:bg-secondary"
                      style={{ color: "oklch(0.5 0.006 286)" }}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  id="signin-submit-btn"
                  className="group relative h-12 w-full rounded-xl text-sm font-bold text-primary-foreground transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, oklch(0.68 0.22 305), oklch(0.60 0.24 280))",
                    boxShadow: "0 4px 20px oklch(0.68 0.22 305 / 0.35)",
                  }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Sign in
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Button>
              </form>
            </TabsContent>

            {/* Sign Up form */}
            <TabsContent value="signup" className="mt-5">
              <form onSubmit={onSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Username</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "oklch(0.5 0.006 286)" }} />
                    <Input
                      name="username"
                      required
                      minLength={3}
                      placeholder="your_username"
                      id="signup-username"
                      className="h-12 rounded-xl border pl-11 text-sm placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/50 transition-all"
                      style={{
                        borderColor: "oklch(0.35 0.004 286 / 0.5)",
                        background: "oklch(0.24 0.004 286)",
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "oklch(0.5 0.006 286)" }} />
                    <Input
                      name="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      id="signup-email"
                      className="h-12 rounded-xl border pl-11 text-sm placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/50 transition-all"
                      style={{
                        borderColor: "oklch(0.35 0.004 286 / 0.5)",
                        background: "oklch(0.24 0.004 286)",
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "oklch(0.5 0.006 286)" }} />
                    <Input
                      name="password"
                      type={showSignUpPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="Min. 6 characters"
                      id="signup-password"
                      className="h-12 rounded-xl border pl-11 pr-11 text-sm placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/50 transition-all"
                      style={{
                        borderColor: "oklch(0.35 0.004 286 / 0.5)",
                        background: "oklch(0.24 0.004 286)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md transition-colors hover:bg-secondary"
                      style={{ color: "oklch(0.5 0.006 286)" }}
                      tabIndex={-1}
                    >
                      {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  id="signup-submit-btn"
                  className="group relative h-12 w-full rounded-xl text-sm font-bold text-primary-foreground transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, oklch(0.68 0.22 305), oklch(0.60 0.24 280))",
                    boxShadow: "0 4px 20px oklch(0.68 0.22 305 / 0.35)",
                  }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Create account
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Footer text */}
          <p className="mt-8 text-center text-xs" style={{ color: "oklch(0.45 0.006 286)" }}>
            By continuing, you agree to our{" "}
            <a href="/about" className="underline underline-offset-2 hover:text-foreground transition-colors">
              Terms
            </a>{" "}
            and{" "}
            <a href="/about" className="underline underline-offset-2 hover:text-foreground transition-colors">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
