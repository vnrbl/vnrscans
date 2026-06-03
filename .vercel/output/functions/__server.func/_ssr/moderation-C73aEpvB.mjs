import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useQueryClient, a as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { s as supabase } from "./client-4GTNZWAa.mjs";
import { l as logAdminAction } from "./adminLog-FkQiQmmY.mjs";
import { B as Badge, a as Button, D as Dialog, l as DialogContent, m as DialogHeader, n as DialogTitle, L as Label, S as Select, b as SelectTrigger, d as SelectValue, e as SelectContent, f as SelectItem, T as Textarea, p as DialogFooter } from "./router-DABr79Tj.mjs";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-BV6Pu7lT.mjs";
import { a3 as Flag, ai as CircleCheck, aj as CircleX, ak as TriangleAlert, ah as ExternalLink } from "../_libs/lucide-react.mjs";
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
import "../_libs/tanstack__query-core.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
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
function AdminModeration() {
  const qc = useQueryClient();
  const [reviewDialog, setReviewDialog] = reactExports.useState(null);
  const [reviewNotes, setReviewNotes] = reactExports.useState("");
  const [actionTaken, setActionTaken] = reactExports.useState("none");
  const [statusFilter, setStatusFilter] = reactExports.useState("pending");
  const queue = useQuery({
    queryKey: ["admin", "moderation", statusFilter],
    queryFn: async () => {
      let query = supabase.from("moderation_queue").select("*").order("priority", {
        ascending: false
      }).order("created_at", {
        ascending: false
      });
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      const {
        data,
        error
      } = await query;
      if (error) throw error;
      return data || [];
    }
  });
  const reviewItem = useMutation({
    mutationFn: async ({
      id,
      status,
      item
    }) => {
      const {
        data: user
      } = await supabase.auth.getUser();
      await applyModerationAction(item, actionTaken);
      const {
        error
      } = await supabase.from("moderation_queue").update({
        status,
        reviewed_by: user.user?.id,
        reviewed_at: (/* @__PURE__ */ new Date()).toISOString(),
        review_notes: reviewNotes || null,
        action_taken: actionTaken,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", id);
      if (error) throw error;
      if (item.source_report_id) {
        await supabase.from("reports").update({
          status: status === "approved" ? "dismissed" : "resolved"
        }).eq("id", item.source_report_id);
      }
      await logAdminAction(`moderation_${status}`, "moderation", id, {
        content_type: item.content_type,
        action_taken: actionTaken
      });
    },
    onSuccess: () => {
      toast.success("Item reviewed");
      setReviewDialog(null);
      setReviewNotes("");
      setActionTaken("none");
      qc.invalidateQueries({
        queryKey: ["admin", "moderation"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const priorityColors = {
    urgent: "destructive",
    high: "default",
    normal: "secondary",
    low: "outline"
  };
  const statusColors = {
    pending: "default",
    approved: "secondary",
    rejected: "destructive",
    escalated: "outline"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Moderation Queue" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Review flagged content and reports" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { value: statusFilter, onValueChange: setStatusFilter, className: "mt-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "pending", children: "Pending" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "approved", children: "Approved" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "rejected", children: "Rejected" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "escalated", children: "Escalated" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "all", children: "All" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: statusFilter, className: "mt-4", children: [
        queue.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Loading..." }),
        queue.data && queue.data.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border/40 bg-card p-8 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Flag, { className: "mx-auto h-12 w-12 text-muted-foreground opacity-50" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "No items in queue" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: (queue.data || []).map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-border/40 bg-card p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: priorityColors[item.priority], children: item.priority }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: item.content_type }),
              item.auto_flagged && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "secondary", children: [
                "🤖 Auto (",
                Math.round(item.flag_score * 100),
                "%)"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: statusColors[item.status], children: item.status })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "mt-2 font-semibold", children: [
              "Reason: ",
              item.reason
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "ID: ",
                item.content_id.slice(0, 8)
              ] }),
              item.reported_by && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "Reported by: user ",
                item.reported_by.slice(0, 8),
                "…"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "Created: ",
                new Date(item.created_at).toLocaleString()
              ] }),
              item.reviewed_at && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  "Reviewed: ",
                  new Date(item.reviewed_at).toLocaleString()
                ] }),
                item.reviewed_by && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  "By: user ",
                  item.reviewed_by.slice(0, 8),
                  "…"
                ] })
              ] })
            ] }),
            item.review_notes && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 rounded-md bg-muted/50 p-2 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Notes:" }),
              " ",
              item.review_notes
            ] }),
            item.action_taken && item.action_taken !== "none" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", children: [
              "Action: ",
              item.action_taken
            ] }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
            item.status === "pending" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "ghost", onClick: () => {
                setReviewDialog({
                  ...item,
                  action: "approved"
                });
                setActionTaken("none");
              }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "mr-1 h-4 w-4 text-green-500" }),
                "Approve"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "ghost", onClick: () => {
                setReviewDialog({
                  ...item,
                  action: "rejected"
                });
                setActionTaken("content_removed");
              }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "mr-1 h-4 w-4 text-red-500" }),
                "Reject"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "ghost", onClick: () => {
                setReviewDialog({
                  ...item,
                  action: "escalated"
                });
                setActionTaken("none");
              }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "mr-1 h-4 w-4 text-yellow-500" }),
                "Escalate"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: getContentLink(item.content_type, item.content_id), target: "_blank", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-4 w-4" }) }) })
          ] })
        ] }) }, item.id)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!reviewDialog, onOpenChange: (v) => {
      if (!v) setReviewDialog(null);
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { children: [
        reviewDialog?.action === "approved" && "Approve Content",
        reviewDialog?.action === "rejected" && "Reject Content",
        reviewDialog?.action === "escalated" && "Escalate to Admin"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Action to Take" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: actionTaken, onValueChange: setActionTaken, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "none", children: "No Action" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "warning", children: "Send Warning" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "content_removed", children: "Remove Content" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "user_banned", children: "Ban User" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Review Notes" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { rows: 4, value: reviewNotes, onChange: (e) => setReviewNotes(e.target.value), placeholder: "Add your review notes..." })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => reviewItem.mutate({
        id: reviewDialog?.id,
        status: reviewDialog?.action,
        item: reviewDialog
      }), disabled: reviewItem.isPending, children: reviewItem.isPending ? "Processing..." : "Confirm" }) })
    ] }) })
  ] });
}
async function applyModerationAction(item, action) {
  const contentType = String(item.content_type ?? "");
  const contentId = String(item.content_id ?? "");
  if (action === "content_removed" && contentType === "comment") {
    await supabase.from("comments").update({
      is_hidden: true
    }).eq("id", contentId);
  }
  if (action === "user_banned" && contentType === "comment") {
    const {
      data: comment
    } = await supabase.from("comments").select("user_id").eq("id", contentId).single();
    if (comment?.user_id) {
      await supabase.from("profiles").update({
        is_banned: true
      }).eq("id", comment.user_id);
    }
  }
}
function getContentLink(type, id) {
  switch (type) {
    case "comment":
      return `/admin/comments`;
    case "report":
      return `/admin/reports`;
    case "series":
      return `/admin/series`;
    case "chapter":
      return `/admin/series`;
    default:
      return `/admin`;
  }
}
export {
  AdminModeration as component
};
