import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Trophy, Zap, Star } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_authenticated/admin/gamification")({
  head: () => ({ meta: [{ title: "Admin · Gamification" }] }),
  component: AdminGamification,
});

type AchievementForm = {
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: string;
  xp_reward: string;
  badge_color: string;
  rarity: string;
  is_secret: boolean;
};

type XPEventForm = {
  name: string;
  description: string;
  xp_multiplier: string;
  starts_at: string;
  ends_at: string;
  applies_to: string;
};

const emptyAchievementForm: AchievementForm = {
  name: "",
  description: "",
  icon: "🏆",
  category: "general",
  requirement_type: "chapters_read",
  requirement_value: "1",
  xp_reward: "10",
  badge_color: "#8B5CF6",
  rarity: "common",
  is_secret: false,
};

const emptyXPEventForm: XPEventForm = {
  name: "",
  description: "",
  xp_multiplier: "2.0",
  starts_at: "",
  ends_at: "",
  applies_to: "all",
};

function AdminGamification() {
  const qc = useQueryClient();
  const [achievementDialog, setAchievementDialog] = useState(false);
  const [xpEventDialog, setXPEventDialog] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<any | null>(null);
  const [editingXPEvent, setEditingXPEvent] = useState<any | null>(null);
  const [achievementForm, setAchievementForm] = useState<AchievementForm>(emptyAchievementForm);
  const [xpEventForm, setXPEventForm] = useState<XPEventForm>(emptyXPEventForm);

  const achievements = useQuery({
    queryKey: ["admin", "achievements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*, unlocks:user_achievements(count)")
        .order("rarity")
        .order("requirement_value");
      if (error) {
        console.error("Error fetching achievements:", error);
        // Return empty array if table doesn't exist
        if (error.code === '42P01') {
          return [];
        }
        throw error;
      }
      return data || [];
    },
    retry: false,
    staleTime: 3 * 60 * 1000, // Cache for 3 minutes
  });

  const xpEvents = useQuery({
    queryKey: ["admin", "xp_events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("xp_events")
        .select("*")
        .order("starts_at", { ascending: false });
      if (error) {
        console.error("Error fetching XP events:", error);
        // Return empty array if table doesn't exist
        if (error.code === '42P01') {
          return [];
        }
        throw error;
      }
      return data || [];
    },
    retry: false,
    staleTime: 3 * 60 * 1000, // Cache for 3 minutes
  });

  const createAchievement = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("achievements").insert({
        name: achievementForm.name.trim(),
        description: achievementForm.description?.trim() || null,
        icon: achievementForm.icon || null,
        category: achievementForm.category,
        requirement_type: achievementForm.requirement_type,
        requirement_value: parseInt(achievementForm.requirement_value, 10) || 1,
        xp_reward: parseInt(achievementForm.xp_reward, 10) || 10,
        badge_color: achievementForm.badge_color,
        rarity: achievementForm.rarity,
        is_secret: achievementForm.is_secret,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Achievement created");
      setAchievementDialog(false);
      setAchievementForm(emptyAchievementForm);
      qc.invalidateQueries({ queryKey: ["admin", "achievements"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateAchievement = useMutation({
    mutationFn: async () => {
      if (!editingAchievement) throw new Error("No achievement selected");
      const { error } = await supabase
        .from("achievements")
        .update({
          name: achievementForm.name,
          description: achievementForm.description,
          icon: achievementForm.icon || null,
          category: achievementForm.category,
          requirement_type: achievementForm.requirement_type,
          requirement_value: parseInt(achievementForm.requirement_value),
          xp_reward: parseInt(achievementForm.xp_reward),
          badge_color: achievementForm.badge_color,
          rarity: achievementForm.rarity,
          is_secret: achievementForm.is_secret,
        })
        .eq("id", editingAchievement.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Achievement updated");
      setEditingAchievement(null);
      setAchievementForm(emptyAchievementForm);
      qc.invalidateQueries({ queryKey: ["admin", "achievements"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteAchievement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("achievements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Achievement deleted");
      qc.invalidateQueries({ queryKey: ["admin", "achievements"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createXPEvent = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("xp_events").insert({
        name: xpEventForm.name.trim(),
        description: xpEventForm.description?.trim() || null,
        xp_multiplier: parseFloat(xpEventForm.xp_multiplier) || 2,
        starts_at: xpEventForm.starts_at
          ? new Date(xpEventForm.starts_at).toISOString()
          : new Date().toISOString(),
        ends_at: xpEventForm.ends_at ? new Date(xpEventForm.ends_at).toISOString() : null,
        applies_to: xpEventForm.applies_to,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("XP Event created");
      setXPEventDialog(false);
      setXPEventForm(emptyXPEventForm);
      qc.invalidateQueries({ queryKey: ["admin", "xp_events"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleXPEvent = useMutation({
    mutationFn: async (item: any) => {
      const { error } = await supabase
        .from("xp_events")
        .update({ is_active: !item.is_active })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "xp_events"] }),
  });

  const deleteXPEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("xp_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("XP Event deleted");
      qc.invalidateQueries({ queryKey: ["admin", "xp_events"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rarityColors: Record<string, string> = {
    common: "secondary",
    rare: "default",
    epic: "destructive",
    legendary: "outline",
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gamification Manager</h1>
          <p className="text-sm text-muted-foreground">Manage achievements, XP events, and rewards</p>
        </div>
      </div>

      <Tabs defaultValue="achievements" className="mt-6">
        <TabsList>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="xp_events">XP Events</TabsTrigger>
        </TabsList>

        {/* Achievements Tab */}
        <TabsContent value="achievements">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{achievements.data?.length || 0} achievements</p>
            <Dialog open={achievementDialog} onOpenChange={setAchievementDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-1 h-4 w-4" />
                  New Achievement
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Achievement</DialogTitle>
                </DialogHeader>
                <AchievementFormFields form={achievementForm} setForm={setAchievementForm} />
                <DialogFooter>
                  <Button onClick={() => createAchievement.mutate()} disabled={!achievementForm.name || createAchievement.isPending}>
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {achievements.isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

            {(achievements.data || []).map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-border/40 bg-card p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3 flex-1">
                    <div className="flex-shrink-0">
                      <div 
                        className="flex h-12 w-12 items-center justify-center rounded-lg text-2xl"
                        style={{ backgroundColor: item.badge_color + "20" }}
                      >
                        {item.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{item.name}</h3>
                        <Badge variant={rarityColors[item.rarity] as any}>
                          {item.rarity}
                        </Badge>
                        {item.is_secret && <Badge variant="outline">🔒 Secret</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">{item.category}</Badge>
                        <span>• {item.requirement_type.replace("_", " ")}: {item.requirement_value}</span>
                        <span>• +{item.xp_reward} XP</span>
                        <span>• {Array.isArray(item.unlocks) ? item.unlocks.length : 0} unlocked</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingAchievement(item);
                        setAchievementForm({
                          name: item.name,
                          description: item.description,
                          icon: item.icon || "🏆",
                          category: item.category,
                          requirement_type: item.requirement_type,
                          requirement_value: String(item.requirement_value),
                          xp_reward: String(item.xp_reward),
                          badge_color: item.badge_color,
                          rarity: item.rarity,
                          is_secret: item.is_secret,
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
                          <AlertDialogTitle>Delete "{item.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove this achievement. Users who have unlocked it will lose it.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteAchievement.mutate(item.id)}>
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
        </TabsContent>

        {/* XP Events Tab */}
        <TabsContent value="xp_events">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{xpEvents.data?.length || 0} events</p>
            <Dialog open={xpEventDialog} onOpenChange={setXPEventDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-1 h-4 w-4" />
                  New XP Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create XP Event</DialogTitle>
                </DialogHeader>
                <XPEventFormFields form={xpEventForm} setForm={setXPEventForm} />
                <DialogFooter>
                  <Button onClick={() => createXPEvent.mutate()} disabled={!xpEventForm.name || createXPEvent.isPending}>
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {xpEvents.isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

            {(xpEvents.data || []).map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-border/40 bg-card p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3 flex-1">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-violet-500/20">
                      <Zap className="h-5 w-5 text-violet-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{item.name}</h3>
                        <Badge variant={item.is_active ? "default" : "outline"}>
                          {item.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="secondary">{item.xp_multiplier}x XP</Badge>
                      </div>
                      {item.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>Starts: {new Date(item.starts_at).toLocaleString()}</span>
                        <span>Ends: {new Date(item.ends_at).toLocaleString()}</span>
                        <Badge variant="outline">{item.applies_to}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleXPEvent.mutate(item)}
                      title={item.is_active ? "Deactivate" : "Activate"}
                    >
                      {item.is_active ? <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" /> : <Star className="h-4 w-4" />}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete "{item.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove this XP event.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteXPEvent.mutate(item.id)}>
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
        </TabsContent>
      </Tabs>

      <Dialog open={!!editingAchievement} onOpenChange={(v) => { if (!v) { setEditingAchievement(null); setAchievementForm(emptyAchievementForm); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Achievement</DialogTitle>
          </DialogHeader>
          <AchievementFormFields form={achievementForm} setForm={setAchievementForm} />
          <DialogFooter>
            <Button onClick={() => updateAchievement.mutate()} disabled={!achievementForm.name || updateAchievement.isPending}>
              {updateAchievement.isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AchievementFormFields({ form, setForm }: { form: AchievementForm; setForm: (form: AchievementForm) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Name *</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Achievement name"
          />
        </div>

        <div>
          <Label>Icon</Label>
          <Input
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            placeholder="🏆"
            maxLength={2}
          />
        </div>
      </div>

      <div>
        <Label>Description *</Label>
        <Textarea
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Achievement description..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="reading">Reading</SelectItem>
              <SelectItem value="social">Social</SelectItem>
              <SelectItem value="milestone">Milestone</SelectItem>
              <SelectItem value="special">Special</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Rarity</Label>
          <Select value={form.rarity} onValueChange={(v) => setForm({ ...form, rarity: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="common">Common</SelectItem>
              <SelectItem value="rare">Rare</SelectItem>
              <SelectItem value="epic">Epic</SelectItem>
              <SelectItem value="legendary">Legendary</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Requirement Type</Label>
          <Select value={form.requirement_type} onValueChange={(v) => setForm({ ...form, requirement_type: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chapters_read">Chapters Read</SelectItem>
              <SelectItem value="streak_days">Streak Days</SelectItem>
              <SelectItem value="comments">Comments</SelectItem>
              <SelectItem value="ratings">Ratings</SelectItem>
              <SelectItem value="follows">Follows</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Requirement Value</Label>
          <Input
            type="number"
            value={form.requirement_value}
            onChange={(e) => setForm({ ...form, requirement_value: e.target.value })}
            placeholder="1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>XP Reward</Label>
          <Input
            type="number"
            value={form.xp_reward}
            onChange={(e) => setForm({ ...form, xp_reward: e.target.value })}
            placeholder="10"
          />
        </div>

        <div>
          <Label>Badge Color</Label>
          <Input
            type="color"
            value={form.badge_color}
            onChange={(e) => setForm({ ...form, badge_color: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="is_secret"
          checked={form.is_secret}
          onCheckedChange={(v) => setForm({ ...form, is_secret: !!v })}
        />
        <Label htmlFor="is_secret" className="cursor-pointer font-normal">
          Secret achievement (hidden until unlocked)
        </Label>
      </div>
    </div>
  );
}

function XPEventFormFields({ form, setForm }: { form: XPEventForm; setForm: (form: XPEventForm) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Event Name *</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Double XP Weekend"
        />
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Event description..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>XP Multiplier</Label>
          <Input
            type="number"
            step="0.1"
            value={form.xp_multiplier}
            onChange={(e) => setForm({ ...form, xp_multiplier: e.target.value })}
            placeholder="2.0"
          />
        </div>

        <div>
          <Label>Applies To</Label>
          <Select value={form.applies_to} onValueChange={(v) => setForm({ ...form, applies_to: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Titles</SelectItem>
              <SelectItem value="specific_series">Specific Titles</SelectItem>
              <SelectItem value="specific_tags">Specific Genres</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Starts At *</Label>
          <Input
            type="datetime-local"
            value={form.starts_at}
            onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
          />
        </div>

        <div>
          <Label>Ends At *</Label>
          <Input
            type="datetime-local"
            value={form.ends_at}
            onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
