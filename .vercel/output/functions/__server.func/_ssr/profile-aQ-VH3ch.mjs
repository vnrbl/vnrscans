import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useQueryClient, a as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { s as supabase } from "./client-4GTNZWAa.mjs";
import { B as Badge, L as Label, I as Input, T as Textarea, a as Button, D as Dialog, l as DialogContent, m as DialogHeader, n as DialogTitle, c as cn, k as DialogTrigger, S as Select, b as SelectTrigger, d as SelectValue, e as SelectContent, f as SelectItem } from "./router-1xbLZGbP.mjs";
import { C as Card } from "./card-DEChnkkj.mjs";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-CtINcI6N.mjs";
import { R as Root, I as Indicator } from "../_libs/radix-ui__react-progress.mjs";
import { C as Cropper } from "../_libs/react-easy-crop.mjs";
import { R as Root$1, T as Thumb } from "../_libs/radix-ui__react-switch.mjs";
import { C as Crown, I as Shield, J as Calendar, T as Trophy, K as Flame, B as BookOpen, r as Star, N as Award, G as Settings, i as Target, q as TrendingUp, O as Mail, U as User, P as Camera, Q as Code, X, R as Upload, h as Check, V as Plus, W as Trash2, Y as Lock, S as Sparkles, Z as Globe, k as Users, E as Eye, _ as Copy } from "../_libs/lucide-react.mjs";
import { a as format } from "../_libs/date-fns.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/isbot.mjs";
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
import "../_libs/radix-ui__react-tabs.mjs";
import "../_libs/normalize-wheel.mjs";
const Progress = reactExports.forwardRef(({ className, value, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Root,
  {
    ref,
    className: cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/20", className),
    ...props,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Indicator,
      {
        className: "h-full w-full flex-1 bg-primary transition-all",
        style: { transform: `translateX(-${100 - (value || 0)}%)` }
      }
    )
  }
));
Progress.displayName = Root.displayName;
const goalTypeLabels = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
  custom: "Custom"
};
const targetTypeLabels = {
  chapters: "Chapters",
  series: "Series",
  streak: "Reading Streak"
};
const targetTypeIcons = {
  chapters: BookOpen,
  series: Star,
  streak: Flame
};
function ReadingGoals() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = reactExports.useState(false);
  const [goalType, setGoalType] = reactExports.useState("weekly");
  const [targetType, setTargetType] = reactExports.useState("chapters");
  const [targetValue, setTargetValue] = reactExports.useState("10");
  const goals = useQuery({
    queryKey: ["reading-goals"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data, error } = await supabase.from("reading_goals").select("*").eq("user_id", u.user.id).order("is_active", { ascending: false }).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });
  const createGoal = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not authenticated");
      const target = parseInt(targetValue);
      if (isNaN(target) || target <= 0) {
        throw new Error("Invalid target value");
      }
      let endDate = null;
      const startDate = /* @__PURE__ */ new Date();
      if (goalType === "daily") {
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
      } else if (goalType === "weekly") {
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
      } else if (goalType === "monthly") {
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (goalType === "yearly") {
        endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      const { error } = await supabase.from("reading_goals").insert({
        user_id: u.user.id,
        goal_type: goalType,
        target_type: targetType,
        target_value: target,
        current_value: 0,
        end_date: endDate?.toISOString()
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reading-goals"] });
      toast.success("Goal created successfully!");
      setDialogOpen(false);
      setTargetValue("10");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });
  const deleteGoal = useMutation({
    mutationFn: async (goalId) => {
      const { error } = await supabase.from("reading_goals").delete().eq("id", goalId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reading-goals"] });
      toast.success("Goal deleted");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });
  const activeGoals = goals.data?.filter((g) => g.is_active) || [];
  const completedGoals = goals.data?.filter((g) => !g.is_active) || [];
  const getProgress = (goal) => {
    return Math.min(goal.current_value / goal.target_value * 100, 100);
  };
  const getDaysRemaining = (goal) => {
    if (!goal.end_date) return null;
    const end = new Date(goal.end_date);
    const now = /* @__PURE__ */ new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
    return diffDays;
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold", children: "Reading Goals" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Set goals to track your reading progress" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: dialogOpen, onOpenChange: setDialogOpen, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
          "Create Goal"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Create New Goal" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "form",
            {
              onSubmit: (e) => {
                e.preventDefault();
                createGoal.mutate();
              },
              className: "space-y-4",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Goal Period" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: goalType, onValueChange: setGoalType, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "daily", children: "Daily" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "weekly", children: "Weekly" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "monthly", children: "Monthly" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "yearly", children: "Yearly" })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Target Type" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: targetType, onValueChange: setTargetType, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "chapters", children: "Read Chapters" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "series", children: "Follow Series" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "streak", children: "Maintain Streak (Days)" })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Target Value" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      type: "number",
                      min: "1",
                      value: targetValue,
                      onChange: (e) => setTargetValue(e.target.value),
                      placeholder: "e.g., 10",
                      required: true
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "w-full", disabled: createGoal.isPending, children: createGoal.isPending ? "Creating..." : "Create Goal" })
              ]
            }
          )
        ] })
      ] })
    ] }),
    activeGoals.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-semibold text-lg", children: [
        "Active Goals (",
        activeGoals.length,
        ")"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 md:grid-cols-2", children: activeGoals.map((goal) => {
        const progress = getProgress(goal);
        const daysRemaining = getDaysRemaining(goal);
        const Icon = targetTypeIcons[goal.target_type] || Target;
        const isCompleted = goal.current_value >= goal.target_value;
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-5 w-5 text-violet-500" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "font-semibold", children: [
                  goalTypeLabels[goal.goal_type],
                  " Goal"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: targetTypeLabels[goal.target_type] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                className: "h-8 w-8",
                onClick: () => deleteGoal.mutate(goal.id),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium", children: [
                goal.current_value,
                " / ",
                goal.target_value,
                " ",
                targetTypeLabels[goal.target_type].toLowerCase()
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-muted-foreground", children: [
                progress.toFixed(0),
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Progress, { value: progress, className: "h-2" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            isCompleted ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "gap-1 bg-green-500/10 text-green-600 hover:bg-green-500/20", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Trophy, { className: "h-3 w-3" }),
              "Completed!"
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Target, { className: "h-3 w-3" }),
              goal.target_value - goal.current_value,
              " to go"
            ] }),
            daysRemaining !== null && daysRemaining > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
              daysRemaining,
              " ",
              daysRemaining === 1 ? "day" : "days",
              " left"
            ] })
          ] })
        ] }) }, goal.id);
      }) })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-8 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Target, { className: "mx-auto h-12 w-12 text-muted-foreground/50" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mt-4 font-semibold", children: "No Active Goals" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Create a goal to start tracking your reading progress!" })
    ] }),
    completedGoals.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-semibold text-lg", children: [
        "Completed Goals (",
        completedGoals.length,
        ")"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 md:grid-cols-3", children: completedGoals.slice(0, 6).map((goal) => {
        const Icon = targetTypeIcons[goal.target_type] || Target;
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4 text-green-600" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-medium truncate", children: [
              goal.target_value,
              " ",
              targetTypeLabels[goal.target_type]
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: goal.completed_at ? format(new Date(goal.completed_at), "MMM d, yyyy") : "Completed" })
          ] })
        ] }) }, goal.id);
      }) })
    ] })
  ] });
}
function AvatarUpload({ currentAvatarUrl, username, onAvatarUpdated }) {
  const [dialogOpen, setDialogOpen] = reactExports.useState(false);
  const [imageSrc, setImageSrc] = reactExports.useState(null);
  const [crop, setCrop] = reactExports.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = reactExports.useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = reactExports.useState(null);
  const [uploading, setUploading] = reactExports.useState(false);
  const onCropComplete = reactExports.useCallback((croppedArea, croppedAreaPixels2) => {
    setCroppedAreaPixels(croppedAreaPixels2);
  }, []);
  const onFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("File must be an image");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result);
      setDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };
  const createImage = (url) => new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });
  const getCroppedImg = async (imageSrc2, pixelCrop) => {
    const image = await createImage(imageSrc2);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not get canvas context");
    }
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas is empty"));
        }
      }, "image/jpeg", 0.95);
    });
  };
  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setUploading(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");
      const filename = `avatar-${userData.user.id}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filename, croppedBlob, {
        contentType: "image/jpeg",
        upsert: true
      });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filename);
      const publicUrl = urlData.publicUrl;
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", userData.user.id);
      if (updateError) throw updateError;
      onAvatarUpdated(publicUrl);
      toast.success("Avatar updated successfully!");
      setDialogOpen(false);
      setImageSrc(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };
  const handleRemove = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("user_id", userData.user.id);
      if (error) throw error;
      onAvatarUpdated("");
      toast.success("Avatar removed");
    } catch (error) {
      toast.error(error.message || "Failed to remove avatar");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative group", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-32 w-32 overflow-hidden rounded-full border-4 border-violet-500/20 bg-gradient-to-br from-violet-500/20 to-purple-500/20", children: currentAvatarUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "img",
        {
          src: currentAvatarUrl,
          alt: username,
          className: "h-full w-full object-cover"
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full w-full items-center justify-center text-4xl font-bold text-violet-500", children: username?.charAt(0)?.toUpperCase() || "?" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "label",
        {
          htmlFor: "avatar-upload",
          className: "absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity group-hover:opacity-100",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { className: "mx-auto h-6 w-6 text-white" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-1 text-xs text-white", children: "Change" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                id: "avatar-upload",
                type: "file",
                accept: "image/*",
                className: "hidden",
                onChange: onFileSelect
              }
            )
          ]
        }
      )
    ] }),
    currentAvatarUrl && /* @__PURE__ */ jsxRuntimeExports.jsx(
      Button,
      {
        variant: "ghost",
        size: "sm",
        onClick: handleRemove,
        className: "mt-2 text-xs",
        children: "Remove Avatar"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: dialogOpen, onOpenChange: setDialogOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-[500px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Crop Your Avatar" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        imageSrc && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative h-[400px] w-full bg-black/5 rounded-lg overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Cropper,
          {
            image: imageSrc,
            crop,
            zoom,
            aspect: 1,
            cropShape: "round",
            showGrid: false,
            onCropChange: setCrop,
            onZoomChange: setZoom,
            onCropComplete
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: "Zoom" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "range",
              min: 1,
              max: 3,
              step: 0.1,
              value: zoom,
              onChange: (e) => setZoom(Number(e.target.value)),
              className: "w-full"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              onClick: () => {
                setDialogOpen(false);
                setImageSrc(null);
              },
              className: "flex-1",
              disabled: uploading,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "mr-2 h-4 w-4" }),
                "Cancel"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              onClick: handleUpload,
              className: "flex-1",
              disabled: uploading,
              children: uploading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "mr-2 h-4 w-4 animate-pulse" }),
                "Uploading..."
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "mr-2 h-4 w-4" }),
                "Save Avatar"
              ] })
            }
          )
        ] })
      ] })
    ] }) })
  ] });
}
function ProfileBadges() {
  const qc = useQueryClient();
  const [selectedBadge, setSelectedBadge] = reactExports.useState(null);
  const availableBadges = useQuery({
    queryKey: ["profile-badges", "available"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profile_badges").select("*").eq("is_active", true).order("name");
      if (error) throw error;
      return data || [];
    }
  });
  const userBadges = useQuery({
    queryKey: ["user-badges"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data, error } = await supabase.from("user_badges").select(`
          *,
          badge:badge_id(*)
        `).eq("user_id", u.user.id).order("earned_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });
  const toggleEquipBadge = useMutation({
    mutationFn: async (badgeId) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not authenticated");
      const userBadge = userBadges.data?.find((b) => b.badge_id === badgeId);
      if (!userBadge) throw new Error("Badge not found");
      if (!userBadge.is_equipped) {
        await supabase.from("user_badges").update({ is_equipped: false }).eq("user_id", u.user.id);
      }
      const { error } = await supabase.from("user_badges").update({ is_equipped: !userBadge.is_equipped }).eq("id", userBadge.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-badges"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Badge updated");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });
  const earnedBadgeIds = new Set(userBadges.data?.map((b) => b.badge_id) || []);
  const equippedBadge = userBadges.data?.find((b) => b.is_equipped);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold", children: "Profile Badges" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Earn badges by completing achievements and milestones" })
    ] }),
    equippedBadge && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-4 border-2 border-violet-500/50 bg-gradient-to-r from-violet-500/5 to-purple-500/5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "flex h-16 w-16 items-center justify-center rounded-lg text-3xl",
          style: { backgroundColor: `${equippedBadge.badge.badge_color}20` },
          children: equippedBadge.badge.icon
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: equippedBadge.badge.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3 w-3" }),
            "Equipped"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: equippedBadge.badge.description }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-violet-500 mt-2", children: "This badge appears next to your username" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "outline",
          size: "sm",
          onClick: () => toggleEquipBadge.mutate(equippedBadge.badge_id),
          children: "Unequip"
        }
      )
    ] }) }),
    userBadges.data && userBadges.data.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-semibold text-lg", children: [
        "Earned Badges (",
        userBadges.data.length,
        ")"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3", children: userBadges.data.map((userBadge) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        Card,
        {
          className: "p-4 cursor-pointer transition-all hover:border-violet-500/50 hover:shadow-lg",
          onClick: () => setSelectedBadge(userBadge),
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "flex h-12 w-12 items-center justify-center rounded-lg text-2xl",
                style: { backgroundColor: `${userBadge.badge.badge_color}20` },
                children: userBadge.badge.icon
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold text-sm truncate", children: userBadge.badge.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: new Date(userBadge.earned_at).toLocaleDateString() })
            ] }),
            userBadge.is_equipped && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4 text-violet-500" })
          ] })
        },
        userBadge.id
      )) })
    ] }),
    availableBadges.data && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-semibold text-lg", children: [
        "Locked Badges (",
        availableBadges.data.length - earnedBadgeIds.size,
        ")"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4", children: availableBadges.data.filter((badge) => !earnedBadgeIds.has(badge.id)).slice(0, 8).map((badge) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-3 opacity-60", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center text-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-lg bg-gray-500/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "h-6 w-6 text-gray-500" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: "???" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: badge.requirement_type.replace(/_/g, " ") })
        ] })
      ] }) }, badge.id)) })
    ] }),
    (!userBadges.data || userBadges.data.length === 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-8 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Trophy, { className: "mx-auto h-12 w-12 text-muted-foreground/50" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mt-4 font-semibold", children: "No Badges Earned Yet" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Keep reading and engaging to earn badges!" })
    ] }),
    selectedBadge && /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!selectedBadge, onOpenChange: () => setSelectedBadge(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-[400px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Badge Details" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center text-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "flex h-24 w-24 items-center justify-center rounded-lg text-5xl",
              style: {
                backgroundColor: `${selectedBadge.badge.badge_color}20`
              },
              children: selectedBadge.badge.icon
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-bold", children: selectedBadge.badge.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: selectedBadge.badge.description })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 pt-4 border-t", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Earned" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: new Date(selectedBadge.earned_at).toLocaleDateString() })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Type" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium capitalize", children: selectedBadge.badge.requirement_type.replace(/_/g, " ") })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            className: "w-full",
            onClick: () => {
              toggleEquipBadge.mutate(selectedBadge.badge_id);
              setSelectedBadge(null);
            },
            children: selectedBadge.is_equipped ? /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: "Unequip Badge" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "mr-2 h-4 w-4" }),
              "Equip Badge"
            ] })
          }
        )
      ] })
    ] }) })
  ] });
}
const Switch = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Root$1,
  {
    className: cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    ),
    ...props,
    ref,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Thumb,
      {
        className: cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
        )
      }
    )
  }
));
Switch.displayName = Root$1.displayName;
function PrivacySettings() {
  const qc = useQueryClient();
  const [profileVisibility, setProfileVisibility] = reactExports.useState("public");
  const [showReadingHistory, setShowReadingHistory] = reactExports.useState(true);
  const [showAchievements, setShowAchievements] = reactExports.useState(true);
  const [showStatistics, setShowStatistics] = reactExports.useState(true);
  const privacySettings = useQuery({
    queryKey: ["privacy-settings"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("profiles").select("profile_visibility, show_reading_history, show_achievements, show_statistics").eq("user_id", u.user.id).single();
      if (error) throw error;
      return data;
    }
  });
  reactExports.useEffect(() => {
    if (privacySettings.data) {
      setProfileVisibility(privacySettings.data.profile_visibility || "public");
      setShowReadingHistory(privacySettings.data.show_reading_history !== false);
      setShowAchievements(privacySettings.data.show_achievements !== false);
      setShowStatistics(privacySettings.data.show_statistics !== false);
    }
  }, [privacySettings.data]);
  const saveSettings = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("profiles").update({
        profile_visibility: profileVisibility,
        show_reading_history: showReadingHistory,
        show_achievements: showAchievements,
        show_statistics: showStatistics
      }).eq("user_id", u.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["privacy-settings"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Privacy settings updated");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });
  const visibilityOptions = [
    {
      value: "public",
      label: "Public",
      description: "Anyone can view your profile",
      icon: Globe
    },
    {
      value: "friends",
      label: "Friends Only",
      description: "Only your friends can view your profile",
      icon: Users
    },
    {
      value: "private",
      label: "Private",
      description: "Only you can view your profile",
      icon: Lock
    }
  ];
  const selectedOption = visibilityOptions.find(
    (opt) => opt.value === profileVisibility
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold", children: "Privacy Settings" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Control who can see your profile information" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "h-5 w-5 text-violet-500" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: "Profile Visibility" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Choose who can see your profile and activity" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: profileVisibility, onValueChange: setProfileVisibility, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: visibilityOptions.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: option.value, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(option.icon, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: option.label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: option.description })
          ] })
        ] }) }, option.value)) })
      ] }),
      selectedOption && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-border/40 bg-muted/50 p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(selectedOption.icon, { className: "h-4 w-4 text-violet-500" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium", children: [
          selectedOption.label,
          ":"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: selectedOption.description })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-5 w-5 text-violet-500" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: "Content Visibility" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Choose what information others can see on your profile" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "reading-history", className: "cursor-pointer", children: "Reading History" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Show chapters you've read and series you're following" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Switch,
          {
            id: "reading-history",
            checked: showReadingHistory,
            onCheckedChange: setShowReadingHistory
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-border/40" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "achievements", className: "cursor-pointer", children: "Achievements & Badges" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Display your earned achievements and equipped badges" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Switch,
          {
            id: "achievements",
            checked: showAchievements,
            onCheckedChange: setShowAchievements
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-border/40" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "statistics", className: "cursor-pointer", children: "Statistics & Analytics" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Show your reading stats, level, and progress" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Switch,
          {
            id: "statistics",
            checked: showStatistics,
            onCheckedChange: setShowStatistics
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-4 border-violet-500/20 bg-violet-500/5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "h-5 w-5 text-violet-500 flex-shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: "Privacy Note" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Your email address is always private. These settings only control what appears on your public profile page." })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Button,
      {
        onClick: () => saveSettings.mutate(),
        disabled: saveSettings.isPending,
        className: "w-full",
        children: saveSettings.isPending ? "Saving..." : "Save Privacy Settings"
      }
    )
  ] });
}
function ReadingHeatmap() {
  const [hoveredDay, setHoveredDay] = reactExports.useState(null);
  const [mousePosition, setMousePosition] = reactExports.useState({ x: 0, y: 0 });
  const heatmapData = useQuery({
    queryKey: ["reading-heatmap"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const oneYearAgo = /* @__PURE__ */ new Date();
      oneYearAgo.setDate(oneYearAgo.getDate() - 365);
      const { data, error } = await supabase.from("reading_history").select("read_at").eq("user_id", u.user.id).gte("read_at", oneYearAgo.toISOString());
      if (error) throw error;
      const dateCounts = {};
      data?.forEach((item) => {
        const date = new Date(item.read_at).toISOString().split("T")[0];
        dateCounts[date] = (dateCounts[date] || 0) + 1;
      });
      return dateCounts;
    }
  });
  const generateDays = () => {
    const days2 = [];
    const today = /* @__PURE__ */ new Date();
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const count = heatmapData.data?.[dateStr] || 0;
      days2.push({ date: dateStr, count });
    }
    return days2;
  };
  const days = generateDays();
  const totalDays = days.filter((d) => d.count > 0).length;
  const totalChapters = days.reduce((sum, d) => sum + d.count, 0);
  const maxStreak = calculateMaxStreak(days);
  const currentStreak = calculateCurrentStreak(days);
  function calculateMaxStreak(days2) {
    let maxStreak2 = 0;
    let currentStreak2 = 0;
    days2.forEach((day) => {
      if (day.count > 0) {
        currentStreak2++;
        maxStreak2 = Math.max(maxStreak2, currentStreak2);
      } else {
        currentStreak2 = 0;
      }
    });
    return maxStreak2;
  }
  function calculateCurrentStreak(days2) {
    let streak = 0;
    for (let i = days2.length - 1; i >= 0; i--) {
      if (days2[i].count > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }
  const getColor = (count) => {
    if (count === 0) return "bg-gray-200 dark:bg-gray-800";
    if (count <= 2) return "bg-violet-300 dark:bg-violet-900";
    if (count <= 5) return "bg-violet-400 dark:bg-violet-700";
    if (count <= 8) return "bg-violet-500 dark:bg-violet-600";
    return "bg-violet-600 dark:bg-violet-500";
  };
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold", children: "Reading Activity" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Your reading activity over the last year" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-5 w-5 text-violet-500" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold", children: totalDays }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Days Active" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-5 w-5 text-blue-500" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold", children: totalChapters }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Chapters Read" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Flame, { className: "h-5 w-5 text-orange-500" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold", children: currentStreak }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Current Streak" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Flame, { className: "h-5 w-5 text-green-500" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold", children: maxStreak }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Longest Streak" })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: "Activity Calendar" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Less" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-3 rounded-sm bg-gray-200 dark:bg-gray-800" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-3 rounded-sm bg-violet-300 dark:bg-violet-900" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-3 rounded-sm bg-violet-400 dark:bg-violet-700" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-3 rounded-sm bg-violet-500 dark:bg-violet-600" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-3 rounded-sm bg-violet-600 dark:bg-violet-500" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "More" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-block min-w-full", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-2 flex gap-1 pl-8", children: months.map((month, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "text-xs text-muted-foreground",
            style: { width: `${100 / 12}%`, minWidth: "50px" },
            children: month
          },
          month
        )) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-1", children: weekdays.map((day) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "flex h-3 w-6 items-center text-xs text-muted-foreground",
              children: day[0]
            },
            day
          )) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1", children: weeks.map((week, weekIndex) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-1", children: week.map((day, dayIndex) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: `h-3 w-3 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-violet-500 ${getColor(
                day.count
              )}`,
              onMouseEnter: (e) => {
                setHoveredDay(day);
                setMousePosition({ x: e.clientX, y: e.clientY });
              },
              onMouseLeave: () => setHoveredDay(null)
            },
            day.date
          )) }, weekIndex)) })
        ] })
      ] }) })
    ] }) }),
    hoveredDay && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "fixed z-50 rounded-lg border bg-popover px-3 py-2 text-sm shadow-lg pointer-events-none",
        style: {
          left: `${mousePosition.x + 10}px`,
          top: `${mousePosition.y + 10}px`
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: new Date(hoveredDay.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: hoveredDay.count === 0 ? "No chapters read" : `${hoveredDay.count} ${hoveredDay.count === 1 ? "chapter" : "chapters"} read` })
        ]
      }
    )
  ] });
}
function ProfileWidgets() {
  useQueryClient();
  const [widgetType, setWidgetType] = reactExports.useState("card");
  const [widgetTheme, setWidgetTheme] = reactExports.useState("dark");
  const [copied, setCopied] = reactExports.useState(false);
  const profile = useQuery({
    queryKey: ["profile", "widget-preview"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("profiles").select("*, user_id").eq("user_id", u.user.id).single();
      if (error) throw error;
      return data;
    }
  });
  const stats = useQuery({
    queryKey: ["widget-stats"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return { chapters: 0, series: 0, achievements: 0 };
      const [chapters, series, achievements] = await Promise.all([
        supabase.from("reading_history").select("*", { count: "exact", head: true }).eq("user_id", u.user.id),
        supabase.from("series_follows").select("*", { count: "exact", head: true }).eq("user_id", u.user.id),
        supabase.from("user_achievements").select("*", { count: "exact", head: true }).eq("user_id", u.user.id)
      ]);
      return {
        chapters: chapters.count || 0,
        series: series.count || 0,
        achievements: achievements.count || 0
      };
    }
  });
  const generateEmbedCode = () => {
    if (!profile.data) return "";
    const username = profile.data.username || "user";
    const baseUrl = window.location.origin;
    return `<iframe src="${baseUrl}/widget/${username}?type=${widgetType}&theme=${widgetTheme}" width="${widgetType === "banner" ? "600" : "300"}" height="${widgetType === "minimal" ? "100" : "400"}" frameborder="0"></iframe>`;
  };
  const generateMarkdownCode = () => {
    if (!profile.data) return "";
    const username = profile.data.username || "user";
    const baseUrl = window.location.origin;
    return `[![0Verse Profile](${baseUrl}/widget/${username}?type=${widgetType}&theme=${widgetTheme})](${baseUrl}/profile)`;
  };
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2e3);
  };
  const getPreviewColors = () => {
    if (widgetTheme === "light") {
      return {
        bg: "bg-white",
        text: "text-gray-900",
        secondary: "text-gray-600",
        border: "border-gray-200"
      };
    } else if (widgetTheme === "violet") {
      return {
        bg: "bg-gradient-to-br from-violet-600 to-purple-600",
        text: "text-white",
        secondary: "text-violet-100",
        border: "border-violet-400"
      };
    } else {
      return {
        bg: "bg-gray-900",
        text: "text-white",
        secondary: "text-gray-400",
        border: "border-gray-700"
      };
    }
  };
  const colors = getPreviewColors();
  const renderPreview = () => {
    if (!profile.data || !stats.data) return null;
    const { username, avatar_url, bio, user_level } = profile.data;
    if (widgetType === "minimal") {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `p-4 rounded-lg border ${colors.border} ${colors.bg}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 rounded-full overflow-hidden bg-violet-500/20", children: avatar_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: avatar_url, alt: username, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full w-full flex items-center justify-center font-bold text-violet-500", children: username?.charAt(0)?.toUpperCase() }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `font-bold ${colors.text}`, children: username }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: `text-sm ${colors.secondary}`, children: [
            "Level ",
            user_level
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-sm ${colors.secondary}`, children: "0Verse" }) })
      ] }) });
    }
    if (widgetType === "banner") {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `p-6 rounded-lg border ${colors.border} ${colors.bg}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-20 w-20 rounded-full overflow-hidden bg-violet-500/20", children: avatar_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: avatar_url, alt: username, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full w-full flex items-center justify-center text-2xl font-bold text-violet-500", children: username?.charAt(0)?.toUpperCase() }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: `text-xl font-bold ${colors.text}`, children: username }),
          bio && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-sm mt-1 ${colors.secondary} line-clamp-1`, children: bio }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 mt-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-lg font-bold ${colors.text}`, children: stats.data.chapters }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-xs ${colors.secondary}`, children: "Chapters" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-lg font-bold ${colors.text}`, children: stats.data.series }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-xs ${colors.secondary}`, children: "Following" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-lg font-bold ${colors.text}`, children: user_level }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-xs ${colors.secondary}`, children: "Level" })
            ] })
          ] })
        ] })
      ] }) });
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `p-6 rounded-lg border ${colors.border} ${colors.bg}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-24 w-24 rounded-full overflow-hidden mx-auto bg-violet-500/20", children: avatar_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: avatar_url, alt: username, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full w-full flex items-center justify-center text-3xl font-bold text-violet-500", children: username?.charAt(0)?.toUpperCase() }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: `text-xl font-bold mt-4 ${colors.text}`, children: username }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: `text-sm mt-1 ${colors.secondary}`, children: [
        "Level ",
        user_level
      ] }),
      bio && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-sm mt-2 ${colors.secondary} line-clamp-2`, children: bio }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-4 mt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-2xl font-bold ${colors.text}`, children: stats.data.chapters }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-xs ${colors.secondary}`, children: "Chapters" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-2xl font-bold ${colors.text}`, children: stats.data.series }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-xs ${colors.secondary}`, children: "Series" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-2xl font-bold ${colors.text}`, children: stats.data.achievements }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-xs ${colors.secondary}`, children: "Badges" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-xs mt-4 ${colors.secondary}`, children: "0Verse • Profile Widget" })
    ] }) });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold", children: "Profile Widgets" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Create embeddable profile cards to share on websites and social media" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold mb-4", children: "Customize Your Widget" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Widget Type" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: widgetType, onValueChange: (v) => setWidgetType(v), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "card", children: "Card (300x400)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "banner", children: "Banner (600x200)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "minimal", children: "Minimal (300x100)" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Theme" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: widgetTheme, onValueChange: (v) => setWidgetTheme(v), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "dark", children: "Dark" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "light", children: "Light" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "violet", children: "Violet Gradient" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: "Preview" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-3 w-3" }),
          "Live Preview"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center p-8 bg-muted/50 rounded-lg", children: renderPreview() })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold mb-4", children: "Embed Code" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "html", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "grid w-full grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "html", children: "HTML" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "markdown", children: "Markdown" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "html", className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "HTML Embed Code" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: generateEmbedCode(),
                readOnly: true,
                className: "pr-20 font-mono text-sm"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                size: "sm",
                variant: "ghost",
                className: "absolute right-1 top-1 h-8",
                onClick: () => handleCopy(generateEmbedCode()),
                children: copied ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-4 w-4" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Copy and paste this code into your website or blog" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "markdown", className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Markdown Code" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: generateMarkdownCode(),
                readOnly: true,
                className: "pr-20 font-mono text-sm"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                size: "sm",
                variant: "ghost",
                className: "absolute right-1 top-1 h-8",
                onClick: () => handleCopy(generateMarkdownCode()),
                children: copied ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-4 w-4" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Use this code in GitHub README, forums, or anywhere that supports Markdown" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-4 border-violet-500/20 bg-violet-500/5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-5 w-5 text-violet-500 flex-shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: "Share Your Profile" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "These widgets update automatically with your latest stats. Share them on your personal website, GitHub profile, or social media!" })
      ] })
    ] }) })
  ] });
}
function ProfilePage() {
  const qc = useQueryClient();
  const profile = useQuery({
    queryKey: ["profile", "me"],
    queryFn: async () => {
      const {
        data: u
      } = await supabase.auth.getUser();
      if (!u.user) throw new Error("No user");
      const {
        data,
        error
      } = await supabase.from("profiles").select("*").eq("user_id", u.user.id).maybeSingle();
      if (error) throw error;
      return {
        ...data,
        email: u.user.email
      };
    },
    staleTime: 2 * 60 * 1e3
  });
  const achievements = useQuery({
    queryKey: ["profile", "achievements"],
    queryFn: async () => {
      const {
        data: u
      } = await supabase.auth.getUser();
      if (!u.user) return [];
      const {
        data,
        error
      } = await supabase.from("user_achievements").select("*, achievement:achievement_id(name, description, icon, rarity, xp_reward)").eq("user_id", u.user.id).order("unlocked_at", {
        ascending: false
      });
      if (error) {
        console.error("Error fetching achievements:", error);
        return [];
      }
      return data || [];
    },
    staleTime: 5 * 60 * 1e3
  });
  const readingStats = useQuery({
    queryKey: ["profile", "reading-stats"],
    queryFn: async () => {
      const {
        data: u
      } = await supabase.auth.getUser();
      if (!u.user) return {
        chapters: 0,
        series: 0,
        comments: 0,
        ratings: 0
      };
      const [chaptersRead, seriesFollowed, commentsCount, ratingsCount] = await Promise.all([supabase.from("reading_history").select("*", {
        count: "exact",
        head: true
      }).eq("user_id", u.user.id), supabase.from("series_follows").select("*", {
        count: "exact",
        head: true
      }).eq("user_id", u.user.id), supabase.from("comments").select("*", {
        count: "exact",
        head: true
      }).eq("user_id", u.user.id), supabase.from("ratings").select("*", {
        count: "exact",
        head: true
      }).eq("user_id", u.user.id)]);
      return {
        chapters: chaptersRead.count || 0,
        series: seriesFollowed.count || 0,
        comments: commentsCount.count || 0,
        ratings: ratingsCount.count || 0
      };
    },
    staleTime: 5 * 60 * 1e3
  });
  const userRoles = useQuery({
    queryKey: ["profile", "roles"],
    queryFn: async () => {
      const {
        data: u
      } = await supabase.auth.getUser();
      if (!u.user) return [];
      const {
        data,
        error
      } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      if (error) return [];
      return (data || []).map((r) => r.role);
    },
    staleTime: 10 * 60 * 1e3
  });
  const [username, setUsername] = reactExports.useState("");
  const [bio, setBio] = reactExports.useState("");
  const [avatarUrl, setAvatarUrl] = reactExports.useState("");
  reactExports.useEffect(() => {
    if (profile.data) {
      setUsername(profile.data.username ?? "");
      setBio(profile.data.bio ?? "");
      setAvatarUrl(profile.data.avatar_url ?? "");
    }
  }, [profile.data]);
  const save = useMutation({
    mutationFn: async () => {
      const {
        data: u
      } = await supabase.auth.getUser();
      if (!u.user) throw new Error("No user");
      const {
        error
      } = await supabase.from("profiles").update({
        username,
        bio,
        avatar_url: avatarUrl || null
      }).eq("user_id", u.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["profile"]
      });
      toast.success("Profile updated");
    },
    onError: (e) => toast.error(e.message)
  });
  const xp = profile.data?.experience_points || 0;
  const level = profile.data?.user_level || 1;
  const xpForNextLevel = Math.pow((level + 1) * 2, 2);
  const xpProgress = xp % xpForNextLevel / xpForNextLevel * 100;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto max-w-5xl px-8 md:px-12 lg:px-16 py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6 md:flex-row md:items-start", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-shrink-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarUpload, { currentAvatarUrl: avatarUrl, username, onAvatarUpdated: (url) => setAvatarUrl(url) }),
        profile.data?.is_vip && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -bottom-2 -right-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: "h-5 w-5 text-white" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-start justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold tracking-tight", children: username || "Loading..." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: profile.data?.email }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-2", children: [
            userRoles.data?.includes("admin") && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-red-500/10 text-red-500 hover:bg-red-500/20", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "mr-1 h-3 w-3" }),
              "Admin"
            ] }),
            userRoles.data?.includes("moderator") && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "mr-1 h-3 w-3" }),
              "Moderator"
            ] }),
            profile.data?.is_vip && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 text-yellow-600 hover:from-yellow-500/20 hover:to-yellow-600/20", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: "mr-1 h-3 w-3" }),
              "VIP"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "mr-1 h-3 w-3" }),
              "Joined ",
              new Date(profile.data?.created_at || "").toLocaleDateString()
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Trophy, { className: "h-5 w-5 text-violet-500" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-semibold", children: [
                "Level ",
                level
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-muted-foreground", children: [
              xp,
              " / ",
              xpForNextLevel,
              " XP"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Progress, { value: xpProgress, className: "mt-2 h-2" })
        ] }),
        bio && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-sm text-muted-foreground", children: bio })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Reading Streak" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold", children: profile.data?.reading_streak || 0 })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Flame, { className: "h-8 w-8 text-orange-500" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Chapters Read" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold", children: readingStats.data?.chapters || 0 })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-8 w-8 text-blue-500" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Series Followed" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold", children: readingStats.data?.series || 0 })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-8 w-8 text-yellow-500" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Achievements" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold", children: achievements.data?.length || 0 })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Award, { className: "h-8 w-8 text-purple-500" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "edit", className: "w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "grid w-full grid-cols-3 lg:grid-cols-6 h-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "edit", className: "gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Edit" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "goals", className: "gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Target, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Goals" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "badges", className: "gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Award, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Badges" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "achievements", className: "gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Trophy, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Achievements" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "stats", className: "gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Stats" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "privacy", className: "gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Privacy" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "edit", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: (e) => {
        e.preventDefault();
        save.mutate();
      }, className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "email", children: "Email" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "email", value: profile.data?.email ?? "", disabled: true, className: "pl-10" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Email cannot be changed" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "username", children: "Username *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "username", value: username, onChange: (e) => setUsername(e.target.value), minLength: 3, required: true, className: "pl-10", placeholder: "Your username" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "avatar", children: "Avatar URL" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "avatar", value: avatarUrl, onChange: (e) => setAvatarUrl(e.target.value), className: "pl-10", placeholder: "https://example.com/avatar.jpg" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Enter a URL to your profile picture" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "bio", children: "Bio" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { id: "bio", value: bio, onChange: (e) => setBio(e.target.value), rows: 4, placeholder: "Tell us about yourself...", className: "resize-none", maxLength: 500 }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [
            bio.length,
            "/500 characters"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: save.isPending, className: "w-full", children: save.isPending ? "Saving..." : "Save Changes" })
      ] }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "goals", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ReadingGoals, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "badges", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ProfileBadges, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "achievements", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-4 text-xl font-bold", children: "Unlocked Achievements" }),
        achievements.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Loading achievements..." }) : achievements.data && achievements.data.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: achievements.data.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 rounded-lg border border-border/40 bg-card p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-lg text-2xl", style: {
            backgroundColor: item.achievement?.badge_color ? `${item.achievement.badge_color}20` : "#8B5CF620"
          }, children: item.achievement?.icon || "🏆" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: item.achievement?.name || "Achievement" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs", children: item.achievement?.rarity || "common" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: item.achievement?.description || "No description" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-xs text-violet-500", children: [
              "+",
              item.achievement?.xp_reward || 0,
              " XP • Unlocked ",
              new Date(item.unlocked_at).toLocaleDateString()
            ] })
          ] })
        ] }, item.id)) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-dashed border-border/40 p-8 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Trophy, { className: "mx-auto h-12 w-12 text-muted-foreground/50" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "No achievements unlocked yet" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Start reading to earn achievements!" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "stats", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ReadingHeatmap, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-4 text-xl font-bold", children: "Your Statistics" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-3 font-semibold", children: "Reading Activity" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-4 w-4 text-blue-500" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: "Chapters Read" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: readingStats.data?.chapters || 0 })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-4 w-4 text-yellow-500" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: "Series Followed" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: readingStats.data?.series || 0 })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Flame, { className: "h-4 w-4 text-orange-500" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: "Current Streak" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-semibold", children: [
                    profile.data?.reading_streak || 0,
                    " days"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-3 font-semibold", children: "Community Engagement" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Target, { className: "h-4 w-4 text-green-500" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: "Comments Posted" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: readingStats.data?.comments || 0 })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-4 w-4 text-purple-500" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: "Ratings Given" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: readingStats.data?.ratings || 0 })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Award, { className: "h-4 w-4 text-violet-500" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: "Achievements Unlocked" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: achievements.data?.length || 0 })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-3 font-semibold", children: "Level Progress" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Trophy, { className: "h-4 w-4 text-violet-500" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: "Current Level" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-semibold", children: [
                    "Level ",
                    level
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-4 w-4 text-blue-500" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: "Total XP" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: xp })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Target, { className: "h-4 w-4 text-green-500" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: "Next Level" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-semibold", children: [
                    xpForNextLevel - xp,
                    " XP needed"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Progress, { value: xpProgress, className: "h-2" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-center text-xs text-muted-foreground", children: [
                    xpProgress.toFixed(1),
                    "% to Level ",
                    level + 1
                  ] })
                ] })
              ] })
            ] })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "privacy", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PrivacySettings, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "widgets", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ProfileWidgets, {}) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", className: "gap-2", onClick: () => {
      const tabsElement = document.querySelector('[role="tablist"]');
      const widgetButton = document.querySelector('[value="widgets"]');
      if (widgetButton) {
        widgetButton.click();
        tabsElement?.scrollIntoView({
          behavior: "smooth"
        });
      }
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Code, { className: "h-4 w-4" }),
      "Generate Profile Widget"
    ] }) })
  ] });
}
export {
  ProfilePage as component
};
