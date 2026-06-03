import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useQueryClient, a as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { s as supabase } from "./client-4GTNZWAa.mjs";
import { l as logAdminAction } from "./adminLog-FkQiQmmY.mjs";
import { D as Dialog, k as DialogTrigger, a as Button, l as DialogContent, m as DialogHeader, n as DialogTitle, L as Label, S as Select, b as SelectTrigger, d as SelectValue, e as SelectContent, f as SelectItem, p as DialogFooter, B as Badge, I as Input, T as Textarea } from "./router-1xbLZGbP.mjs";
import { A as AlertDialog, a as AlertDialogTrigger, b as AlertDialogContent, c as AlertDialogHeader, d as AlertDialogTitle, e as AlertDialogDescription, f as AlertDialogFooter, g as AlertDialogCancel, h as AlertDialogAction } from "./alert-dialog-DznKw9Wr.mjs";
import { C as Card } from "./card-DEChnkkj.mjs";
import { f as useSensors, h as useSensor, D as DndContext, i as closestCenter, j as KeyboardSensor, P as PointerSensor } from "../_libs/dnd-kit__core.mjs";
import { S as SortableContext, r as rectSortingStrategy, a as arrayMove, s as sortableKeyboardCoordinates, u as useSortable } from "../_libs/dnd-kit__sortable.mjs";
import { C as CSS } from "../_libs/dnd-kit__utilities.mjs";
import { S as Sparkles, V as Plus, E as Eye, ae as EyeOff, ad as Pencil, W as Trash2, a1 as Image, am as GripVertical } from "../_libs/lucide-react.mjs";
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
import "../_libs/date-fns.mjs";
import "../_libs/radix-ui__react-alert-dialog.mjs";
import "../_libs/dnd-kit__accessibility.mjs";
const emptyForm = {
  title: "",
  description: "",
  image_url: "",
  link_url: "",
  link_text: "Learn More",
  position: "hero",
  priority: "0",
  background_color: "#8B5CF6",
  text_color: "#FFFFFF",
  starts_at: "",
  expires_at: "",
  target_series_id: ""
};
function AdminBanners() {
  const qc = useQueryClient();
  const [open, setOpen] = reactExports.useState(false);
  const [editingItem, setEditingItem] = reactExports.useState(null);
  const [form, setForm] = reactExports.useState(emptyForm);
  const [carouselDialogOpen, setCarouselDialogOpen] = reactExports.useState(false);
  const [selectedSeriesId, setSelectedSeriesId] = reactExports.useState("");
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8
    }
  }), useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  }));
  const banners = useQuery({
    queryKey: ["admin", "banners"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("banners").select("*, series:target_series_id(title)").order("priority", {
        ascending: false
      }).order("created_at", {
        ascending: false
      });
      if (error) throw error;
      return data || [];
    },
    staleTime: 3 * 60 * 1e3
    // Cache for 3 minutes
  });
  const allSeries = useQuery({
    queryKey: ["series", "list"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("series").select("id, title").order("title");
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1e3
    // Cache for 5 minutes
  });
  const carouselItems = useQuery({
    queryKey: ["admin", "carousel"],
    queryFn: async () => {
      console.log("Fetching carousel items...");
      try {
        const {
          data,
          error
        } = await supabase.from("carousel_items").select("*, series:series_id(id, title, slug, cover_url)").order("position", {
          ascending: true
        });
        console.log("Carousel items query result:", {
          data,
          error
        });
        if (error) {
          console.error("Error fetching carousel items:", error);
          if (error.code === "42P01") {
            console.warn("carousel_items table doesn't exist yet");
            return [];
          }
          throw error;
        }
        return data || [];
      } catch (err) {
        console.error("Exception in carousel items query:", err);
        return [];
      }
    },
    retry: false,
    staleTime: 2 * 60 * 1e3
    // Cache for 2 minutes
  });
  const availableSeries = useQuery({
    queryKey: ["series", "available-for-carousel"],
    queryFn: async () => {
      try {
        const {
          data: allSeriesData,
          error: seriesError
        } = await supabase.from("series").select("id, title, cover_url").order("title");
        if (seriesError) throw seriesError;
        const {
          data: carouselData,
          error: carouselError
        } = await supabase.from("carousel_items").select("series_id");
        if (carouselError?.code === "42P01") {
          return allSeriesData || [];
        }
        if (carouselError) throw carouselError;
        const usedIds = new Set((carouselData || []).map((item) => item.series_id));
        return (allSeriesData || []).filter((s) => !usedIds.has(s.id));
      } catch (err) {
        console.error("Error in available series query:", err);
        const {
          data
        } = await supabase.from("series").select("id, title, cover_url").order("title");
        return data || [];
      }
    },
    retry: false,
    staleTime: 2 * 60 * 1e3
    // Cache for 2 minutes
  });
  const createBanner = useMutation({
    mutationFn: async () => {
      const priority = parseInt(form.priority, 10);
      const {
        error
      } = await supabase.from("banners").insert({
        title: form.title.trim(),
        description: form.description?.trim() || null,
        image_url: form.image_url?.trim() || null,
        link_url: form.link_url?.trim() || null,
        link_text: form.link_text?.trim() || null,
        position: form.position,
        priority: Number.isFinite(priority) ? priority : 0,
        background_color: form.background_color,
        text_color: form.text_color,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        target_series_id: form.target_series_id && form.target_series_id !== "none" ? form.target_series_id : null,
        is_active: true
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Banner created");
      await logAdminAction("create", "banner", void 0, {
        title: form.title
      });
      setOpen(false);
      setForm(emptyForm);
      qc.invalidateQueries({
        queryKey: ["admin", "banners"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const updateBanner = useMutation({
    mutationFn: async () => {
      if (!editingItem) throw new Error("No banner selected");
      const {
        error
      } = await supabase.from("banners").update({
        title: form.title,
        description: form.description || null,
        image_url: form.image_url || null,
        link_url: form.link_url || null,
        link_text: form.link_text || null,
        position: form.position,
        priority: parseInt(form.priority),
        background_color: form.background_color,
        text_color: form.text_color,
        starts_at: form.starts_at,
        expires_at: form.expires_at || null,
        target_series_id: form.target_series_id && form.target_series_id !== "none" ? form.target_series_id : null,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", editingItem.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Banner updated");
      setEditingItem(null);
      setForm(emptyForm);
      qc.invalidateQueries({
        queryKey: ["admin", "banners"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const toggleActive = useMutation({
    mutationFn: async (item) => {
      const {
        error
      } = await supabase.from("banners").update({
        is_active: !item.is_active
      }).eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({
      queryKey: ["admin", "banners"]
    })
  });
  const deleteBanner = useMutation({
    mutationFn: async (id) => {
      const {
        error
      } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Banner deleted");
      qc.invalidateQueries({
        queryKey: ["admin", "banners"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const addCarouselItem = useMutation({
    mutationFn: async (seriesId) => {
      console.log("Adding carousel item for series:", seriesId);
      const count = carouselItems.data?.length || 0;
      console.log("Current carousel count:", count);
      const {
        data,
        error
      } = await supabase.from("carousel_items").insert({
        series_id: seriesId,
        position: count,
        is_active: true
      }).select();
      console.log("Insert result:", {
        data,
        error
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      console.log("Successfully added carousel item:", data);
      toast.success("Added to carousel");
      await logAdminAction("create", "carousel_item", void 0, {
        series_id: selectedSeriesId
      });
      setCarouselDialogOpen(false);
      setSelectedSeriesId("");
      qc.invalidateQueries({
        queryKey: ["admin", "carousel"]
      });
      qc.invalidateQueries({
        queryKey: ["series", "available-for-carousel"]
      });
    },
    onError: (e) => {
      console.error("Error adding carousel item:", e);
      toast.error(e.message);
    }
  });
  const removeCarouselItem = useMutation({
    mutationFn: async (id) => {
      const {
        error
      } = await supabase.from("carousel_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Removed from carousel");
      qc.invalidateQueries({
        queryKey: ["admin", "carousel"]
      });
      qc.invalidateQueries({
        queryKey: ["series", "available-for-carousel"]
      });
      await reorderCarouselPositions();
    },
    onError: (e) => toast.error(e.message)
  });
  const updateCarouselPosition = useMutation({
    mutationFn: async ({
      id,
      position
    }) => {
      const {
        error
      } = await supabase.from("carousel_items").update({
        position
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["admin", "carousel"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const reorderCarouselPositions = async () => {
    const items = carouselItems.data || [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].position !== i) {
        await supabase.from("carousel_items").update({
          position: i
        }).eq("id", items[i].id);
      }
    }
    qc.invalidateQueries({
      queryKey: ["admin", "carousel"]
    });
  };
  const moveCarouselItem = (index, direction) => {
    const items = carouselItems.data || [];
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === items.length - 1) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    const item1 = items[index];
    const item2 = items[newIndex];
    updateCarouselPosition.mutate({
      id: item1.id,
      position: newIndex
    });
    updateCarouselPosition.mutate({
      id: item2.id,
      position: index
    });
  };
  const handleDragEnd = (event) => {
    const {
      active,
      over
    } = event;
    if (!over || active.id === over.id) return;
    const items = carouselItems.data || [];
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newItems = arrayMove(items, oldIndex, newIndex);
    newItems.forEach((item, index) => {
      if (item.position !== index) {
        updateCarouselPosition.mutate({
          id: item.id,
          position: index
        });
      }
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-xl font-bold tracking-tight flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-5 w-5 text-violet-500" }),
            "Homepage Carousel"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Add titles to homepage hero carousel (Max 20)" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: carouselDialogOpen, onOpenChange: setCarouselDialogOpen, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { disabled: (carouselItems.data?.length || 0) >= 20, variant: "outline", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1 h-4 w-4" }),
            "Add Title (",
            carouselItems.data?.length || 0,
            "/20)"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Add Title to Carousel" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Select Title" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: selectedSeriesId, onValueChange: setSelectedSeriesId, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Choose a title..." }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: (availableSeries.data || []).map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: s.id, children: s.title }, s.id)) })
              ] })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => addCarouselItem.mutate(selectedSeriesId), disabled: !selectedSeriesId || addCarouselItem.isPending, children: "Add to Carousel" }) })
          ] })
        ] })
      ] }),
      carouselItems.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Loading carousel items..." }) : (carouselItems.data?.length || 0) === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-8 text-center border-dashed", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "No titles in carousel yet. Add your first title!" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(DndContext, { sensors, collisionDetection: closestCenter, onDragEnd: handleDragEnd, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SortableContext, { items: (carouselItems.data || []).map((item) => item.id), strategy: rectSortingStrategy, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4", children: (carouselItems.data || []).map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(SortableCarouselCard, { item, index, totalItems: carouselItems.data?.length || 0, onMoveUp: () => moveCarouselItem(index, "up"), onMoveDown: () => moveCarouselItem(index, "down"), onRemove: () => removeCarouselItem.mutate(item.id) }, item.id)) }) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold tracking-tight", children: "Announcement Banners" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Manage promotional banners and announcements" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onOpenChange: setOpen, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1 h-4 w-4" }),
            "New Banner"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Create Banner" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(BannerForm, { form, setForm, series: allSeries.data || [] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => createBanner.mutate(), disabled: !form.title || createBanner.isPending, children: "Create" }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 space-y-3", children: [
        banners.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Loading..." }),
        (banners.data || []).map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-border/40 bg-card p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 flex-1", children: [
            item.image_url && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-24 w-40 flex-shrink-0 overflow-hidden rounded-md border border-border/40", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: item.image_url, alt: item.title, className: "h-full w-full object-cover" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: item.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: item.position === "hero" ? "default" : "secondary", children: item.position }),
                !item.is_active && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: "Inactive" }),
                item.series && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", children: [
                  "🎯 ",
                  item.series.title
                ] })
              ] }),
              item.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground line-clamp-2", children: item.description }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  "Priority: ",
                  item.priority
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  "👁️ ",
                  item.view_count
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  "🖱️ ",
                  item.click_count
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  "Starts: ",
                  new Date(item.starts_at).toLocaleDateString()
                ] }),
                item.expires_at && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  "Expires: ",
                  new Date(item.expires_at).toLocaleDateString()
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => toggleActive.mutate(item), title: item.is_active ? "Deactivate" : "Activate", children: item.is_active ? /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => {
              setEditingItem(item);
              setForm({
                title: item.title,
                description: item.description || "",
                image_url: item.image_url || "",
                link_url: item.link_url || "",
                link_text: item.link_text || "Learn More",
                position: item.position,
                priority: String(item.priority),
                background_color: item.background_color,
                text_color: item.text_color,
                starts_at: item.starts_at ? new Date(item.starts_at).toISOString().slice(0, 16) : "",
                expires_at: item.expires_at ? new Date(item.expires_at).toISOString().slice(0, 16) : "",
                target_series_id: item.target_series_id || ""
              });
            }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialog, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4 text-destructive" }) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogTitle, { children: [
                    'Delete "',
                    item.title,
                    '"?'
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: "This will permanently remove this banner." })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: "Cancel" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: () => deleteBanner.mutate(item.id), children: "Delete" })
                ] })
              ] })
            ] })
          ] })
        ] }) }, item.id))
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!editingItem, onOpenChange: (v) => {
        if (!v) {
          setEditingItem(null);
          setForm(emptyForm);
        }
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Edit Banner" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(BannerForm, { form, setForm, series: allSeries.data || [] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => updateBanner.mutate(), disabled: !form.title || updateBanner.isPending, children: updateBanner.isPending ? "Saving..." : "Save changes" }) })
      ] }) })
    ] })
  ] });
}
function SortableCarouselCard({
  item,
  index,
  totalItems,
  onMoveUp,
  onMoveDown,
  onRemove
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: item.id
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: setNodeRef, style, className: "relative group", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "aspect-[2/3] rounded-lg border-2 border-violet-500/20 overflow-hidden bg-card hover:border-violet-500/50 transition-colors", children: [
    item.series?.cover_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: item.series.cover_url, alt: item.series.title, className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-full flex items-center justify-center bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "h-12 w-12 text-muted-foreground" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-0 left-0 right-0 p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white text-sm font-medium line-clamp-2", children: item.series?.title }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-2 left-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-violet-600 text-white", children: [
      "#",
      index + 1
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "secondary", className: "h-7 w-7 cursor-grab active:cursor-grabbing", ...attributes, ...listeners, title: "Drag to reorder", children: /* @__PURE__ */ jsxRuntimeExports.jsx(GripVertical, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "secondary", className: "h-7 w-7", onClick: onMoveUp, disabled: index === 0, title: "Move up", children: "↑" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "secondary", className: "h-7 w-7", onClick: onMoveDown, disabled: index === totalItems - 1, title: "Move down", children: "↓" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialog, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "destructive", className: "h-7 w-7", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3 w-3" }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: "Remove from carousel?" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogDescription, { children: [
              'This will remove "',
              item.series?.title,
              '" from the homepage carousel.'
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: "Cancel" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: onRemove, children: "Remove" })
          ] })
        ] })
      ] })
    ] })
  ] }) });
}
function BannerForm({
  form,
  setForm,
  series
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Title *" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.title, onChange: (e) => setForm({
        ...form,
        title: e.target.value
      }), placeholder: "Banner title" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Description" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { rows: 3, value: form.description, onChange: (e) => setForm({
        ...form,
        description: e.target.value
      }), placeholder: "Banner description..." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Image URL" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.image_url, onChange: (e) => setForm({
        ...form,
        image_url: e.target.value
      }), placeholder: "https://example.com/image.jpg" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Link URL" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.link_url, onChange: (e) => setForm({
          ...form,
          link_url: e.target.value
        }), placeholder: "/title/slug" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Link Text" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.link_text, onChange: (e) => setForm({
          ...form,
          link_text: e.target.value
        }), placeholder: "Learn More" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Position" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.position, onValueChange: (v) => setForm({
          ...form,
          position: v
        }), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "hero", children: "Hero (Main carousel)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "featured", children: "Featured (Below hero)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "sidebar", children: "Sidebar" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Priority" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", value: form.priority, onChange: (e) => setForm({
          ...form,
          priority: e.target.value
        }), placeholder: "0" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Background Color" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "color", value: form.background_color, onChange: (e) => setForm({
          ...form,
          background_color: e.target.value
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Text Color" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "color", value: form.text_color, onChange: (e) => setForm({
          ...form,
          text_color: e.target.value
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Target Title (Optional)" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.target_series_id, onValueChange: (v) => setForm({
        ...form,
        target_series_id: v
      }), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select a title..." }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "none", children: "None" }),
          series.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: s.id, children: s.title }, s.id))
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Starts At" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "datetime-local", value: form.starts_at, onChange: (e) => setForm({
          ...form,
          starts_at: e.target.value
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Expires At (Optional)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "datetime-local", value: form.expires_at, onChange: (e) => setForm({
          ...form,
          expires_at: e.target.value
        }) })
      ] })
    ] })
  ] });
}
export {
  AdminBanners as component
};
