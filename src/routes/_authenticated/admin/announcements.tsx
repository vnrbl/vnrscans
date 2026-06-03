import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/adminLog";
import { getCurrentProfileId } from "@/lib/profileId";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_authenticated/admin/announcements")({
  head: () => ({ meta: [{ title: "Admin · Announcements" }] }),
  component: AdminAnnouncements,
});

type AnnouncementForm = {
  title: string;
  content: string;
  type: string;
  priority: string;
  show_banner: boolean;
  banner_color: string;
  icon: string;
  target_audience: string;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
};

const emptyForm: AnnouncementForm = {
  title: "",
  content: "",
  type: "info",
  priority: "0",
  show_banner: true,
  banner_color: "#8B5CF6",
  icon: "📢",
  target_audience: "all",
  starts_at: "",
  expires_at: "",
  is_active: true,
};

function AdminAnnouncements() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<AnnouncementForm>(emptyForm);

  const list = useQuery({
    queryKey: ["admin", "announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const payload = {
        title: form.title,
        content: form.content,
        type: form.type,
        priority: parseInt(form.priority, 10),
        show_banner: form.show_banner,
        banner_color: form.banner_color,
        icon: form.icon || null,
        target_audience: form.target_audience,
        starts_at: form.starts_at || new Date().toISOString(),
        expires_at: form.expires_at || null,
        is_active: form.is_active,
        updated_at: new Date().toISOString(),
      };

      if (editing?.id) {
        const { error } = await supabase.from("announcements").update(payload).eq("id", editing.id);
        if (error) throw error;
        await logAdminAction("update", "announcement", String(editing.id), { title: form.title });
      } else {
        const profileId = await getCurrentProfileId();
        const createdByCandidates = [
          auth.user?.id,
          profileId,
        ].filter((id): id is string => Boolean(id));

        let data: { id: string } | null = null;
        let lastError: Error | null = null;

        for (const createdBy of [...createdByCandidates, null]) {
          const insertPayload = createdBy ? { ...payload, created_by: createdBy } : payload;
          const result = await supabase
            .from("announcements")
            .insert(insertPayload)
            .select("id")
            .single();
          if (!result.error) {
            data = result.data;
            lastError = null;
            break;
          }
          if (result.error.code === "23503") {
            lastError = result.error;
            continue;
          }
          throw result.error;
        }
        if (lastError || !data) throw lastError ?? new Error("Failed to create announcement");
        await logAdminAction("create", "announcement", data!.id, { title: form.title });
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Announcement updated" : "Announcement created");
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      qc.invalidateQueries({ queryKey: ["admin", "announcements"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async (item: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("announcements")
        .update({ is_active: !item.is_active, updated_at: new Date().toISOString() })
        .eq("id", item.id);
      if (error) throw error;
      await logAdminAction(item.is_active ? "deactivate" : "activate", "announcement", item.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "announcements"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
      await logAdminAction("delete", "announcement", id);
    },
    onSuccess: () => {
      toast.success("Announcement deleted");
      qc.invalidateQueries({ queryKey: ["admin", "announcements"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (item: Record<string, unknown>) => {
    setEditing(item);
    setForm({
      title: String(item.title ?? ""),
      content: String(item.content ?? ""),
      type: String(item.type ?? "info"),
      priority: String(item.priority ?? 0),
      show_banner: Boolean(item.show_banner),
      banner_color: String(item.banner_color ?? "#8B5CF6"),
      icon: String(item.icon ?? ""),
      target_audience: String(item.target_audience ?? "all"),
      starts_at: item.starts_at ? new Date(String(item.starts_at)).toISOString().slice(0, 16) : "",
      expires_at: item.expires_at ? new Date(String(item.expires_at)).toISOString().slice(0, 16) : "",
      is_active: Boolean(item.is_active),
    });
  };

  const typeColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    info: "default",
    warning: "secondary",
    success: "outline",
    error: "destructive",
    event: "default",
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="text-sm text-muted-foreground">Site-wide banners, maintenance notices, and events</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditing(null); setForm(emptyForm); }}>
              <Plus className="mr-1 h-4 w-4" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Announcement</DialogTitle>
            </DialogHeader>
            <AnnouncementFormFields form={form} setForm={setForm} />
            <DialogFooter>
              <Button onClick={() => save.mutate()} disabled={!form.title || !form.content || save.isPending}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 space-y-3">
        {list.isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {(list.data ?? []).length === 0 && !list.isLoading && (
          <div className="rounded-lg border border-border/40 bg-card p-8 text-center">
            <Megaphone className="mx-auto h-10 w-10 text-muted-foreground opacity-50" />
            <p className="mt-2 text-sm text-muted-foreground">No announcements yet</p>
          </div>
        )}
        {(list.data ?? []).map((item) => (
          <div key={item.id} className="rounded-lg border border-border/40 bg-card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {item.icon && <span>{item.icon}</span>}
                  <h3 className="font-semibold">{item.title}</h3>
                  <Badge variant={typeColors[item.type as string] ?? "outline"}>{item.type}</Badge>
                  {!item.is_active && <Badge variant="outline">Inactive</Badge>}
                  <Badge variant="secondary">Priority {item.priority}</Badge>
                  <Badge variant="outline">{item.target_audience}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{item.content}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {item.starts_at && `From ${new Date(item.starts_at).toLocaleString()}`}
                  {item.expires_at && ` · Until ${new Date(item.expires_at).toLocaleString()}`}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" onClick={() => toggleActive.mutate(item)}>
                  {item.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
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
                      <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
                      <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove.mutate(item.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(v) => { if (!v) { setEditing(null); setForm(emptyForm); } }}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
          </DialogHeader>
          <AnnouncementFormFields form={form} setForm={setForm} />
          <DialogFooter>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AnnouncementFormFields({
  form,
  setForm,
}: {
  form: AnnouncementForm;
  setForm: (f: AnnouncementForm) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Title *</Label>
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </div>
      <div>
        <Label>Content *</Label>
        <Textarea rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Type</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="event">Event</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Priority</Label>
          <Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Target audience</Label>
          <Select value={form.target_audience} onValueChange={(v) => setForm({ ...form, target_audience: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All users</SelectItem>
              <SelectItem value="vip">VIP only</SelectItem>
              <SelectItem value="new_users">New users (7 days)</SelectItem>
              <SelectItem value="active_users">Active readers</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Icon (emoji)</Label>
          <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="📢" />
        </div>
      </div>
      <div>
        <Label>Banner color</Label>
        <Input type="color" value={form.banner_color} onChange={(e) => setForm({ ...form, banner_color: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Starts at</Label>
          <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
        </div>
        <div>
          <Label>Expires at (optional)</Label>
          <Input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="show_banner" checked={form.show_banner} onCheckedChange={(v) => setForm({ ...form, show_banner: !!v })} />
        <Label htmlFor="show_banner" className="cursor-pointer font-normal">Show as site banner</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="is_active" checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: !!v })} />
        <Label htmlFor="is_active" className="cursor-pointer font-normal">Active</Label>
      </div>
    </div>
  );
}
