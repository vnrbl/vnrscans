import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/series")({
  head: () => ({ meta: [{ title: "Admin · Series" }] }),
  component: AdminSeries,
});

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function AdminSeries() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["admin", "series"],
    queryFn: async () => {
      const { data, error } = await supabase.from("series").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", type: "manga", status: "ongoing", author: "", description: "", cover_url: "" });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("series").insert({
        title: form.title,
        slug: slugify(form.title),
        type: form.type as any,
        status: form.status as any,
        author: form.author || null,
        description: form.description || null,
        cover_url: form.cover_url || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Series created");
      setOpen(false);
      setForm({ title: "", type: "manga", status: "ongoing", author: "", description: "", cover_url: "" });
      qc.invalidateQueries({ queryKey: ["admin", "series"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleHidden = useMutation({
    mutationFn: async (s: any) => {
      const { error } = await supabase.from("series").update({ is_hidden: !s.is_hidden }).eq("id", s.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "series"] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("series").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Series deleted"); qc.invalidateQueries({ queryKey: ["admin", "series"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Series</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" />New series</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create series</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["manga","manhwa","manhua","novel"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["ongoing","completed","hiatus","cancelled"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Author</Label><Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></div>
              <div><Label>Cover URL</Label><Input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button onClick={() => create.mutate()} disabled={!form.title || create.isPending}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 divide-y divide-border/40 rounded-lg border border-border/40 bg-card/50">
        {list.isLoading && <div className="p-6 text-sm text-muted-foreground">Loading…</div>}
        {(list.data ?? []).map((s) => (
          <div key={s.id} className="flex items-center gap-3 p-3">
            {s.cover_url ? <img src={s.cover_url} alt="" className="h-14 w-10 rounded object-cover" /> : <div className="h-14 w-10 rounded bg-secondary" />}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link to="/series/$slug" params={{ slug: s.slug }} className="truncate font-medium hover:text-primary">{s.title}</Link>
                <Badge variant="outline" className="uppercase">{s.type}</Badge>
                {s.is_hidden && <Badge variant="secondary">Hidden</Badge>}
              </div>
              <div className="text-xs text-muted-foreground">{s.status} · {Number(s.rating_average || 0).toFixed(1)}★ · {s.view_count} views</div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => toggleHidden.mutate(s)} title={s.is_hidden ? "Show" : "Hide"}>
              {s.is_hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete "{s.title}"?</AlertDialogTitle>
                  <AlertDialogDescription>This also removes all chapters and pages. This cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => del.mutate(s.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
      </div>
    </div>
  );
}