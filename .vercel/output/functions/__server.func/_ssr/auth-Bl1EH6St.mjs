import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { e as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { s as supabase } from "./client-4GTNZWAa.mjs";
import { u as useAuth, g as SITE_NAME, a as Button, L as Label, I as Input } from "./router-DABr79Tj.mjs";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-BV6Pu7lT.mjs";
import { B as BookOpen } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
import "../_libs/vercel__analytics.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-dropdown-menu.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-menu.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/radix-ui__react-roving-focus.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/react-remove-scroll.mjs";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/radix-ui__react-scroll-area.mjs";
import "../_libs/radix-ui__number.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-select.mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/@radix-ui/react-visually-hidden+[...].mjs";
import "../_libs/radix-ui__react-checkbox.mjs";
import "../_libs/date-fns.mjs";
import "../_libs/radix-ui__react-tabs.mjs";
function GoogleIcon({
  className
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className, viewBox: "0 0 24 24", "aria-hidden": true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { fill: "#4285F4", d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { fill: "#34A853", d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { fill: "#FBBC05", d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { fill: "#EA4335", d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" })
  ] });
}
function AuthPage() {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  reactExports.useEffect(() => {
    if (user) navigate({
      to: "/home"
    });
  }, [user, navigate]);
  reactExports.useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("error=")) {
      const desc = new URLSearchParams(hash.slice(1)).get("error_description");
      if (desc) toast.error(decodeURIComponent(desc.replace(/\+/g, " ")));
    }
  }, []);
  const [loading, setLoading] = reactExports.useState(false);
  const onGoogle = async () => {
    setLoading(true);
    const redirectTo = `${window.location.origin}/home`;
    const {
      error
    } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "consent"
        }
      }
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };
  const onSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const {
      error
    } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")),
      password: String(fd.get("password"))
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Welcome back");
  };
  const onSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const {
      error
    } = await supabase.auth.signUp({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          username: String(fd.get("username") || "")
        }
      }
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Check your email to verify your account");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid min-h-screen place-items-center bg-gradient-to-br from-background via-background to-secondary/30 p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-md rounded-2xl border border-border/50 bg-card p-6 shadow-2xl backdrop-blur", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex flex-col items-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent glow-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-6 w-6 text-primary-foreground" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-3 text-2xl font-bold text-gradient", children: SITE_NAME }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Sign in to bookmark and track your reading." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", onClick: onGoogle, disabled: true, variant: "outline", className: "w-full gap-2 relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(GoogleIcon, { className: "h-5 w-5 opacity-50" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "opacity-50", children: "Continue with Google" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-2 rounded-full bg-violet-600 px-2 py-0.5 text-xs text-white", children: "Coming Soon" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "my-4 flex items-center gap-2 text-xs text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px flex-1 bg-border" }),
      " OR ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px flex-1 bg-border" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "signin", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "grid w-full grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "signin", children: "Sign in" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "signup", children: "Create account" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "signin", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: onSignIn, className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Email" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { name: "email", type: "email", required: true })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Password" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { name: "password", type: "password", required: true, minLength: 6 })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: loading, className: "w-full bg-gradient-to-r from-primary to-accent text-primary-foreground", children: "Sign in" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "signup", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: onSignUp, className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Username" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { name: "username", required: true, minLength: 3 })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Email" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { name: "email", type: "email", required: true })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Password" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { name: "password", type: "password", required: true, minLength: 6 })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: loading, className: "w-full bg-gradient-to-r from-primary to-accent text-primary-foreground", children: "Create account" })
      ] }) })
    ] })
  ] }) });
}
export {
  AuthPage as component
};
