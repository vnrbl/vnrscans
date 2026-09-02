"use client";

import { Link, useNavigate } from "@/lib/router-compat";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Tag as TagIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/adminLog";
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

const emptyTagForm: TagForm = {
  name: "",
  description: "",
  color: "#8B5CF6",
  icon: "",
};

export default function AdminTags() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<any | null>(null);
  const [form, setForm] = useState<TagForm>(emptyTagForm);

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
      await logAdminAction("create", "tag", undefined, { name: form.name });
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
      await logAdminAction("update", "tag", editingTag.id, { name: form.name });
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
      await logAdminAction("delete", "tag", id);
    },
    onSuccess: () => {
      toast.success("Tag deleted");
      qc.invalidateQueries({ queryKey: ["admin", "tags"] });
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
          <h1 className="text-2xl font-bold tracking-tight">Tags</h1>
          <p className="text-sm text-muted-foreground">Create and manage descriptive tags for titles</p>
        </div>
        <div className="flex gap-2">
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
