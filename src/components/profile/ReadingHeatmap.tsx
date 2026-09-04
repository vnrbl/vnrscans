import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Flame, BookOpen, Calendar as CalendarIcon } from "lucide-react";
import { useState, useMemo } from "react";

type DayData = {
  date: string;
  count: number;
};

export function ReadingHeatmap() {
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const toLocalYYYYMMDD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Fetch reading history for last 365 days
  const heatmapData = useQuery({
    queryKey: ["profile", "reading-heatmap"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return {};

      // Fetch ALL reading history (no date filter) so stats match the top cards
      const { data, error } = await supabase
        .from("reading_history")
        .select("updated_at")
        .eq("user_id", u.user.id);

      if (error) throw error;

      // Group by date
      const dateCounts: Record<string, number> = {};
      data?.forEach((item) => {
        const dateStr = toLocalYYYYMMDD(new Date(item.updated_at));
        dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
      });

      return dateCounts;
    },
  });

  // Generate calendar days starting on the Sunday of the week 365 days ago
  const generateDays = () => {
    const days: DayData[] = [];
    const today = new Date();
    
    // 365 days ago
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 365);
    
    // Shift startDate back to the previous Sunday (0 = Sunday)
    const startDayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDayOfWeek);
    
    // Align end date to the next Saturday to complete the last week (6 = Saturday)
    const endDate = new Date(today);
    const endDayOfWeek = endDate.getDay();
    endDate.setDate(endDate.getDate() + (6 - endDayOfWeek));
    
    const curr = new Date(startDate);
    while (curr <= endDate) {
      const dateStr = toLocalYYYYMMDD(curr);
      const count = heatmapData.data?.[dateStr] || 0;
      days.push({ date: dateStr, count });
      curr.setDate(curr.getDate() + 1);
    }
    
    return days;
  };

  const days = generateDays();

  // Calculate stats — use all-time data from heatmapData for totals,
  // but the heatmap grid (days array) only covers the displayed calendar range
  const allTimeTotalChapters = useMemo(() => {
    if (!heatmapData.data) return 0;
    return Object.values(heatmapData.data).reduce((sum, count) => sum + count, 0);
  }, [heatmapData.data]);
  const totalDays = days.filter((d) => d.count > 0).length;
  const totalChapters = allTimeTotalChapters;
  const maxStreak = calculateMaxStreak(days);
  const currentStreak = calculateCurrentStreak(days);

  function calculateMaxStreak(days: DayData[]): number {
    let maxStreak = 0;
    let currentStreak = 0;

    days.forEach((day) => {
      if (day.count > 0) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    return maxStreak;
  }

  function calculateCurrentStreak(days: DayData[]): number {
    // Find today's index — don't count future padding days
    const todayStr = toLocalYYYYMMDD(new Date());
    let startIdx = days.length - 1;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].date <= todayStr) {
        startIdx = i;
        break;
      }
    }
    let streak = 0;
    for (let i = startIdx; i >= 0; i--) {
      if (days[i].count > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  // Get color based on count
  const getColor = (count: number) => {
    if (count === 0) return "bg-gray-200 dark:bg-gray-800";
    if (count <= 2) return "bg-violet-300 dark:bg-violet-900";
    if (count <= 5) return "bg-violet-400 dark:bg-violet-700";
    if (count <= 8) return "bg-violet-500 dark:bg-violet-600";
    return "bg-violet-600 dark:bg-violet-500";
  };

  // Group days by week
  const weeks: DayData[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayStr = toLocalYYYYMMDD(new Date());

  // For each week, determine if a month label should be displayed
  const renderedMonthLabels = useMemo(() => {
    const list: (string | null)[] = Array(weeks.length).fill(null);
    let lastMonthName = "";
    
    weeks.forEach((week, index) => {
      const date = new Date(week[0].date.replace(/-/g, "/"));
      const monthName = date.toLocaleDateString("en-US", { month: "short" });
      
      if (monthName !== lastMonthName) {
        list[index] = monthName;
        lastMonthName = monthName;
      }
    });

    return list;
  }, [weeks]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Reading Activity</h2>
        <p className="text-sm text-muted-foreground">
          Your reading activity over the last year
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
              <CalendarIcon className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalDays}</p>
              <p className="text-xs text-muted-foreground">Days Active</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <BookOpen className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalChapters}</p>
              <p className="text-xs text-muted-foreground">Chapters Read</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{currentStreak}</p>
              <p className="text-xs text-muted-foreground">Current Streak</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <Flame className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{maxStreak}</p>
              <p className="text-xs text-muted-foreground">Longest Streak</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Heatmap */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Activity Calendar</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="h-3 w-3 rounded-sm bg-gray-200 dark:bg-gray-800" />
                <div className="h-3 w-3 rounded-sm bg-violet-300 dark:bg-violet-900" />
                <div className="h-3 w-3 rounded-sm bg-violet-400 dark:bg-violet-700" />
                <div className="h-3 w-3 rounded-sm bg-violet-500 dark:bg-violet-600" />
                <div className="h-3 w-3 rounded-sm bg-violet-600 dark:bg-violet-500" />
              </div>
              <span>More</span>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="flex flex-col gap-1">
                {/* Month labels row */}
                <div className="flex gap-1 mb-1">
                  {/* Spacer to align with weekday labels */}
                  <div className="w-6" />
                  
                  {/* Month columns */}
                  <div className="flex gap-1">
                    {weeks.map((week, index) => {
                      const label = renderedMonthLabels[index];
                      return (
                        <div key={index} className="w-3 h-4 relative text-xs text-muted-foreground select-none">
                          {label && (
                            <span className="absolute left-0 top-0 whitespace-nowrap">
                              {label}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Days and Weekdays row */}
                <div className="flex gap-1">
                  {/* Weekday labels */}
                  <div className="flex flex-col gap-1">
                    {weekdays.map((day) => (
                      <div
                        key={day}
                        className="flex h-3 w-6 items-center text-xs text-muted-foreground select-none"
                      >
                        {day[0]}
                      </div>
                    ))}
                  </div>

                  {/* Days */}
                  <div className="flex gap-1">
                    {weeks.map((week, weekIndex) => (
                      <div key={weekIndex} className="flex flex-col gap-1">
                        {week.map((day) => {
                          const isFuture = day.date > todayStr;
                          return (
                            <div
                              key={day.date}
                              className={`h-3 w-3 rounded-sm cursor-pointer transition-all ${
                                isFuture ? "opacity-25 pointer-events-none" : "hover:ring-2 hover:ring-violet-500"
                              } ${getColor(day.count)}`}
                              onMouseEnter={(e) => {
                                if (isFuture) return;
                                setHoveredDay(day);
                                setMousePosition({ x: e.clientX, y: e.clientY });
                              }}
                              onMouseLeave={() => setHoveredDay(null)}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-50 rounded-lg border bg-popover px-3 py-2 text-sm shadow-lg pointer-events-none"
          style={{
            left: `${mousePosition.x + 10}px`,
            top: `${mousePosition.y + 10}px`,
          }}
        >
          <p className="font-medium">
            {new Date(hoveredDay.date.replace(/-/g, "/")).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <p className="text-muted-foreground">
            {hoveredDay.count === 0
              ? "No chapters read"
              : `${hoveredDay.count} ${hoveredDay.count === 1 ? "chapter" : "chapters"} read`}
          </p>
        </div>
      )}
    </div>
  );
}
