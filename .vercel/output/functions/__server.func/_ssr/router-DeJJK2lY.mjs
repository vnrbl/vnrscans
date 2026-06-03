import { b as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { Q as QueryClientProvider, u as useQueryClient, a as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { c as createRouter, a as createRootRouteWithContext, u as useRouter, L as Link, H as HeadContent, S as Scripts, b as createFileRoute, l as lazyRouteComponent, d as useRouterState, O as Outlet, e as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { S as redirect } from "../_libs/tanstack__router-core.mjs";
import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { S as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { c as cva } from "../_libs/class-variance-authority.mjs";
import { c as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { s as supabase } from "./client-4GTNZWAa.mjs";
import { R as Root2, T as Trigger$1, P as Portal2, C as Content2, L as Label2, S as Separator2, I as Item2, a as SubTrigger2, b as SubContent2, c as CheckboxItem2, d as ItemIndicator2, e as RadioItem2 } from "../_libs/radix-ui__react-dropdown-menu.mjs";
import { R as Root, T as Trigger, P as Portal, C as Content, b as Close, a as Title, O as Overlay, D as Description } from "../_libs/radix-ui__react-dialog.mjs";
import { T as Toaster$1, t as toast } from "../_libs/sonner.mjs";
import { R as Root$1, V as Viewport, C as Corner, S as ScrollAreaScrollbar, a as ScrollAreaThumb } from "../_libs/radix-ui__react-scroll-area.mjs";
import { R as Root$2 } from "../_libs/radix-ui__react-label.mjs";
import { R as Root2$1, V as Value, T as Trigger$2, I as Icon, P as Portal$1, C as Content2$1, a as Viewport$1, b as Item, c as ItemIndicator, d as ItemText, S as ScrollUpButton, e as ScrollDownButton, L as Label$1, f as Separator } from "../_libs/radix-ui__react-select.mjs";
import { C as Checkbox$1, a as CheckboxIndicator } from "../_libs/radix-ui__react-checkbox.mjs";
import { C as Crown, X, H as House, B as BookOpen, T as Trophy, S as Sparkles, a as Shuffle, b as Search, L as Library, U as User, c as ShieldCheck, d as LogOut, M as Menu, e as Bell$1, f as LoaderCircle, g as CheckCheck, h as Check, i as Target, j as MessageSquare, k as Users, l as ChevronDown, m as ChevronUp, n as ChevronRight, o as Circle } from "../_libs/lucide-react.mjs";
import { f as formatDistanceToNow } from "../_libs/date-fns.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "node:stream";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
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
import "../_libs/radix-ui__number.mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/@radix-ui/react-visually-hidden+[...].mjs";
const appCss = "/assets/styles-CRTYogmt.css";
function reportLovableError(error, context = {}) {
  if (typeof window === "undefined") return;
  window.__lovableEvents?.captureException?.(
    error,
    {
      source: "react_error_boundary",
      route: window.location.pathname,
      ...context
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error"
    }
  );
}
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Button = reactExports.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Comp, { className: cn(buttonVariants({ variant, size, className })), ref, ...props });
  }
);
Button.displayName = "Button";
const Input = reactExports.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        type,
        className: cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Input.displayName = "Input";
function useAuth() {
  const [session, setSession] = reactExports.useState(null);
  const [user, setUser] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  reactExports.useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return { session, user, loading };
}
function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = reactExports.useState(false);
  const [isMod, setIsMod] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setIsMod(false);
      return;
    }
    supabase.from("user_roles").select("role").eq("user_id", user.id).then(({ data }) => {
      const roles = (data ?? []).map((r) => r.role);
      setIsAdmin(roles.includes("admin"));
      setIsMod(roles.includes("moderator") || roles.includes("admin"));
    });
  }, [user]);
  return { isAdmin, isMod, user };
}
const DropdownMenu = Root2;
const DropdownMenuTrigger = Trigger$1;
const DropdownMenuSubTrigger = reactExports.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  SubTrigger2,
  {
    ref,
    className: cn(
      "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "ml-auto" })
    ]
  }
));
DropdownMenuSubTrigger.displayName = SubTrigger2.displayName;
const DropdownMenuSubContent = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  SubContent2,
  {
    ref,
    className: cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)",
      className
    ),
    ...props
  }
));
DropdownMenuSubContent.displayName = SubContent2.displayName;
const DropdownMenuContent = reactExports.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(Portal2, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
  Content2,
  {
    ref,
    sideOffset,
    className: cn(
      "z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)",
      className
    ),
    ...props
  }
) }));
DropdownMenuContent.displayName = Content2.displayName;
const DropdownMenuItem = reactExports.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Item2,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
DropdownMenuItem.displayName = Item2.displayName;
const DropdownMenuCheckboxItem = reactExports.forwardRef(({ className, children, checked, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  CheckboxItem2,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    checked,
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ItemIndicator2, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" }) }) }),
      children
    ]
  }
));
DropdownMenuCheckboxItem.displayName = CheckboxItem2.displayName;
const DropdownMenuRadioItem = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  RadioItem2,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ItemIndicator2, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Circle, { className: "h-2 w-2 fill-current" }) }) }),
      children
    ]
  }
));
DropdownMenuRadioItem.displayName = RadioItem2.displayName;
const DropdownMenuLabel = reactExports.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Label2,
  {
    ref,
    className: cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className),
    ...props
  }
));
DropdownMenuLabel.displayName = Label2.displayName;
const DropdownMenuSeparator = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Separator2,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
DropdownMenuSeparator.displayName = Separator2.displayName;
const Dialog = Root;
const DialogTrigger = Trigger;
const DialogPortal = Portal;
const DialogOverlay = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Overlay,
  {
    ref,
    className: cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props
  }
));
DialogOverlay.displayName = Overlay.displayName;
const DialogContent = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogPortal, { children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(DialogOverlay, {}),
  /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Content,
    {
      ref,
      className: cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
DialogContent.displayName = Content.displayName;
const DialogHeader = ({ className, ...props }) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className), ...props });
DialogHeader.displayName = "DialogHeader";
const DialogFooter = ({ className, ...props }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "div",
  {
    className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
    ...props
  }
);
DialogFooter.displayName = "DialogFooter";
const DialogTitle = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Title,
  {
    ref,
    className: cn("text-lg font-semibold leading-none tracking-tight", className),
    ...props
  }
));
DialogTitle.displayName = Title.displayName;
const DialogDescription = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
DialogDescription.displayName = Description.displayName;
const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Badge({ className, variant, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn(badgeVariants({ variant }), className), ...props });
}
const ScrollArea = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  Root$1,
  {
    ref,
    className: cn("relative overflow-hidden", className),
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Viewport, { className: "h-full w-full rounded-[inherit]", children }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollBar, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Corner, {})
    ]
  }
));
ScrollArea.displayName = Root$1.displayName;
const ScrollBar = reactExports.forwardRef(({ className, orientation = "vertical", ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  ScrollAreaScrollbar,
  {
    ref,
    orientation,
    className: cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollAreaThumb, { className: "relative flex-1 rounded-full bg-border" })
  }
));
ScrollBar.displayName = ScrollAreaScrollbar.displayName;
const iconMap = {
  chapter: BookOpen,
  achievement: Trophy,
  follow: Users,
  comment: MessageSquare,
  goal: Target,
  system: Check
};
function NotificationList({ notifications, isLoading, onMarkAllRead, onClose, isMarkingRead = false }) {
  const qc = useQueryClient();
  const markAsRead = useMutation({
    mutationFn: async (notificationId) => {
      const { error } = await supabase.from("user_notifications").update({ is_read: true }).eq("id", notificationId);
      if (error) throw error;
    },
    onMutate: async (notificationId) => {
      await qc.cancelQueries({ queryKey: ["notifications"] });
      const previousNotifications = qc.getQueryData(["notifications"]);
      qc.setQueryData(["notifications"], (old) => {
        if (!old) return old;
        return old.map(
          (n) => n.id === notificationId ? { ...n, is_read: true } : n
        );
      });
      return { previousNotifications };
    },
    onError: (err, notificationId, context) => {
      if (context?.previousNotifications) {
        qc.setQueryData(["notifications"], context.previousNotifications);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    }
  });
  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
    if (notification.link_url) {
      onClose();
    }
  };
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Loading notifications..." }) });
  }
  if (notifications.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-8 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-8 w-8 text-violet-500" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 font-medium", children: "No notifications" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "You're all caught up! We'll notify you when something happens." })
    ] });
  }
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: "Notifications" }),
        unreadCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "h-5 rounded-full px-2 text-xs", children: unreadCount })
      ] }),
      unreadCount > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: onMarkAllRead,
          disabled: isMarkingRead,
          className: "h-8 gap-2 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:text-violet-400 dark:hover:text-violet-300 dark:hover:bg-violet-950/50",
          children: isMarkingRead ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3 w-3 animate-spin" }),
            "Marking..."
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCheck, { className: "h-3 w-3" }),
            "Mark all read"
          ] })
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3 w-3" }),
        "All caught up"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "max-h-96", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y", children: notifications.map((notification) => {
      const Icon2 = iconMap[notification.notification_type] || Check;
      const content = /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: `flex gap-3 p-4 transition-all duration-200 hover:bg-secondary/50 cursor-pointer ${!notification.is_read ? "bg-violet-500/5 border-l-2 border-l-violet-500" : "border-l-2 border-l-transparent"}`,
          onClick: () => handleNotificationClick(notification),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `flex h-10 w-10 items-center justify-center rounded-full transition-colors ${!notification.is_read ? "bg-violet-500/20 ring-2 ring-violet-500/30" : "bg-violet-500/10"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon2, { className: `h-5 w-5 transition-colors ${!notification.is_read ? "text-violet-600" : "text-violet-500"}` }) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-sm ${!notification.is_read ? "font-semibold" : "font-medium"}`, children: notification.title }),
                !notification.is_read && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 w-2 rounded-full bg-violet-500 flex-shrink-0 mt-1 animate-pulse" })
              ] }),
              notification.message && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground line-clamp-2", children: notification.message }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: formatDistanceToNow(new Date(notification.created_at), { addSuffix: true }) })
            ] })
          ]
        }
      );
      return notification.link_url ? /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: notification.link_url, children: content }, notification.id) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: content }, notification.id);
    }) }) })
  ] });
}
function Bell({ className }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "svg",
    {
      className,
      fill: "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24",
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: 2,
          d: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        }
      )
    }
  );
}
function NotificationBell() {
  const qc = useQueryClient();
  const [open, setOpen] = reactExports.useState(false);
  const notifications = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data, error } = await supabase.from("user_notifications").select("*").eq("user_id", u.user.id).order("created_at", { ascending: false }).limit(20);
      if (error) {
        console.error("Error fetching notifications:", error);
        return [];
      }
      return data || [];
    },
    staleTime: 1 * 60 * 1e3,
    // 1 minute
    refetchInterval: 2 * 60 * 1e3
    // Refetch every 2 minutes
  });
  const markAllRead = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { error } = await supabase.from("user_notifications").update({ is_read: true }).eq("user_id", u.user.id).eq("is_read", false);
      if (error) throw error;
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["notifications"] });
      const previousNotifications = qc.getQueryData(["notifications"]);
      qc.setQueryData(["notifications"], (old) => {
        if (!old) return old;
        return old.map((n) => ({ ...n, is_read: true }));
      });
      return { previousNotifications };
    },
    onError: (err, variables, context) => {
      if (context?.previousNotifications) {
        qc.setQueryData(["notifications"], context.previousNotifications);
      }
      toast.error("Failed to mark notifications as read");
    },
    onSuccess: () => {
      toast.success("All notifications marked as read");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    }
  });
  const unreadCount = notifications.data?.filter((n) => !n.is_read).length || 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenu, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "icon", className: "relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Bell$1, { className: "h-5 w-5" }),
      unreadCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
        Badge,
        {
          variant: "destructive",
          className: "absolute -right-1 -top-1 h-5 min-w-5 rounded-full p-0 text-xs flex items-center justify-center",
          children: unreadCount > 9 ? "9+" : unreadCount
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuContent, { align: "end", className: "w-80 p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      NotificationList,
      {
        notifications: notifications.data || [],
        isLoading: notifications.isLoading,
        onMarkAllRead: () => markAllRead.mutate(),
        onClose: () => setOpen(false),
        isMarkingRead: markAllRead.isPending
      }
    ) })
  ] });
}
function Navbar() {
  const [open, setOpen] = reactExports.useState(false);
  const [searchOpen, setSearchOpen] = reactExports.useState(false);
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [searchResults, setSearchResults] = reactExports.useState([]);
  const [searching, setSearching] = reactExports.useState(false);
  const [isRolling, setIsRolling] = reactExports.useState(false);
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  useRouter();
  const links = [
    { to: "/home", label: "Home", icon: House },
    { to: "/browse", label: "Browse", icon: BookOpen },
    { to: "/rankings", label: "Rankings", icon: Trophy },
    { to: "/recommendations", label: "For You", icon: Sparkles }
  ];
  const userStats = useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from("profiles").select("user_level,reading_streak,is_vip,experience_points").eq("id", user.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 1e3 * 60 * 5
  });
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };
  const handleRandom = async () => {
    setIsRolling(true);
    const { data, error } = await supabase.from("series").select("slug").order("id").limit(1e3);
    setTimeout(() => {
      setIsRolling(false);
      if (!error && data && data.length > 0) {
        const randomSeries = data[Math.floor(Math.random() * data.length)];
        navigate({ to: "/title/$slug", params: { slug: randomSeries.slug } });
      }
    }, 1e3);
  };
  reactExports.useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setSearching(true);
        try {
          const { data, error } = await supabase.from("series").select("id,slug,title,cover_url,type,rating_average").or(`title.ilike.%${searchQuery}%,alternative_titles.ilike.%${searchQuery}%`).limit(8);
          if (!error && data) {
            setSearchResults(data);
          }
        } catch (err) {
          console.error("Search error:", err);
        } finally {
          setSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  reactExports.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  const handleSearchSelect = (slug) => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    navigate({ to: "/title/$slug", params: { slug } });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto flex h-16 items-center justify-between gap-4 px-8 md:px-12 lg:px-16", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/home", className: "flex shrink-0 items-center gap-2 transition-transform hover:scale-105", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative grid h-10 w-10 place-items-center rounded-lg bg-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-bold text-primary-foreground", children: "0V" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden text-xl font-bold tracking-tight text-primary sm:inline", children: "0Verse" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "hidden items-center gap-1 md:flex", children: links.map((l) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Link,
        {
          to: l.to,
          className: "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground",
          activeProps: { className: "text-foreground bg-secondary" },
          activeOptions: { exact: l.to === "/" },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(l.icon, { className: "h-4 w-4" }),
            l.label
          ]
        },
        l.to
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            onClick: handleRandom,
            disabled: isRolling,
            className: "hidden sm:flex",
            title: "Random Series",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Shuffle, { className: `h-5 w-5 transition-transform ${isRolling ? "animate-spin" : ""}` })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: searchOpen, onOpenChange: setSearchOpen, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "hidden sm:flex", title: "Search (Ctrl+K)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-5 w-5" }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-[600px]", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Search Series" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    placeholder: "Search by title...",
                    value: searchQuery,
                    onChange: (e) => setSearchQuery(e.target.value),
                    className: "pl-9",
                    autoFocus: true
                  }
                )
              ] }),
              searching && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "py-8 text-center text-sm text-muted-foreground", children: "Searching..." }),
              !searching && searchResults.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-[400px] space-y-2 overflow-y-auto", children: searchResults.map((series) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => handleSearchSelect(series.slug),
                  className: "flex w-full items-center gap-3 rounded-lg border border-border/40 bg-card p-3 text-left transition-colors hover:border-primary/50 hover:bg-secondary",
                  children: [
                    series.cover_url ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "img",
                      {
                        src: series.cover_url,
                        alt: series.title,
                        className: "h-16 w-12 rounded object-cover"
                      }
                    ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-16 w-12 items-center justify-center rounded bg-secondary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-6 w-6 text-muted-foreground" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "truncate font-semibold", children: series.title }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "uppercase", children: series.type }),
                        series.rating_average && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "•" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                            "★ ",
                            Number(series.rating_average).toFixed(1)
                          ] })
                        ] })
                      ] })
                    ] })
                  ]
                },
                series.id
              )) }),
              !searching && searchQuery.length >= 2 && searchResults.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "py-8 text-center text-sm text-muted-foreground", children: [
                'No results found for "',
                searchQuery,
                '"'
              ] })
            ] })
          ] })
        ] }),
        user ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "ghost",
              size: "icon",
              onClick: () => navigate({ to: "/library" }),
              className: "hidden md:flex",
              title: "My Library",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Library, { className: "h-5 w-5" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(NotificationBell, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenu, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "rounded-full transition-all hover:bg-primary/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-5 w-5" }) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuContent, { align: "end", className: "w-64", children: [
              userStats.data && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuLabel, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-4 w-4" }),
                    "Level ",
                    userStats.data.user_level,
                    userStats.data.is_vip && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-gradient-to-r from-yellow-500 to-orange-500", children: "VIP" })
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 text-xs font-normal text-muted-foreground", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                      "🔥 Streak: ",
                      userStats.data.reading_streak,
                      " days"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        className: "h-full bg-gradient-to-r from-violet-600 to-purple-600",
                        style: {
                          width: `${userStats.data.experience_points % 100 / 100 * 100}%`
                        }
                      }
                    ) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-xs", children: [
                      userStats.data.experience_points % 100,
                      "/100 XP to Level ",
                      userStats.data.user_level + 1
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuSeparator, {})
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => navigate({ to: "/profile" }), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "mr-2 h-4 w-4" }),
                " Profile"
              ] }),
              isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuSeparator, {}),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => navigate({ to: "/admin" }), className: "text-primary", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "mr-2 h-4 w-4" }),
                  " Admin Panel"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuSeparator, {}),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: signOut, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "mr-2 h-4 w-4" }),
                " Sign out"
              ] })
            ] })
          ] })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", children: "Sign In" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "md:hidden", onClick: () => setOpen((o) => !o), "aria-label": "Menu", children: open ? /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Menu, { className: "h-5 w-5" }) })
      ] })
    ] }),
    open && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-border/50 md:hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "container mx-auto flex flex-col px-4 py-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => {
            setSearchOpen(true);
            setOpen(false);
          },
          className: "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-4 w-4" }),
            "Search"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => {
            handleRandom();
            setOpen(false);
          },
          disabled: isRolling,
          className: "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Shuffle, { className: `h-4 w-4 transition-transform ${isRolling ? "animate-spin" : ""}` }),
            "Random Series"
          ]
        }
      ),
      links.map((l) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Link,
        {
          to: l.to,
          onClick: () => setOpen(false),
          className: "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(l.icon, { className: "h-4 w-4" }),
            l.label
          ]
        },
        l.to
      ))
    ] }) })
  ] });
}
function AnnouncementBanner() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("is_vip, created_at").eq("id", user.id).single();
      if (error) throw error;
      return data;
    }
  });
  const announcements = useQuery({
    queryKey: ["announcements", "active", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("announcements").select("*").eq("is_active", true).eq("show_banner", true).order("priority", { ascending: false }).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    }
  });
  const readIds = useQuery({
    queryKey: ["announcements", "read", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_announcements").select("announcement_id").eq("user_id", user.id);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.announcement_id));
    }
  });
  const dismiss = useMutation({
    mutationFn: async (announcementId) => {
      if (user) {
        await supabase.from("user_announcements").upsert(
          { user_id: user.id, announcement_id: announcementId },
          { onConflict: "user_id,announcement_id" }
        );
      }
      sessionStorage.setItem(`announcement_dismissed_${announcementId}`, "1");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] })
  });
  if (!announcements.data?.length) return null;
  const visible = announcements.data.filter((a) => {
    if (sessionStorage.getItem(`announcement_dismissed_${a.id}`)) return false;
    if (user && readIds.data?.has(a.id)) return false;
    if (a.target_audience === "vip" && !profile.data?.is_vip) return false;
    if (a.target_audience === "new_users") {
      const created = profile.data?.created_at ? new Date(profile.data.created_at) : null;
      if (!created || Date.now() - created.getTime() > 7 * 24 * 60 * 60 * 1e3) return false;
    }
    return true;
  });
  const top = visible[0];
  if (!top) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative overflow-hidden border-b border-border/50 bg-gradient-to-r from-gray-900 via-purple-900/20 to-gray-900", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] opacity-20" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container relative mx-auto px-6 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 min-w-0 flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-600/20 ring-1 ring-violet-600/40", children: top.icon ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl", children: top.icon }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: "h-5 w-5 text-violet-400" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-bold text-white", children: top.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 truncate text-xs text-gray-300", children: top.content })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden shrink-0 items-center gap-2 md:flex", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg bg-orange-600/20 px-4 py-1.5 ring-1 ring-orange-500/40", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl font-bold text-orange-400", children: "$2.99" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-orange-300", children: "/month" })
      ] }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex shrink-0 items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            size: "sm",
            className: "bg-violet-600 font-semibold text-white hover:bg-violet-700",
            children: "Subscribe Now"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            className: "h-8 w-8 shrink-0 text-gray-400 hover:bg-white/10 hover:text-white",
            onClick: () => dismiss.mutate(top.id),
            "aria-label": "Dismiss announcement",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" })
          }
        )
      ] })
    ] }) })
  ] });
}
function Footer() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { className: "border-t border-border/50 bg-secondary/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container mx-auto px-8 md:px-12 lg:px-16 py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center gap-4 text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/home", className: "flex items-center gap-2 transition-transform hover:scale-105", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative grid h-10 w-10 place-items-center rounded-lg bg-violet-600", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-bold text-white", children: "0V" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xl font-bold text-violet-600", children: "0Verse" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "max-w-md text-sm text-muted-foreground", children: [
      "© ",
      (/* @__PURE__ */ new Date()).getFullYear(),
      " 0Verse does not store any files on its servers, it only links to media which is hosted on 3rd party services."
    ] })
  ] }) }) });
}
const Toaster = ({ ...props }) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Toaster$1,
    {
      className: "toaster group",
      toastOptions: {
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
        }
      },
      ...props
    }
  );
};
function isReaderLayoutPath(pathname) {
  if (pathname.startsWith("/read/")) return true;
  return /^\/title\/[^/]+\/[^/]+$/.test(pathname);
}
const ThemeContext = reactExports.createContext(void 0);
function ThemeProvider({ children }) {
  const [theme, setThemeState] = reactExports.useState("dark");
  const [actualTheme, setActualTheme] = reactExports.useState("dark");
  const [mounted, setMounted] = reactExports.useState(false);
  reactExports.useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme");
    if (stored) {
      setThemeState(stored);
    }
  }, []);
  reactExports.useEffect(() => {
    if (!mounted) return;
    const root = window.document.documentElement;
    const applyTheme = (selectedTheme) => {
      let resolvedTheme;
      if (selectedTheme === "system") {
        resolvedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      } else {
        resolvedTheme = selectedTheme;
      }
      root.classList.remove("light", "dark");
      root.classList.add(resolvedTheme);
      setActualTheme(resolvedTheme);
    };
    applyTheme(theme);
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, mounted]);
  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    if (mounted) {
      localStorage.setItem("theme", newTheme);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ThemeContext.Provider, { value: { theme, setTheme, actualTheme }, children });
}
const defaultSettings = {
  readingDirection: "ltr",
  pageFit: "width",
  readingMode: "page",
  imageQuality: "high",
  autoScrollSpeed: 50
};
const ReaderSettingsContext = reactExports.createContext(void 0);
function ReaderSettingsProvider({ children }) {
  const [settings, setSettings] = reactExports.useState(defaultSettings);
  const [mounted, setMounted] = reactExports.useState(false);
  reactExports.useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("readerSettings");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (e) {
        console.error("Failed to parse reader settings:", e);
      }
    }
  }, []);
  const updateSettings = (newSettings) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (mounted) {
        localStorage.setItem("readerSettings", JSON.stringify(updated));
      }
      return updated;
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ReaderSettingsContext.Provider, { value: { settings, updateSettings }, children });
}
function useReaderSettings() {
  const context = reactExports.useContext(ReaderSettingsContext);
  if (context === void 0) {
    throw new Error("useReaderSettings must be used within a ReaderSettingsProvider");
  }
  return context;
}
function NotFoundComponent() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-7xl font-bold text-foreground", children: "404" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 text-xl font-semibold text-foreground", children: "Page not found" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "The page you're looking for doesn't exist or has been moved." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
        children: "Go home"
      }
    ) })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router2 = useRouter();
  reactExports.useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold tracking-tight text-foreground", children: "This page didn't load" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Something went wrong on our end. You can try refreshing or head back home." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "a",
        {
          href: "/",
          className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
          children: "Go home"
        }
      )
    ] })
  ] }) });
}
const Route$w = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "0Verse — Read Manga, Manhwa, Manhua & Novels" },
      { name: "description", content: "Discover manhwa stories drawn by imagination. Fast, free, and ad-free reading experience." },
      { property: "og:title", content: "0Verse" },
      { property: "og:description", content: "Read manga, manhwa, manhua, and novels on 0Verse." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" }
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg"
      }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("html", { lang: "en", className: "dark", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("head", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$w.useRouteContext();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ThemeProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(ReaderSettingsProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, {}) }) }) });
}
function AppShell() {
  const router2 = useRouter();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const bare = isReaderLayoutPath(pathname) || pathname === "/auth";
  reactExports.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      router2.invalidate();
      queryClient.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router2, queryClient]);
  if (bare) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Toaster, {})
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AnnouncementBanner, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Navbar, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Footer, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Toaster, {})
  ] });
}
const $$splitComponentImporter$v = () => import("./tags-Wj6zwwpH.mjs");
const Route$v = createFileRoute("/tags")({
  head: () => ({
    meta: [{
      title: "Browse Tags — 0Verse"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$v, "component")
});
const $$splitComponentImporter$u = () => import("./search--KSQgTGZ.mjs");
const Route$u = createFileRoute("/search")({
  validateSearch: (s) => ({
    q: s.q || ""
  }),
  head: () => ({
    meta: [{
      title: "Search — 0Verse"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$u, "component")
});
const $$splitComponentImporter$t = () => import("./recommendations-BVvcF-th.mjs");
const Route$t = createFileRoute("/recommendations")({
  head: () => ({
    meta: [{
      title: "Recommendations — 0Verse"
    }, {
      name: "description",
      content: "Personalized series recommendations based on your reading history"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$t, "component")
});
const $$splitComponentImporter$s = () => import("./rankings-DZXSOt5C.mjs");
const Route$s = createFileRoute("/rankings")({
  head: () => ({
    meta: [{
      title: "Rankings — 0Verse"
    }, {
      name: "description",
      content: "Top ranked manga, manhwa, and manhua series"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$s, "component")
});
const $$splitComponentImporter$r = () => import("./home-tJVDoaIF.mjs");
const Route$r = createFileRoute("/home")({
  head: () => ({
    meta: [{
      title: "Home — 0Verse"
    }, {
      name: "description",
      content: "Discover and read the latest manhwa series with 0Verse."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$r, "component")
});
const $$splitComponentImporter$q = () => import("./dmca-CUHSjXix.mjs");
const Route$q = createFileRoute("/dmca")({
  head: () => ({
    meta: [{
      title: "DMCA / Copyright — 0Verse"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$q, "component")
});
const $$splitComponentImporter$p = () => import("./contact-CjgHMNLJ.mjs");
const Route$p = createFileRoute("/contact")({
  head: () => ({
    meta: [{
      title: "Contact — 0Verse"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$p, "component")
});
const $$splitComponentImporter$o = () => import("./browse-B1bd-CRC.mjs");
const Route$o = createFileRoute("/browse")({
  head: () => ({
    meta: [{
      title: "Browse Manga — 0Verse"
    }, {
      name: "description",
      content: "Discover your next favorite series"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$o, "component")
});
const SITE_NAME = "0Verse";
function pageTitle(suffix) {
  return `${suffix} — ${SITE_NAME}`;
}
const $$splitComponentImporter$n = () => import("./auth-pp4fdmyz.mjs");
const Route$n = createFileRoute("/auth")({
  head: () => ({
    meta: [{
      title: pageTitle("Sign in")
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$n, "component")
});
const $$splitComponentImporter$m = () => import("./about-DdO1eqMY.mjs");
const Route$m = createFileRoute("/about")({
  head: () => ({
    meta: [{
      title: "About — 0Verse"
    }, {
      name: "description",
      content: "About 0Verse — a legal reader for manga, manhwa, manhua, and novels."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$m, "component")
});
const $$splitComponentImporter$l = () => import("../_authenticated-BFsOu0JM.mjs");
const Route$l = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({
      to: "/auth"
    });
    return {
      user: data.user
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$l, "component")
});
const $$splitComponentImporter$k = () => import("./index-VqRiJeKi.mjs");
const Route$k = createFileRoute("/")({
  head: () => ({
    meta: [{
      title: "0Verse — Discover Manhwa Stories"
    }, {
      name: "description",
      content: "Follow your favorite manhwa series, track new chapters, and dive into worlds created by talented artists."
    }, {
      property: "og:title",
      content: "0Verse"
    }, {
      property: "og:description",
      content: "Discover manhwa stories drawn by imagination."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$k, "component")
});
const $$splitErrorComponentImporter$1 = () => import("./title._slug-BQgL6_fv.mjs");
const $$splitNotFoundComponentImporter = () => import("./title._slug-Dj96j18S.mjs");
const $$splitComponentImporter$j = () => import("./title._slug-hJvq709b.mjs");
const Route$j = createFileRoute("/title/$slug")({
  head: ({
    params
  }) => ({
    meta: [{
      title: `${params.slug} — 0Verse`
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$j, "component"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter, "notFoundComponent"),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter$1, "errorComponent")
});
const $$splitComponentImporter$i = () => import("./tags._slug-BWfzgmFj.mjs");
const Route$i = createFileRoute("/tags/$slug")({
  head: ({
    params
  }) => ({
    meta: [{
      title: `${params.slug} — Browse Tags — 0Verse`
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$i, "component")
});
const $$splitComponentImporter$h = () => import("./settings-DDWupfWX.mjs");
const Route$h = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [{
      title: "Settings — 0Verse"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$h, "component")
});
const $$splitComponentImporter$g = () => import("./profile-dBo2kGlR.mjs");
const Route$g = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [{
      title: "Profile — 0Verse"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$g, "component")
});
const $$splitComponentImporter$f = () => import("./library-2gDevFiZ.mjs");
const Route$f = createFileRoute("/_authenticated/library")({
  head: () => ({
    meta: [{
      title: "My Library — 0Verse"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$f, "component")
});
const $$splitComponentImporter$e = () => import("./admin-D4zcbzud.mjs");
const Route$e = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const {
      data: u
    } = await supabase.auth.getUser();
    if (!u.user) throw redirect({
      to: "/auth"
    });
    const {
      data: roles
    } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
    const ok = (roles ?? []).some((r) => r.role === "admin" || r.role === "moderator");
    if (!ok) throw redirect({
      to: "/"
    });
  },
  component: lazyRouteComponent($$splitComponentImporter$e, "component")
});
const $$splitComponentImporter$d = () => import("./index-Dn_7N7fY.mjs");
const Route$d = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [{
      title: "Admin — 0Verse"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$d, "component")
});
const $$splitErrorComponentImporter = () => import("./title._titleSlug._chapterSlug-BLYts7tn.mjs");
const $$splitComponentImporter$c = () => import("./title._titleSlug._chapterSlug-CbTw5hMV.mjs");
const Route$c = createFileRoute("/title/$titleSlug/$chapterSlug")({
  head: ({
    params
  }) => ({
    meta: [{
      title: `Read ${params.chapterSlug} — 0Verse`
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$c, "component"),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter, "errorComponent")
});
const $$splitComponentImporter$b = () => import("./users-C0MRlUhz.mjs");
const Route$b = createFileRoute("/_authenticated/admin/users")({
  head: () => ({
    meta: [{
      title: "Admin · Users"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
const $$splitComponentImporter$a = () => import("./tags-Dcz4RGuG.mjs");
const Route$a = createFileRoute("/_authenticated/admin/tags")({
  head: () => ({
    meta: [{
      title: "Admin · Genres"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./series-kEkaS3bP.mjs");
const Route$9 = createFileRoute("/_authenticated/admin/series")({
  head: () => ({
    meta: [{
      title: "Admin · Titles"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./reports-DFhtl-Od.mjs");
const Route$8 = createFileRoute("/_authenticated/admin/reports")({
  head: () => ({
    meta: [{
      title: "Admin · Reports"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);
const Label = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(Root$2, { ref, className: cn(labelVariants(), className), ...props }));
Label.displayName = Root$2.displayName;
const Select = Root2$1;
const SelectValue = Value;
const SelectTrigger = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  Trigger$2,
  {
    ref,
    className: cn(
      "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background cursor-pointer data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4 opacity-50" }) })
    ]
  }
));
SelectTrigger.displayName = Trigger$2.displayName;
const SelectScrollUpButton = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  ScrollUpButton,
  {
    ref,
    className: cn("flex cursor-default items-center justify-center py-1", className),
    ...props,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "h-4 w-4" })
  }
));
SelectScrollUpButton.displayName = ScrollUpButton.displayName;
const SelectScrollDownButton = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  ScrollDownButton,
  {
    ref,
    className: cn("flex cursor-default items-center justify-center py-1", className),
    ...props,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4" })
  }
));
SelectScrollDownButton.displayName = ScrollDownButton.displayName;
const SelectContent = reactExports.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(Portal$1, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
  Content2$1,
  {
    ref,
    className: cn(
      "relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-select-content-transform-origin)",
      position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
      className
    ),
    position,
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectScrollUpButton, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Viewport$1,
        {
          className: cn(
            "p-1",
            position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          ),
          children
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectScrollDownButton, {})
    ]
  }
) }));
SelectContent.displayName = Content2$1.displayName;
const SelectLabel = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Label$1,
  {
    ref,
    className: cn("px-2 py-1.5 text-sm font-semibold", className),
    ...props
  }
));
SelectLabel.displayName = Label$1.displayName;
const SelectItem = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  Item,
  {
    ref,
    className: cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ItemIndicator, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ItemText, { children })
    ]
  }
));
SelectItem.displayName = Item.displayName;
const SelectSeparator = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Separator,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
SelectSeparator.displayName = Separator.displayName;
const Checkbox = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Checkbox$1,
  {
    ref,
    className: cn(
      "grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckboxIndicator, { className: cn("grid place-content-center text-current"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" }) })
  }
));
Checkbox.displayName = Checkbox$1.displayName;
const $$splitComponentImporter$7 = () => import("./permissions-BESF84Yo.mjs");
const Route$7 = createFileRoute("/_authenticated/admin/permissions")({
  head: () => ({
    meta: [{
      title: "Admin · Permissions"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./moderation-D5VmqMHB.mjs");
const Route$6 = createFileRoute("/_authenticated/admin/moderation")({
  head: () => ({
    meta: [{
      title: "Admin · Moderation Queue"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./logs-wnFqfq7W.mjs");
const Route$5 = createFileRoute("/_authenticated/admin/logs")({
  head: () => ({
    meta: [{
      title: "Admin · Security Logs"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./gamification-CCwuFOWT.mjs");
const Route$4 = createFileRoute("/_authenticated/admin/gamification")({
  head: () => ({
    meta: [{
      title: "Admin · Gamification"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./comments-CiNR8oN8.mjs");
const Route$3 = createFileRoute("/_authenticated/admin/comments")({
  head: () => ({
    meta: [{
      title: "Admin · Comments"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const Textarea = reactExports.forwardRef(
  ({ className, ...props }, ref) => {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "textarea",
      {
        className: cn(
          "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Textarea.displayName = "Textarea";
const $$splitComponentImporter$2 = () => import("./banners-UGj4iNYY.mjs");
const Route$2 = createFileRoute("/_authenticated/admin/banners")({
  head: () => ({
    meta: [{
      title: "Admin · Banners"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./announcements-BZHNZvha.mjs");
const Route$1 = createFileRoute("/_authenticated/admin/announcements")({
  head: () => ({
    meta: [{
      title: "Admin · Announcements"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./analytics-Dn336E4b.mjs");
const Route = createFileRoute("/_authenticated/admin/analytics")({
  head: () => ({
    meta: [{
      title: "Admin · Analytics"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const TagsRoute = Route$v.update({
  id: "/tags",
  path: "/tags",
  getParentRoute: () => Route$w
});
const SearchRoute = Route$u.update({
  id: "/search",
  path: "/search",
  getParentRoute: () => Route$w
});
const RecommendationsRoute = Route$t.update({
  id: "/recommendations",
  path: "/recommendations",
  getParentRoute: () => Route$w
});
const RankingsRoute = Route$s.update({
  id: "/rankings",
  path: "/rankings",
  getParentRoute: () => Route$w
});
const HomeRoute = Route$r.update({
  id: "/home",
  path: "/home",
  getParentRoute: () => Route$w
});
const DmcaRoute = Route$q.update({
  id: "/dmca",
  path: "/dmca",
  getParentRoute: () => Route$w
});
const ContactRoute = Route$p.update({
  id: "/contact",
  path: "/contact",
  getParentRoute: () => Route$w
});
const BrowseRoute = Route$o.update({
  id: "/browse",
  path: "/browse",
  getParentRoute: () => Route$w
});
const AuthRoute = Route$n.update({
  id: "/auth",
  path: "/auth",
  getParentRoute: () => Route$w
});
const AboutRoute = Route$m.update({
  id: "/about",
  path: "/about",
  getParentRoute: () => Route$w
});
const AuthenticatedRoute = Route$l.update({
  id: "/_authenticated",
  getParentRoute: () => Route$w
});
const IndexRoute = Route$k.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$w
});
const TitleSlugRoute = Route$j.update({
  id: "/title/$slug",
  path: "/title/$slug",
  getParentRoute: () => Route$w
});
const TagsSlugRoute = Route$i.update({
  id: "/$slug",
  path: "/$slug",
  getParentRoute: () => TagsRoute
});
const AuthenticatedSettingsRoute = Route$h.update({
  id: "/settings",
  path: "/settings",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedProfileRoute = Route$g.update({
  id: "/profile",
  path: "/profile",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedLibraryRoute = Route$f.update({
  id: "/library",
  path: "/library",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedAdminRoute = Route$e.update({
  id: "/admin",
  path: "/admin",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedAdminIndexRoute = Route$d.update({
  id: "/",
  path: "/",
  getParentRoute: () => AuthenticatedAdminRoute
});
const TitleTitleSlugChapterSlugRoute = Route$c.update({
  id: "/title/$titleSlug/$chapterSlug",
  path: "/title/$titleSlug/$chapterSlug",
  getParentRoute: () => Route$w
});
const AuthenticatedAdminUsersRoute = Route$b.update({
  id: "/users",
  path: "/users",
  getParentRoute: () => AuthenticatedAdminRoute
});
const AuthenticatedAdminTagsRoute = Route$a.update({
  id: "/tags",
  path: "/tags",
  getParentRoute: () => AuthenticatedAdminRoute
});
const AuthenticatedAdminSeriesRoute = Route$9.update({
  id: "/series",
  path: "/series",
  getParentRoute: () => AuthenticatedAdminRoute
});
const AuthenticatedAdminReportsRoute = Route$8.update({
  id: "/reports",
  path: "/reports",
  getParentRoute: () => AuthenticatedAdminRoute
});
const AuthenticatedAdminPermissionsRoute = Route$7.update({
  id: "/permissions",
  path: "/permissions",
  getParentRoute: () => AuthenticatedAdminRoute
});
const AuthenticatedAdminModerationRoute = Route$6.update({
  id: "/moderation",
  path: "/moderation",
  getParentRoute: () => AuthenticatedAdminRoute
});
const AuthenticatedAdminLogsRoute = Route$5.update({
  id: "/logs",
  path: "/logs",
  getParentRoute: () => AuthenticatedAdminRoute
});
const AuthenticatedAdminGamificationRoute = Route$4.update({
  id: "/gamification",
  path: "/gamification",
  getParentRoute: () => AuthenticatedAdminRoute
});
const AuthenticatedAdminCommentsRoute = Route$3.update({
  id: "/comments",
  path: "/comments",
  getParentRoute: () => AuthenticatedAdminRoute
});
const AuthenticatedAdminBannersRoute = Route$2.update({
  id: "/banners",
  path: "/banners",
  getParentRoute: () => AuthenticatedAdminRoute
});
const AuthenticatedAdminAnnouncementsRoute = Route$1.update({
  id: "/announcements",
  path: "/announcements",
  getParentRoute: () => AuthenticatedAdminRoute
});
const AuthenticatedAdminAnalyticsRoute = Route.update({
  id: "/analytics",
  path: "/analytics",
  getParentRoute: () => AuthenticatedAdminRoute
});
const AuthenticatedAdminRouteChildren = {
  AuthenticatedAdminAnalyticsRoute,
  AuthenticatedAdminAnnouncementsRoute,
  AuthenticatedAdminBannersRoute,
  AuthenticatedAdminCommentsRoute,
  AuthenticatedAdminGamificationRoute,
  AuthenticatedAdminLogsRoute,
  AuthenticatedAdminModerationRoute,
  AuthenticatedAdminPermissionsRoute,
  AuthenticatedAdminReportsRoute,
  AuthenticatedAdminSeriesRoute,
  AuthenticatedAdminTagsRoute,
  AuthenticatedAdminUsersRoute,
  AuthenticatedAdminIndexRoute
};
const AuthenticatedAdminRouteWithChildren = AuthenticatedAdminRoute._addFileChildren(AuthenticatedAdminRouteChildren);
const AuthenticatedRouteChildren = {
  AuthenticatedAdminRoute: AuthenticatedAdminRouteWithChildren,
  AuthenticatedLibraryRoute,
  AuthenticatedProfileRoute,
  AuthenticatedSettingsRoute
};
const AuthenticatedRouteWithChildren = AuthenticatedRoute._addFileChildren(
  AuthenticatedRouteChildren
);
const TagsRouteChildren = {
  TagsSlugRoute
};
const TagsRouteWithChildren = TagsRoute._addFileChildren(TagsRouteChildren);
const rootRouteChildren = {
  IndexRoute,
  AuthenticatedRoute: AuthenticatedRouteWithChildren,
  AboutRoute,
  AuthRoute,
  BrowseRoute,
  ContactRoute,
  DmcaRoute,
  HomeRoute,
  RankingsRoute,
  RecommendationsRoute,
  SearchRoute,
  TagsRoute: TagsRouteWithChildren,
  TitleSlugRoute,
  TitleTitleSlugChapterSlugRoute
};
const routeTree = Route$w._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  Badge as B,
  Checkbox as C,
  Dialog as D,
  Input as I,
  Label as L,
  Route$u as R,
  Select as S,
  Textarea as T,
  Button as a,
  SelectTrigger as b,
  cn as c,
  SelectValue as d,
  SelectContent as e,
  SelectItem as f,
  SITE_NAME as g,
  Route$j as h,
  Route$i as i,
  useReaderSettings as j,
  DialogTrigger as k,
  DialogContent as l,
  DialogHeader as m,
  DialogTitle as n,
  Route$c as o,
  DialogFooter as p,
  buttonVariants as q,
  router as r,
  useAuth as u
};
