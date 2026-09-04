"use client";

import { Link, useNavigate } from "@/lib/router-compat";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Image as ImageIcon, GripVertical, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/adminLog";
import { Button } from "@/components/ui/button";
import { formatAppDate } from "@/lib/date";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


type BannerForm = {
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  link_text: string;
  position: string;
  priority: string;
  background_color: string;
  text_color: string;
  starts_at: string;
  expires_at: string;
  target_series_id: string;
};

const emptyForm: BannerForm = {
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
  target_series_id: "",
};

const CAROUSEL_TITLE_LIMIT = 30;

export default function AdminBanners() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [form, setForm] = useState<BannerForm>(emptyForm);
  const [carouselDialogOpen, setCarouselDialogOpen] = useState(false);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>("");

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const banners = useQuery({
    queryKey: ["admin", "banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*, series:target_series_id(title)")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 3 * 60 * 1000, // Cache for 3 minutes
  });

  const allSeries = useQuery({
    queryKey: ["series", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("id, title")
        .order("title");
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const carouselItems = useQuery({
    queryKey: ["admin", "carousel"],
    queryFn: async () => {
      console.log("Fetching carousel items...");
      try {
        const { data, error} = await supabase
          .from("carousel_items")
          .select("*, series:series_id(id, title, slug, cover_url)")
          .order("position", { ascending: true });
        
        console.log("Carousel items query result:", { data, error });
        if (error) {
          console.error("Error fetching carousel items:", error);
          // Return empty array if table doesn't exist yet
          if (error.code === '42P01') {
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
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });

  const availableSeries = useQuery({
    queryKey: ["series", "available-for-carousel"],
    queryFn: async () => {
      try {
        const { data: allSeriesData, error: seriesError } = await supabase
          .from("series")
          .select("id, title, cover_url")
          .order("title");
        
        if (seriesError) throw seriesError;

        const { data: carouselData, error: carouselError } = await supabase
          .from("carousel_items")
          .select("series_id");
        
        // If table doesn't exist, return all series
        if (carouselError?.code === '42P01') {
          return allSeriesData || [];
        }
        
        if (carouselError) throw carouselError;

        const usedIds = new Set((carouselData || []).map(item => item.series_id));
        return (allSeriesData || []).filter(s => !usedIds.has(s.id));
      } catch (err) {
        console.error("Error in available series query:", err);
        // Fallback: return all series
        const { data } = await supabase
          .from("series")
          .select("id, title, cover_url")
          .order("title");
        return data || [];
      }
    },
    retry: false,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });

  const createBanner = useMutation({
    mutationFn: async () => {
      const priority = parseInt(form.priority, 10);
      const { error } = await supabase.from("banners").insert({
        title: form.title.trim(),
        description: form.description?.trim() || null,
        image_url: form.image_url?.trim() || null,
        link_url: form.link_url?.trim() || null,
        link_text: form.link_text?.trim() || null,
        position: form.position,
        priority: Number.isFinite(priority) ? priority : 0,
        background_color: form.background_color,
        text_color: form.text_color,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : new Date().toISOString(),
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        target_series_id: form.target_series_id && form.target_series_id !== "none" ? form.target_series_id : null,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Banner created");
      await logAdminAction("create", "banner", undefined, { title: form.title });
      setOpen(false);
      setForm(emptyForm);
      qc.invalidateQueries({ queryKey: ["admin", "banners"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateBanner = useMutation({
    mutationFn: async () => {
      if (!editingItem) throw new Error("No banner selected");
      const { error } = await supabase
        .from("banners")
        .update({
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
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingItem.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Banner updated");
      setEditingItem(null);
      setForm(emptyForm);
      qc.invalidateQueries({ queryKey: ["admin", "banners"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async (item: any) => {
      const { error } = await supabase
        .from("banners")
        .update({ is_active: !item.is_active })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "banners"] }),
  });

  const deleteBanner = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Banner deleted");
      qc.invalidateQueries({ queryKey: ["admin", "banners"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addCarouselItem = useMutation({
    mutationFn: async (seriesId: string) => {
      console.log("Adding carousel item for series:", seriesId);
      const count = carouselItems.data?.length || 0;
      console.log("Current carousel count:", count);
      
      const { data, error } = await supabase.from("carousel_items").insert({
        series_id: seriesId,
        position: count,
        is_active: true,
      }).select();
      
      console.log("Insert result:", { data, error });
      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      console.log("Successfully added carousel item:", data);
      toast.success("Added to carousel");
      await logAdminAction("create", "carousel_item", undefined, { series_id: selectedSeriesId });
      setCarouselDialogOpen(false);
      setSelectedSeriesId("");
      qc.invalidateQueries({ queryKey: ["admin", "carousel"] });
      qc.invalidateQueries({ queryKey: ["series", "available-for-carousel"] });
    },
    onError: (e: Error) => {
      console.error("Error adding carousel item:", e);
      toast.error(e.message);
    },
  });

  const removeCarouselItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("carousel_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Removed from carousel");
      qc.invalidateQueries({ queryKey: ["admin", "carousel"] });
      qc.invalidateQueries({ queryKey: ["series", "available-for-carousel"] });
      // Reorder positions
      await reorderCarouselPositions();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateCarouselPosition = useMutation({
    mutationFn: async ({ id, position }: { id: string; position: number }) => {
      const { error } = await supabase
        .from("carousel_items")
        .update({ position })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "carousel"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reorderCarouselPositions = async () => {
    const items = carouselItems.data || [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].position !== i) {
        await supabase
          .from("carousel_items")
          .update({ position: i })
          .eq("id", items[i].id);
      }
    }
    qc.invalidateQueries({ queryKey: ["admin", "carousel"] });
  };

  const moveCarouselItem = (index: number, direction: "up" | "down") => {
    const items = carouselItems.data || [];
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === items.length - 1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const item1 = items[index];
    const item2 = items[newIndex];

    updateCarouselPosition.mutate({ id: item1.id, position: newIndex });
    updateCarouselPosition.mutate({ id: item2.id, position: index });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const items = carouselItems.data || [];
    const oldIndex = items.findIndex(item => item.id === active.id);
    const newIndex = items.findIndex(item => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistic update
    const newItems = arrayMove(items, oldIndex, newIndex);
    
    // Update positions in database
    newItems.forEach((item, index) => {
      if (item.position !== index) {
        updateCarouselPosition.mutate({ id: item.id, position: index });
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* SERIES CAROUSEL SECTION */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              Homepage Carousel
            </h2>
            <p className="text-sm text-muted-foreground">Add titles to homepage hero carousel (Max {CAROUSEL_TITLE_LIMIT})</p>
          </div>
          <Dialog open={carouselDialogOpen} onOpenChange={setCarouselDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                disabled={(carouselItems.data?.length || 0) >= CAROUSEL_TITLE_LIMIT}
                variant="outline"
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Title ({carouselItems.data?.length || 0}/{CAROUSEL_TITLE_LIMIT})
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Title to Carousel</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Select Title</Label>
                  <Select value={selectedSeriesId} onValueChange={setSelectedSeriesId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a title..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(availableSeries.data || []).map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={() => addCarouselItem.mutate(selectedSeriesId)} 
                  disabled={!selectedSeriesId || addCarouselItem.isPending}
                >
                  Add to Carousel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {carouselItems.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading carousel items...</p>
        ) : (carouselItems.data?.length || 0) === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <p className="text-muted-foreground">No titles in carousel yet. Add your first title!</p>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={(carouselItems.data || []).map(item => item.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {(carouselItems.data || []).map((item, index) => (
                  <SortableCarouselCard
                    key={item.id}
                    item={item}
                    index={index}
                    totalItems={carouselItems.data?.length || 0}
                    onMoveUp={() => moveCarouselItem(index, "up")}
                    onMoveDown={() => moveCarouselItem(index, "down")}
                    onRemove={() => removeCarouselItem.mutate(item.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* BANNERS SECTION */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Announcement Banners</h2>
            <p className="text-sm text-muted-foreground">Manage promotional banners and announcements</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1 h-4 w-4" />
                New Banner
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Banner</DialogTitle>
              </DialogHeader>
              <BannerForm form={form} setForm={setForm} series={allSeries.data || []} />
              <DialogFooter>
                <Button onClick={() => createBanner.mutate()} disabled={!form.title || createBanner.isPending}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-6 space-y-3">
          {banners.isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

          {(banners.data || []).map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-border/40 bg-card p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4 flex-1">
                {item.image_url && (
                  <div className="h-24 w-40 flex-shrink-0 overflow-hidden rounded-md border border-border/40">
                    {item.image_url.toLowerCase().split("?")[0].endsWith(".mp4") ? (
                      <video
                        src={item.image_url}
                        loop
                        muted
                        autoPlay
                        playsInline
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <img 
                        src={item.image_url} 
                        alt={item.title} 
                        className="h-full w-full object-cover" 
                      />
                    )}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{item.title}</h3>
                    <Badge variant={item.position === "hero" ? "default" : "secondary"}>
                      {item.position}
                    </Badge>
                    {!item.is_active && <Badge variant="outline">Inactive</Badge>}
                    {item.series && <Badge variant="outline">🎯 {item.series.title}</Badge>}
                  </div>
                  {item.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>Priority: {item.priority}</span>
                    <span>👁️ {item.view_count}</span>
                    <span>🖱️ {item.click_count}</span>
                    <span>Starts: {item.starts_at ? formatAppDate(item.starts_at) : ""}</span>
                    {item.expires_at && <span>Expires: {formatAppDate(item.expires_at)}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleActive.mutate(item)}
                  title={item.is_active ? "Deactivate" : "Activate"}
                >
                  {item.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingItem(item);
                    setForm({
                      title: item.title,
                      description: item.description || "",
                      image_url: item.image_url || "",
                      link_url: item.link_url || "",
                      link_text: item.link_text || "Learn More",
                      position: item.position,
                      priority: String(item.priority),
                      background_color: item.background_color || "#8B5CF6",
                      text_color: item.text_color || "#FFFFFF",
                      starts_at: item.starts_at ? new Date(item.starts_at).toISOString().slice(0, 16) : "",
                      expires_at: item.expires_at ? new Date(item.expires_at).toISOString().slice(0, 16) : "",
                      target_series_id: item.target_series_id || "",
                    });
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete "{item.title}"?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove this banner.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteBanner.mutate(item.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
          ))}
        </div>

        <Dialog open={!!editingItem} onOpenChange={(v) => { if (!v) { setEditingItem(null); setForm(emptyForm); } }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Banner</DialogTitle>
            </DialogHeader>
            <BannerForm form={form} setForm={setForm} series={allSeries.data || []} />
            <DialogFooter>
              <Button onClick={() => updateBanner.mutate()} disabled={!form.title || updateBanner.isPending}>
                {updateBanner.isPending ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Sortable Carousel Card Component
function SortableCarouselCard({ 
  item, 
  index, 
  totalItems,
  onMoveUp, 
  onMoveDown, 
  onRemove 
}: { 
  item: any; 
  index: number; 
  totalItems: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
    >
      <div className="aspect-[2/3] rounded-lg border-2 border-violet-500/20 overflow-hidden bg-card hover:border-violet-500/50 transition-colors">
        {item.series?.cover_url ? (
          item.series.cover_url.toLowerCase().split("?")[0].endsWith(".mp4") ? (
            <video
              src={item.series.cover_url}
              loop
              muted
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={item.series.cover_url}
              alt={item.series.title}
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="text-white text-sm font-medium line-clamp-2">
              {item.series?.title}
            </p>
          </div>
        </div>
        <div className="absolute top-2 left-2">
          <Badge className="bg-violet-600 text-white">#{index + 1}</Badge>
        </div>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
          <Button
            size="icon"
            variant="secondary"
            className="h-7 w-7 cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-7 w-7"
            onClick={onMoveUp}
            disabled={index === 0}
            title="Move up"
          >
            ↑
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-7 w-7"
            onClick={onMoveDown}
            disabled={index === totalItems - 1}
            title="Move down"
          >
            ↓
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="icon"
                variant="destructive"
                className="h-7 w-7"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove from carousel?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove "{item.series?.title}" from the homepage carousel.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onRemove}>
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

function BannerForm({ form, setForm, series }: { form: BannerForm; setForm: (form: BannerForm) => void; series: any[] }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Title *</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Banner title"
        />
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Banner description..."
        />
      </div>

      <div>
        <Label>Image URL</Label>
        <Input
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Link URL</Label>
          <Input
            value={form.link_url}
            onChange={(e) => setForm({ ...form, link_url: e.target.value })}
            placeholder="/title/slug"
          />
        </div>

        <div>
          <Label>Link Text</Label>
          <Input
            value={form.link_text}
            onChange={(e) => setForm({ ...form, link_text: e.target.value })}
            placeholder="Learn More"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Position</Label>
          <Select value={form.position} onValueChange={(v) => setForm({ ...form, position: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hero">Hero (Main carousel)</SelectItem>
              <SelectItem value="featured">Featured (Below hero)</SelectItem>
              <SelectItem value="sidebar">Sidebar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Priority</Label>
          <Input
            type="number"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
            placeholder="0"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Background Color</Label>
          <Input
            type="color"
            value={form.background_color}
            onChange={(e) => setForm({ ...form, background_color: e.target.value })}
          />
        </div>

        <div>
          <Label>Text Color</Label>
          <Input
            type="color"
            value={form.text_color}
            onChange={(e) => setForm({ ...form, text_color: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label>Target Title (Optional)</Label>
        <Select value={form.target_series_id} onValueChange={(v) => setForm({ ...form, target_series_id: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select a title..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {series.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Starts At</Label>
          <Input
            type="datetime-local"
            value={form.starts_at}
            onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
          />
        </div>

        <div>
          <Label>Expires At (Optional)</Label>
          <Input
            type="datetime-local"
            value={form.expires_at}
            onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
