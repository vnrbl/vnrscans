import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, Trophy, BookOpen, Flame, Star, Sparkles } from "lucide-react";
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
  all_time: "All Time",
};

const targetTypeLabels: Record<string, string> = {
  chapters: "Chapters Read",
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

  // Fetch goals
  const goals = useQuery({
    queryKey: ["reading-goals"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];

      // 1. Fetch reading history to compute accurate values
      const { data: history, error: historyError } = await supabase
        .from("reading_history")
        .select("updated_at")
        .eq("user_id", u.user.id);
      
      if (historyError) throw historyError;

      // Calculate chapter counts for different periods
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      
      const day = now.getDay();
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
      const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), diffToMonday).getTime();
      
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const startOfThisYear = new Date(now.getFullYear(), 0, 1).getTime();

      let dailyCount = 0;
      let weeklyCount = 0;
      let monthlyCount = 0;
      let yearlyCount = 0;
      let allTimeCount = history?.length || 0;

      history?.forEach((item) => {
        const time = new Date(item.updated_at).getTime();
        if (time >= startOfToday) dailyCount++;
        if (time >= startOfThisWeek) weeklyCount++;
        if (time >= startOfThisMonth) monthlyCount++;
        if (time >= startOfThisYear) yearlyCount++;
      });

      // 2. Fetch existing goals
      const { data: existingGoals, error: goalsError } = await supabase
        .from("reading_goals")
        .select("*")
        .eq("user_id", u.user.id);

      if (goalsError) throw goalsError;

      const goalsList = (existingGoals || []) as Goal[];

      // Definitions of 5 AI goals
      const goalSpecs = [
        {
          type: "daily",
          target: 3,
          current: dailyCount,
          start: new Date(startOfToday).toISOString(),
          end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString(),
          xp: 15
        },
        {
          type: "weekly",
          target: 15,
          current: weeklyCount,
          start: new Date(startOfThisWeek).toISOString(),
          end: new Date(startOfThisWeek + 7 * 24 * 60 * 60 * 1000 - 1).toISOString(),
          xp: 75
        },
        {
          type: "monthly",
          target: 50,
          current: monthlyCount,
          start: new Date(startOfThisMonth).toISOString(),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString(),
          xp: 250
        },
        {
          type: "yearly",
          target: 300,
          current: yearlyCount,
          start: new Date(startOfThisYear).toISOString(),
          end: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999).toISOString(),
          xp: 1500
        },
        {
          type: "all_time",
          target: 1000,
          current: allTimeCount,
          start: new Date(0).toISOString(),
          end: null,
          xp: 5000
        }
      ];

      // Fetch user profile for XP updates
      const { data: profileData } = await supabase
        .from("profiles")
        .select("experience_points,user_level")
        .eq("user_id", u.user.id)
        .maybeSingle();
      
      const xp = profileData?.experience_points || 0;
      const level = profileData?.user_level || 1;

      // Process each goal specification
      for (const spec of goalSpecs) {
        let existing = goalsList.find((g) => {
          if (g.goal_type !== spec.type) return false;
          if (spec.type === "all_time") return true;
          const gStart = new Date(g.start_date).toDateString();
          const specStart = new Date(spec.start).toDateString();
          return gStart === specStart;
        });

        if (!existing) {
          // Auto-insert goal
          const { data: newGoal, error: insertError } = await supabase
            .from("reading_goals")
            .insert({
              user_id: u.user.id,
              goal_type: spec.type,
              target_type: "chapters",
              target_value: spec.target,
              current_value: spec.current,
              start_date: spec.start,
              end_date: spec.end,
              is_active: spec.current < spec.target,
              completed_at: spec.current >= spec.target ? new Date().toISOString() : null,
            })
            .select()
            .single();
          
          if (!insertError && newGoal) {
            goalsList.push(newGoal as Goal);
            if (spec.current >= spec.target) {
              // Award XP
              await awardXP(u.user.id, spec.xp, xp, level);
              toast.success(`🎉 AI recommended ${goalTypeLabels[spec.type]} Goal completed! +${spec.xp} XP!`);
            }
          }
        } else if (existing.is_active) {
          // Update progress if active
          const isCompletedNow = spec.current >= existing.target_value;
          const { error: updateError } = await supabase
            .from("reading_goals")
            .update({
              current_value: spec.current,
              is_active: !isCompletedNow,
              completed_at: isCompletedNow ? new Date().toISOString() : null,
            })
            .eq("id", existing.id);
          
          if (!updateError) {
            existing.current_value = spec.current;
            if (isCompletedNow) {
              existing.is_active = false;
              existing.completed_at = new Date().toISOString();
              // Award XP
              await awardXP(u.user.id, spec.xp, xp, level);
              toast.success(`🎉 AI recommended ${goalTypeLabels[spec.type]} Goal completed! +${spec.xp} XP!`);
            }
          }
        }
      }

      // Re-fetch all goals to return the updated list
      const { data: finalGoals } = await supabase
        .from("reading_goals")
        .eq("user_id", u.user.id)
        .order("is_active", { ascending: false })
        .order("created_at", { ascending: false });

      return (finalGoals || []) as Goal[];
    },
  });

  // Helper to award XP
  async function awardXP(userId: string, xpReward: number, currentXp: number, currentLevel: number) {
    const newXp = currentXp + xpReward;
    let newLevel = currentLevel;
    let targetXp = Math.pow((newLevel + 1) * 2, 2);
    while (newXp >= targetXp) {
      newLevel += 1;
      targetXp = Math.pow((newLevel + 1) * 2, 2);
    }

    await supabase
      .from("profiles")
      .update({
        experience_points: newXp,
        user_level: newLevel
      } as any)
      .eq("user_id", userId);
    
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

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
          <h2 className="text-2xl font-bold flex items-center gap-2">
            Reading Goals
            <Badge className="bg-violet-600 hover:bg-violet-700 text-white gap-1 py-0.5">
              <Sparkles className="h-3 w-3" />
              AI Recommended
            </Badge>
          </h2>
          <p className="text-sm text-muted-foreground">
            Goals assigned automatically based on your reading activity. Earn XP to level up!
          </p>
        </div>
      </div>

      {/* Active Goals */}
      {goals.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse h-40 bg-secondary/30" />
          ))}
        </div>
      ) : activeGoals.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Active Goals ({activeGoals.length})</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {activeGoals.map((goal) => {
              const progress = getProgress(goal);
              const daysRemaining = getDaysRemaining(goal);
              const Icon = targetTypeIcons[goal.target_type] || Target;
              const isCompleted = goal.current_value >= goal.target_value;

              return (
                <Card key={goal.id} className="p-4 relative overflow-hidden">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                          <Icon className="h-5 w-5 text-violet-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold flex items-center gap-1.5">
                            {goalTypeLabels[goal.goal_type]} Goal
                            <Badge className="bg-violet-600/15 text-violet-500 hover:bg-violet-600/25 text-[10px] py-0 px-1.5 border-0 font-semibold gap-0.5">
                              <Sparkles className="h-2.5 w-2.5" />
                              AI
                            </Badge>
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {targetTypeLabels[goal.target_type]}
                          </p>
                        </div>
                      </div>
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
                    <div className="flex items-center justify-between pt-1">
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
                      {daysRemaining !== null && daysRemaining > 0 ? (
                        <span className="text-xs text-muted-foreground">
                          {daysRemaining} {daysRemaining === 1 ? "day" : "days"} left
                        </span>
                      ) : goal.goal_type === "all_time" ? (
                        <span className="text-xs text-muted-foreground">Lifetime Goal</span>
                      ) : null}
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
          <h3 className="mt-4 font-semibold">All caught up!</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            No active reading goals found. Keep checking back for new recommendations!
          </p>
        </Card>
      )}

      {/* Completed Goals */}
      {!goals.isLoading && completedGoals.length > 0 && (
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
                      <p className="text-sm font-medium truncate flex items-center gap-1.5">
                        {goal.target_value} {targetTypeLabels[goal.target_type]}
                        <Badge className="bg-violet-600/15 text-violet-500 hover:bg-violet-600/25 text-[8px] py-0 px-1 border-0 font-medium">
                          AI
                        </Badge>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {goalTypeLabels[goal.goal_type]} • {goal.completed_at
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
