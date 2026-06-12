"use client";

import { Link, useNavigate } from "@/lib/router-compat";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Plus, Pencil, Trash2, Tag as TagIcon, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";


function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

type TagForm = {
  name: string;
  description: string;
  color: string;
  icon: string;
};

type GenreForm = {
  name: string;
};

const emptyTagForm: TagForm = {
  name: "",
  description: "",
  color: "#8B5CF6",
  icon: "",
};

const emptyGenreForm: GenreForm = {
  name: "",
};

export default function AdminTags() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<any | null>(null);
  const [form, setForm] = useState<TagForm>(emptyTagForm);
  const [genreOpen, setGenreOpen] = useState(false);
  const [editingGenre, setEditingGenre] = useState<any | null>(null);
  const [genreForm, setGenreForm] = useState<GenreForm>(emptyGenreForm);

  const genres = useQuery({
    queryKey: ["admin", "genres"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("genres")
        .select("*")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const tags = useQuery({
    queryKey: ["admin", "tags"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("tags")
        .select("*")
        .order("usage_count", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const createGenre = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("genres").insert({
        name: genreForm.name,
        slug: slugify(genreForm.name),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Genre created");
      setGenreOpen(false);
      setGenreForm(emptyGenreForm);
      qc.invalidateQueries({ queryKey: ["admin", "genres"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateGenre = useMutation({
    mutationFn: async () => {
      if (!editingGenre) throw new Error("No genre selected");
      const { error } = await supabase
        .from("genres")
        .update({
          name: genreForm.name,
          slug: slugify(genreForm.name),
        })
        .eq("id", editingGenre.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Genre updated");
      setEditingGenre(null);
      setGenreForm(emptyGenreForm);
      qc.invalidateQueries({ queryKey: ["admin", "genres"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteGenre = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("genres").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Genre deleted");
      qc.invalidateQueries({ queryKey: ["admin", "genres"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createTag = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("tags").insert({
        name: form.name,
        slug: slugify(form.name),
        description: form.description || null,
        color: form.color,
        icon: form.icon || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tag created");
      setOpen(false);
      setForm(emptyTagForm);
      qc.invalidateQueries({ queryKey: ["admin", "tags"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateTag = useMutation({
    mutationFn: async () => {
      if (!editingTag) throw new Error("No tag selected");
      const { error } = await (supabase as any)
        .from("tags")
        .update({
          name: form.name,
          slug: slugify(form.name),
          description: form.description || null,
          color: form.color,
          icon: form.icon || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingTag.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tag updated");
      setEditingTag(null);
      setForm(emptyTagForm);
      qc.invalidateQueries({ queryKey: ["admin", "tags"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteTag = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("tags").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tag deleted");
      qc.invalidateQueries({ queryKey: ["admin", "tags"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const moveTagsToGenres = useMutation({
    mutationFn: async () => {
      const { data: tagRows, error: tagsError } = await (supabase as any)
        .from("tags")
        .select("id,name,slug");
      if (tagsError) throw tagsError;
      const sourceTags = tagRows || [];
      if (sourceTags.length === 0) return 0;

      const tagToGenreId = new Map<string, string>();
      for (const tag of sourceTags) {
        const { data: genre, error } = await supabase
          .from("genres")
          .upsert({ name: tag.name, slug: tag.slug }, { onConflict: "slug" } as any)
          .select("id")
          .single();
        if (error) throw error;
        if (genre?.id) tagToGenreId.set(tag.id, genre.id);
      }

      const { data: links, error: linksError } = await (supabase as any)
        .from("series_tags")
        .select("series_id,tag_id")
        .in("tag_id", sourceTags.map((tag: any) => tag.id));
      if (linksError) throw linksError;

      const genreLinks = (links || [])
        .map((link: any) => ({
          series_id: link.series_id,
          genre_id: tagToGenreId.get(link.tag_id),
        }))
        .filter((link: any) => link.genre_id);

      if (genreLinks.length > 0) {
        const { error } = await supabase
          .from("series_genres")
          .upsert(genreLinks, { onConflict: "series_id,genre_id" } as any);
        if (error) throw error;
      }

      const sourceTagIds = sourceTags.map((tag: any) => tag.id);
      const { error: deleteLinksError } = await (supabase as any)
        .from("series_tags")
        .delete()
        .in("tag_id", sourceTagIds);
      if (deleteLinksError) throw deleteLinksError;

      const { error: deleteTagsError } = await (supabase as any)
        .from("tags")
        .delete()
        .in("id", sourceTagIds);
      if (deleteTagsError) throw deleteTagsError;

      return sourceTags.length;
    },
    onSuccess: (count) => {
      toast.success(count ? `Moved ${count} tags to genres` : "No tags to move");
      qc.invalidateQueries({ queryKey: ["admin", "genres"] });
      qc.invalidateQueries({ queryKey: ["admin", "tags"] });
      qc.invalidateQueries({ queryKey: ["admin", "series"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const predefinedColors = [
    "#EF4444", "#F97316", "#F59E0B", "#10B981", "#14B8A6",
    "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7", "#EC4899",
    "#000000", "#6B7280", "#DC2626", "#059669", "#2563EB",
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Genres & Tags</h1>
          <p className="text-sm text-muted-foreground">Create and manage title genres and descriptive tags</p>
        </div>
        <div className="flex gap-2">
          {(tags.data || []).length > 0 && (
            <Button
              variant="outline"
              onClick={() => moveTagsToGenres.mutate()}
              disabled={moveTagsToGenres.isPending}
            >
              <ArrowRight className="mr-1 h-4 w-4" />
              {moveTagsToGenres.isPending ? "Moving..." : "Move Tags to Genres"}
            </Button>
          )}
          <Dialog open={genreOpen} onOpenChange={setGenreOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-1 h-4 w-4" />
                New Genre
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Genre</DialogTitle>
              </DialogHeader>
              <GenreFormFields form={genreForm} setForm={setGenreForm} />
              <DialogFooter>
                <Button onClick={() => createGenre.mutate()} disabled={!genreForm.name || createGenre.isPending}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1 h-4 w-4" />
                New Tag
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Tag</DialogTitle>
              </DialogHeader>
              <TagFormFields form={form} setForm={setForm} predefinedColors={predefinedColors} />
              <DialogFooter>
                <Button onClick={() => createTag.mutate()} disabled={!form.name || createTag.isPending}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <h2 className="text-lg font-semibold">Genres</h2>
          </div>
          {genres.isLoading && <p className="text-sm text-muted-foreground">Loading genres...</p>}
          {!genres.isLoading && (genres.data || []).length === 0 && (
            <p className="text-sm text-muted-foreground">No genres yet. Move current tags into genres or create a new genre.</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(genres.data || []).map((genre) => (
              <div key={genre.id} className="rounded-lg border border-border/40 bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{genre.name}</h3>
                    <p className="text-xs text-muted-foreground">{genre.slug}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingGenre(genre);
                        setGenreForm({ name: genre.name });
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete "{genre.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the genre from all titles. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteGenre.mutate(genre.id)}>
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
        </section>

        <section className="pt-4">
        <div className="mb-3 flex items-center gap-2">
          <TagIcon className="h-4 w-4 text-violet-500" />
          <h2 className="text-lg font-semibold">Tags</h2>
        </div>
        {tags.isLoading && <p className="text-sm text-muted-foreground">Loading tags...</p>}
        {!tags.isLoading && (tags.data || []).length === 0 && (
          <p className="text-sm text-muted-foreground">No tags yet. Tags are separate from genres and can be added later.</p>
        )}
        
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(tags.data || []).map((tag: any) => (
            <div
              key={tag.id}
              className="group relative overflow-hidden rounded-lg border border-border/40 bg-card p-4 transition-all hover:border-primary/50"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {tag.icon && <span className="text-2xl">{tag.icon}</span>}
                  <div>
                    <h3 className="font-semibold" style={{ color: tag.color }}>
                      {tag.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Used {tag.usage_count} times
                    </p>
                  </div>
                </div>
              </div>
              
              {tag.description && (
                <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                  {tag.description}
                </p>
              )}

              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  style={{
                    borderColor: tag.color,
                    backgroundColor: `${tag.color}10`,
                    color: tag.color,
                  }}
                >
                  {tag.slug}
                </Badge>
                <div className="ml-auto flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingTag(tag);
                      setForm({
                        name: tag.name,
                        description: tag.description || "",
                        color: tag.color,
                        icon: tag.icon || "",
                      });
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{tag.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the tag from all titles. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteTag.mutate(tag.id)}>
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
        </section>
      </div>

      <Dialog open={!!editingGenre} onOpenChange={(v) => { if (!v) { setEditingGenre(null); setGenreForm(emptyGenreForm); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Genre</DialogTitle>
          </DialogHeader>
          <GenreFormFields form={genreForm} setForm={setGenreForm} />
          <DialogFooter>
            <Button onClick={() => updateGenre.mutate()} disabled={!genreForm.name || updateGenre.isPending}>
              {updateGenre.isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingTag} onOpenChange={(v) => { if (!v) { setEditingTag(null); setForm(emptyTagForm); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
          </DialogHeader>
          <TagFormFields form={form} setForm={setForm} predefinedColors={predefinedColors} />
          <DialogFooter>
            <Button onClick={() => updateTag.mutate()} disabled={!form.name || updateTag.isPending}>
              {updateTag.isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TagFormFields({ 
  form, 
  setForm, 
  predefinedColors 
}: { 
  form: TagForm; 
  setForm: (form: TagForm) => void;
  predefinedColors: string[];
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Tag Name *</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g., Revenge, Time Travel, Monsters"
        />
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Brief description of this tag..."
        />
      </div>

      <div>
        <Label>Icon/Emoji (Optional)</Label>
        <Input
          value={form.icon}
          onChange={(e) => setForm({ ...form, icon: e.target.value })}
          placeholder="e.g., ⚔️ 🎭 ✨"
          maxLength={2}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Add an emoji or leave empty
        </p>
      </div>

      <div>
        <Label>Color</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {predefinedColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setForm({ ...form, color })}
              className={`h-8 w-8 rounded-full border-2 transition-all hover:scale-110 ${
                form.color === color ? "border-foreground ring-2 ring-offset-2" : "border-border"
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="h-10 w-20"
          />
          <Input
            type="text"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            placeholder="#8B5CF6"
            className="flex-1 font-mono text-sm"
          />
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-lg border border-border/40 bg-secondary/20 p-3">
        <Label className="text-xs text-muted-foreground">Preview</Label>
        <div className="mt-2 flex items-center gap-2">
          <Badge
            variant="outline"
            className="gap-1"
            style={{
              borderColor: form.color,
              backgroundColor: `${form.color}15`,
              color: form.color,
            }}
          >
            {form.icon && <span>{form.icon}</span>}
            {form.name || "Tag Name"}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function GenreFormFields({
  form,
  setForm,
}: {
  form: GenreForm;
  setForm: (form: GenreForm) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Genre Name *</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g., Action, Romance, Fantasy"
        />
      </div>
      <div className="rounded-lg border border-border/40 bg-secondary/20 p-3">
        <Label className="text-xs text-muted-foreground">Slug</Label>
        <p className="mt-1 text-sm font-medium">{form.name ? slugify(form.name) : "genre-slug"}</p>
      </div>
    </div>
  );
}
