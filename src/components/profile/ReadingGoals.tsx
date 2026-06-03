import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Target, Trash2, Trophy, BookOpen, Flame, Star } from "lucide-react";
import { format } from "date-fns";

type Goal = {
  id: string;
  goal_type: string;
  target_type: string;
  target_value: number;
  current_value: number;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  completed_at: string | null;
};

const goalTypeLabels: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
  custom: "Custom",
};

const targetTypeLabels: Record<string, string> = {
  chapters: "Chapters",
  series: "Series",
  streak: "Reading Streak",
};

const targetTypeIcons: Record<string, any> = {
  chapters: BookOpen,
  series: Star,
  streak: Flame,
};

export function ReadingGoals() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [goalType, setGoalType] = useState("weekly");
  const [targetType, setTargetType] = useState("chapters");
  const [targetValue, setTargetValue] = useState("10");

  // Fetch goals
  const goals = useQuery({
    queryKey: ["reading-goals"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];

      const { data, error } = await supabase
        .from("reading_goals")
        .select("*")
        .eq("user_id", u.user.id)
        .order("is_active", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Goal[];
    },
  });

  // Create goal
  const createGoal = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not authenticated");

      const target = parseInt(targetValue);
      if (isNaN(target) || target <= 0) {
        throw new Error("Invalid target value");
      }

      // Calculate end_date based on goal_type
      let endDate = null;
      const startDate = new Date();
      
      if (goalType === "daily") {
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
      } else if (goalType === "weekly") {
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
      } else if (goalType === "monthly") {
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (goalType === "yearly") {
        endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const { error } = await supabase.from("reading_goals").insert({
        user_id: u.user.id,
        goal_type: goalType,
        target_type: targetType,
        target_value: target,
        current_value: 0,
        end_date: endDate?.toISOString(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reading-goals"] });
      toast.success("Goal created successfully!");
      setDialogOpen(false);
      setTargetValue("10");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete goal
  const deleteGoal = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from("reading_goals")
        .delete()
        .eq("id", goalId);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reading-goals"] });
      toast.success("Goal deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const activeGoals = goals.data?.filter((g) => g.is_active) || [];
  const completedGoals = goals.data?.filter((g) => !g.is_active) || [];

  const getProgress = (goal: Goal) => {
    return Math.min((goal.current_value / goal.target_value) * 100, 100);
  };

  const getDaysRemaining = (goal: Goal) => {
    if (!goal.end_date) return null;
    const end = new Date(goal.end_date);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reading Goals</h2>
          <p className="text-sm text-muted-foreground">
            Set goals to track your reading progress
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createGoal.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <Label>Goal Period</Label>
                <Select value={goalType} onValueChange={setGoalType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Target Type</Label>
                <Select value={targetType} onValueChange={setTargetType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chapters">Read Chapters</SelectItem>
                    <SelectItem value="series">Follow Series</SelectItem>
                    <SelectItem value="streak">Maintain Streak (Days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Target Value</Label>
                <Input
                  type="number"
                  min="1"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="e.g., 10"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={createGoal.isPending}>
                {createGoal.isPending ? "Creating..." : "Create Goal"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Active Goals ({activeGoals.length})</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {activeGoals.map((goal) => {
              const progress = getProgress(goal);
              const daysRemaining = getDaysRemaining(goal);
              const Icon = targetTypeIcons[goal.target_type] || Target;
              const isCompleted = goal.current_value >= goal.target_value;

              return (
                <Card key={goal.id} className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                          <Icon className="h-5 w-5 text-violet-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold">
                            {goalTypeLabels[goal.goal_type]} Goal
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {targetTypeLabels[goal.target_type]}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => deleteGoal.mutate(goal.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {goal.current_value} / {goal.target_value}{" "}
                          {targetTypeLabels[goal.target_type].toLowerCase()}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between">
                      {isCompleted ? (
                        <Badge className="gap-1 bg-green-500/10 text-green-600 hover:bg-green-500/20">
                          <Trophy className="h-3 w-3" />
                          Completed!
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <Target className="h-3 w-3" />
                          {goal.target_value - goal.current_value} to go
                        </Badge>
                      )}
                      {daysRemaining !== null && daysRemaining > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {daysRemaining} {daysRemaining === 1 ? "day" : "days"} left
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Target className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-semibold">No Active Goals</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a goal to start tracking your reading progress!
          </p>
        </Card>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">
            Completed Goals ({completedGoals.length})
          </h3>
          <div className="grid gap-3 md:grid-cols-3">
            {completedGoals.slice(0, 6).map((goal) => {
              const Icon = targetTypeIcons[goal.target_type] || Target;
              return (
                <Card key={goal.id} className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                      <Icon className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {goal.target_value} {targetTypeLabels[goal.target_type]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {goal.completed_at
                          ? format(new Date(goal.completed_at), "MMM d, yyyy")
                          : "Completed"}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
