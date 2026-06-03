import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/adminLog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/banners")({
  head: () => ({ meta: [{ title: "Admin · Banners" }] }),
  component: AdminBanners,
});

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

function AdminBanners() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [form, setForm] = useState<BannerForm>(emptyForm);

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

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Banners & Carousel</h1>
          <p className="text-sm text-muted-foreground">Manage homepage banners and promotional content</p>
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
                    <img 
                      src={item.image_url} 
                      alt={item.title} 
                      className="h-full w-full object-cover" 
                    />
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
                    <span>Starts: {new Date(item.starts_at).toLocaleDateString()}</span>
                    {item.expires_at && <span>Expires: {new Date(item.expires_at).toLocaleDateString()}</span>}
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
                      background_color: item.background_color,
                      text_color: item.text_color,
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

      <div className="grid grid-cols-2 gap-3">
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

      <div className="grid grid-cols-2 gap-3">
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

      <div className="grid grid-cols-2 gap-3">
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

      <div className="grid grid-cols-2 gap-3">
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
