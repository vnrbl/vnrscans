import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Eye, EyeOff, Upload, ExternalLink, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin/series")({
  head: () => ({ meta: [{ title: "Admin · Series" }] }),
  component: AdminSeries,
});

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function AdminSeries() {
  const qc = useQueryClient();
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  
  const list = useQuery({
    queryKey: ["admin", "series"],
    queryFn: async () => {
      const { data, error } = await supabase.from("series").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ 
    title: "", 
    type: "manga", 
    status: "ongoing", 
    author: "", 
    artist: "",
    description: "", 
    cover_url: "",
    tags: "",
    release_year: "",
    alternative_titles: "",
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("series").insert({
        title: form.title,
        slug: slugify(form.title),
        type: form.type as any,
        status: form.status as any,
        author: form.author || null,
        artist: form.artist || null,
        description: form.description || null,
        cover_url: form.cover_url || null,
        tags: form.tags ? form.tags.split(",").map(t => t.trim()) : [],
        release_year: form.release_year ? parseInt(form.release_year) : null,
        alternative_titles: form.alternative_titles ? form.alternative_titles.split(",").map(t => t.trim()) : [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Series created");
      setOpen(false);
      setForm({ title: "", type: "manga", status: "ongoing", author: "", artist: "", description: "", cover_url: "", tags: "", release_year: "", alternative_titles: "" });
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

  if (selectedSeries) {
    return <ChapterManager seriesId={selectedSeries} onBack={() => setSelectedSeries(null)} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Series</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" />New series</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader><DialogTitle>Create series</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Enter series title" /></div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["manga","manhwa","manhua","novel"].map((t) => <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["ongoing","completed","hiatus","cancelled"].map((t) => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><Label>Author</Label><Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Author name" /></div>
                <div><Label>Artist</Label><Input value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })} placeholder="Artist name" /></div>
              </div>

              <div><Label>Release Year</Label><Input type="number" value={form.release_year} onChange={(e) => setForm({ ...form, release_year: e.target.value })} placeholder="2024" /></div>
              
              <div><Label>Cover URL</Label><Input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="https://example.com/cover.jpg" /></div>
              
              <div><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="action, fantasy, romance" /></div>
              
              <div><Label>Alternative Titles (comma separated)</Label><Input value={form.alternative_titles} onChange={(e) => setForm({ ...form, alternative_titles: e.target.value })} placeholder="Alt title 1, Alt title 2" /></div>
              
              <div><Label>Description</Label><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Enter series description..." /></div>
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
            <Button variant="ghost" size="icon" onClick={() => setSelectedSeries(s.id)} title="Manage Chapters">
              <Upload className="h-4 w-4 text-violet-600" />
            </Button>
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

function ChapterManager({ seriesId, onBack }: { seriesId: string; onBack: () => void }) {
  const qc = useQueryClient();

  const series = useQuery({
    queryKey: ["admin", "series", seriesId],
    queryFn: async () => {
      const { data, error } = await supabase.from("series").select("*").eq("id", seriesId).single();
      if (error) throw error;
      return data;
    },
  });

  const chapters = useQuery({
    queryKey: ["admin", "chapters", seriesId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapters")
        .select("*")
        .eq("series_id", seriesId)
        .order("chapter_number", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ 
    chapter_number: "", 
    title: "", 
    image_urls: "",
    volume: "",
    release_date: "",
  });

  const create = useMutation({
    mutationFn: async () => {
      const chapterNum = parseFloat(form.chapter_number);
      if (isNaN(chapterNum)) throw new Error("Invalid chapter number");

      const { data: chapter, error: chapterError } = await supabase
        .from("chapters")
        .insert({
          series_id: seriesId,
          chapter_number: chapterNum,
          title: form.title || null,
          slug: `chapter-${chapterNum}${form.title ? `-${slugify(form.title)}` : ""}`,
          chapter_type: "image",
          status: "published",
        })
        .select()
        .single();

      if (chapterError) throw chapterError;

      const urls = form.image_urls.split("\n").filter((u) => u.trim());
      if (urls.length === 0) throw new Error("At least one image URL is required");

      const pages = urls.map((url, idx) => ({
        chapter_id: chapter.id,
        page_number: idx + 1,
        image_url: url.trim(),
      }));

      const { error: pagesError } = await supabase.from("chapter_pages").insert(pages);
      if (pagesError) throw pagesError;
    },
    onSuccess: () => {
      toast.success("Chapter uploaded");
      setOpen(false);
      setForm({ chapter_number: "", title: "", image_urls: "", volume: "", release_date: "" });
      qc.invalidateQueries({ queryKey: ["admin", "chapters", seriesId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteChapter = useMutation({
    mutationFn: async (chapterId: string) => {
      await supabase.from("chapter_pages").delete().eq("chapter_id", chapterId);
      const { error } = await supabase.from("chapters").delete().eq("id", chapterId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Chapter deleted");
      qc.invalidateQueries({ queryKey: ["admin", "chapters", seriesId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <X className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{series.data?.title}</h1>
          <p className="text-sm text-muted-foreground">Manage chapters</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Chapters ({chapters.data?.length || 0})</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-700">
              <Plus className="mr-1 h-4 w-4" />Upload Chapter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Upload Chapter from URLs</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Chapter Number *</Label>
                  <Input type="number" step="0.1" placeholder="1 or 1.5" value={form.chapter_number} onChange={(e) => setForm({ ...form, chapter_number: e.target.value })} />
                </div>
                <div>
                  <Label>Volume (Optional)</Label>
                  <Input type="number" placeholder="1" value={form.volume} onChange={(e) => setForm({ ...form, volume: e.target.value })} />
                </div>
                <div>
                  <Label>Release Date</Label>
                  <Input type="date" value={form.release_date} onChange={(e) => setForm({ ...form, release_date: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Chapter Title (Optional)</Label>
                <Input placeholder="e.g., The Beginning" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label>Image URLs (one per line) *</Label>
                <Textarea
                  rows={12}
                  placeholder="https://example.com/page1.jpg&#10;https://example.com/page2.jpg&#10;https://example.com/page3.jpg"
                  value={form.image_urls}
                  onChange={(e) => setForm({ ...form, image_urls: e.target.value })}
                  className="font-mono text-sm"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Paste image URLs from other scans, one URL per line. Supports direct image links from any source.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => create.mutate()} disabled={!form.chapter_number || !form.image_urls.trim() || create.isPending} className="bg-violet-600 hover:bg-violet-700">
                {create.isPending ? "Uploading..." : "Upload Chapter"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 divide-y divide-border/40 rounded-lg border border-border/40 bg-card/50">
        {chapters.isLoading && <div className="p-6 text-sm text-muted-foreground">Loading...</div>}
        {chapters.data?.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No chapters yet.</div>}
        {(chapters.data ?? []).map((ch) => (
          <div key={ch.id} className="flex items-center gap-3 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-violet-600/10 text-sm font-bold text-violet-600">{ch.chapter_number}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link to="/read/$chapterSlug" params={{ chapterSlug: ch.slug }} className="truncate font-medium hover:text-violet-600" target="_blank">
                  Chapter {ch.chapter_number}{ch.title && `: ${ch.title}`}
                </Link>
                <ExternalLink className="h-3 w-3" />
              </div>
              <div className="text-xs text-muted-foreground">{new Date(ch.created_at).toLocaleDateString()}</div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Chapter {ch.chapter_number}?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete the chapter and all its pages.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteChapter.mutate(ch.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
      </div>
    </div>
  );
}