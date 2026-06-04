import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, ShieldAlert, Award, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  BadgeIcon, 
  emojiToIconName, 
  enhanceBadge, 
  parseBadgeDescription,
  difficultyColors,
  type ProfileBadgeRow 
} from "@/lib/profileBadges";

export const Route = createFileRoute("/_authenticated/admin/badges")({
  head: () => ({ meta: [{ title: "Admin · Realms & Badges" }] }),
  component: AdminBadges,
});

type BadgeForm = {
  name: string;
  description: string;
  icon: string;
  category: "Title" | "Badge" | "Tag";
  difficulty: "Easy" | "Moderate" | "Hard" | "Godly";
  requirement_type: string;
  requirement_value: string;
  badge_color: string;
  is_active: boolean;
};

const emptyForm: BadgeForm = {
  name: "",
  description: "",
  icon: "🏅",
  category: "Badge",
  difficulty: "Easy",
  requirement_type: "chapters_read",
  requirement_value: "100",
  badge_color: "#8B5CF6",
  is_active: true,
};

function AdminBadges() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<any | null>(null);
  const [form, setForm] = useState<BadgeForm>(emptyForm);

  const availableBadges = useQuery({
    queryKey: ["admin", "profile-badges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_badges" as any)
        .select("*")
        .order("name");
      if (error) {
        console.error("Error fetching badges:", error);
        throw error;
      }
      return (data || []).map((b: any) => {
        const enhanced = enhanceBadge(b as ProfileBadgeRow);
        const parsed = parseBadgeDescription(b.description);
        
        return {
          ...b,
          name: enhanced.name,
          icon: enhanced.icon,
          badge_color: enhanced.badge_color,
          category: enhanced.category,
          difficulty: enhanced.difficulty,
          actualDescription: enhanced.description,
        };
      });
    },
  });

  const createBadge = useMutation({
    mutationFn: async () => {
      const encodedDescription = JSON.stringify({
        description: form.description.trim(),
        category: form.category,
        difficulty: form.difficulty,
      });

      const { error } = await supabase.from("profile_badges" as any).insert({
        name: form.name.trim(),
        description: encodedDescription,
        icon: form.icon.trim(),
        requirement_type: form.requirement_type,
        requirement_value: parseInt(form.requirement_value, 10) || 0,
        badge_color: form.badge_color,
        is_active: form.is_active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Badge/Title created successfully");
      setOpen(false);
      setForm(emptyForm);
      qc.invalidateQueries({ queryKey: ["admin", "profile-badges"] });
      qc.invalidateQueries({ queryKey: ["profile-badges"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateBadge = useMutation({
    mutationFn: async () => {
      if (!editingBadge) throw new Error("No badge selected");
      const encodedDescription = JSON.stringify({
        description: form.description.trim(),
        category: form.category,
        difficulty: form.difficulty,
      });

      const { error } = await supabase
        .from("profile_badges" as any)
        .update({
          name: form.name.trim(),
          description: encodedDescription,
          icon: form.icon.trim(),
          requirement_type: form.requirement_type,
          requirement_value: parseInt(form.requirement_value, 10) || 0,
          badge_color: form.badge_color,
          is_active: form.is_active,
        })
        .eq("id", editingBadge.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Badge/Title updated successfully");
      setEditingBadge(null);
      setForm(emptyForm);
      qc.invalidateQueries({ queryKey: ["admin", "profile-badges"] });
      qc.invalidateQueries({ queryKey: ["profile-badges"] });
      qc.invalidateQueries({ queryKey: ["user-badges"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteBadge = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("profile_badges" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Badge/Title deleted successfully");
      qc.invalidateQueries({ queryKey: ["admin", "profile-badges"] });
      qc.invalidateQueries({ queryKey: ["profile-badges"] });
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
          <h1 className="text-2xl font-bold tracking-tight">Realms & Badges Manager</h1>
          <p className="text-sm text-muted-foreground">Create and manage user name titles, achievements, and badges</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              New Badge/Title
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Realm Title or Badge</DialogTitle>
            </DialogHeader>
            <BadgeFormFields form={form} setForm={setForm} predefinedColors={predefinedColors} />
            <DialogFooter>
              <Button onClick={() => createBadge.mutate()} disabled={!form.name || createBadge.isPending}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6">
        {availableBadges.isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(availableBadges.data || []).map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-border/40 bg-card p-4 transition-all hover:border-violet-500/40 relative overflow-hidden"
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-lg p-2.5"
                  style={{
                    backgroundColor: `${item.badge_color}20`,
                    color: item.badge_color,
                  }}
                >
                  <BadgeIcon icon={item.icon} className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                    {!item.is_active && (
                      <Badge variant="outline" className="text-2xs text-muted-foreground">Inactive</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {item.actualDescription}
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span className={`text-[9px] px-1 py-0.1 rounded border font-bold ${difficultyColors[item.difficulty as keyof typeof difficultyColors]}`}>
                      {item.difficulty}
                    </span>
                    <span className="text-[9px] px-1 py-0.1 rounded border bg-muted text-muted-foreground font-semibold">
                      {item.category}
                    </span>
                  </div>
                  <div className="mt-2 text-2xs text-muted-foreground space-y-0.5">
                    <p>Requirement: <span className="font-mono">{item.requirement_type.replace(/_/g, " ")}</span> ({item.requirement_value})</p>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingBadge(item);
                      setForm({
                        name: item.name,
                        description: item.actualDescription,
                        icon: item.icon,
                        category: item.category,
                        difficulty: item.difficulty,
                        requirement_type: item.requirement_type,
                        requirement_value: String(item.requirement_value),
                        badge_color: item.badge_color,
                        is_active: item.is_active,
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
                        <AlertDialogTitle>Delete "{item.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this title/badge from the system. Users who currently have it equipped will lose it.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteBadge.mutate(item.id)}>
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
      </div>

      <Dialog
        open={!!editingBadge}
        onOpenChange={(v) => {
          if (!v) {
            setEditingBadge(null);
            setForm(emptyForm);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Realm Title or Badge</DialogTitle>
          </DialogHeader>
          <BadgeFormFields form={form} setForm={setForm} predefinedColors={predefinedColors} />
          <DialogFooter>
            <Button onClick={() => updateBadge.mutate()} disabled={!form.name || updateBadge.isPending}>
              {updateBadge.isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BadgeFormFields({
  form,
  setForm,
  predefinedColors,
}: {
  form: BadgeForm;
  setForm: (form: BadgeForm) => void;
  predefinedColors: string[];
}) {
  const iconList = Object.keys(emojiToIconName);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Name *</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Asura Demon Emperor"
          />
        </div>

        <div>
          <Label>Icon (Emoji key mapping) *</Label>
          <Select value={form.icon} onValueChange={(v) => setForm({ ...form, icon: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select icon style" />
            </SelectTrigger>
            <SelectContent>
              {iconList.map((emoji) => (
                <SelectItem key={emoji} value={emoji}>
                  <div className="flex items-center gap-2">
                    <BadgeIcon icon={emoji} className="h-4 w-4" />
                    <span>{emojiToIconName[emoji]} ({emoji})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Category *</Label>
          <Select
            value={form.category}
            onValueChange={(v: any) => setForm({ ...form, category: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Title">Title (Name Title)</SelectItem>
              <SelectItem value="Badge">Badge (Icon Badge)</SelectItem>
              <SelectItem value="Tag">Tag (Name Tag)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Difficulty / Rarity *</Label>
          <Select
            value={form.difficulty}
            onValueChange={(v: any) => setForm({ ...form, difficulty: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Easy">Easy</SelectItem>
              <SelectItem value="Moderate">Moderate</SelectItem>
              <SelectItem value="Hard">Hard</SelectItem>
              <SelectItem value="Godly">Godly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Description *</Label>
        <Textarea
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Unlock criteria description..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Requirement Type *</Label>
          <Select
            value={form.requirement_type}
            onValueChange={(v) => setForm({ ...form, requirement_type: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chapters_read">Chapters Read</SelectItem>
              <SelectItem value="reading_streak">Reading Streak Days</SelectItem>
              <SelectItem value="comments_posted">Comments Posted</SelectItem>
              <SelectItem value="ratings_given">Ratings Given</SelectItem>
              <SelectItem value="series_followed">Series Followed</SelectItem>
              <SelectItem value="series_completed">Series Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Requirement Target Value *</Label>
          <Input
            type="number"
            value={form.requirement_value}
            onChange={(e) => setForm({ ...form, requirement_value: e.target.value })}
            placeholder="100"
          />
        </div>
      </div>

      <div>
        <Label>Badge/Title Accent Color</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {predefinedColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setForm({ ...form, badge_color: color })}
              className={`h-7 w-7 rounded-full border transition-all hover:scale-110 ${
                form.badge_color === color ? "border-foreground ring-2 ring-offset-2" : "border-border"
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Input
            type="color"
            value={form.badge_color}
            onChange={(e) => setForm({ ...form, badge_color: e.target.value })}
            className="h-10 w-20"
          />
          <Input
            type="text"
            value={form.badge_color}
            onChange={(e) => setForm({ ...form, badge_color: e.target.value })}
            placeholder="#8B5CF6"
            className="flex-1 font-mono text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="is_active"
          checked={form.is_active}
          onCheckedChange={(v) => setForm({ ...form, is_active: !!v })}
        />
        <Label htmlFor="is_active" className="cursor-pointer font-normal">
          Active (visible to users and obtainable)
        </Label>
      </div>

      <div className="rounded-lg border border-border/40 bg-secondary/15 p-3">
        <Label className="text-xs text-muted-foreground">Preview Card</Label>
        <div className="mt-3 flex items-center gap-3 bg-card p-3 rounded-lg border border-border/50">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-lg p-2.5"
            style={{
              backgroundColor: `${form.badge_color}20`,
              color: form.badge_color,
            }}
          >
            <BadgeIcon icon={form.icon} className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">{form.name || "Realms & Badges Name"}</h4>
            <p className="text-[10px] text-muted-foreground mt-0.5">{form.description || "Unlock criteria description..."}</p>
            <div className="flex gap-1.5 mt-1.5">
              <span className="text-[8px] px-1 py-0.1 rounded border font-bold bg-violet-500/10 text-violet-500 border-violet-500/30">
                {form.difficulty}
              </span>
              <span className="text-[8px] px-1 py-0.1 rounded border font-semibold bg-muted text-muted-foreground">
                {form.category}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
