import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Flame, BookOpen, Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";

type DayData = {
  date: string;
  count: number;
};

export function ReadingHeatmap() {
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Fetch reading history for last 365 days
  const heatmapData = useQuery({
    queryKey: ["reading-heatmap"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];

      // Get date 365 days ago
      const oneYearAgo = new Date();
      oneYearAgo.setDate(oneYearAgo.getDate() - 365);

      const { data, error } = await supabase
        .from("reading_history")
        .select("read_at")
        .eq("user_id", u.user.id)
        .gte("read_at", oneYearAgo.toISOString());

      if (error) throw error;

      // Group by date
      const dateCounts: Record<string, number> = {};
      data?.forEach((item) => {
        const date = new Date(item.read_at).toISOString().split("T")[0];
        dateCounts[date] = (dateCounts[date] || 0) + 1;
      });

      return dateCounts;
    },
  });

  // Generate last 365 days
  const generateDays = () => {
    const days: DayData[] = [];
    const today = new Date();

    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const count = heatmapData.data?.[dateStr] || 0;
      days.push({ date: dateStr, count });
    }

    return days;
  };

  const days = generateDays();

  // Calculate stats
  const totalDays = days.filter((d) => d.count > 0).length;
  const totalChapters = days.reduce((sum, d) => sum + d.count, 0);
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
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
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

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
              {/* Month labels */}
              <div className="mb-2 flex gap-1 pl-8">
                {months.map((month, i) => (
                  <div
                    key={month}
                    className="text-xs text-muted-foreground"
                    style={{ width: `${(100 / 12)}%`, minWidth: "50px" }}
                  >
                    {month}
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div className="flex gap-1">
                {/* Weekday labels */}
                <div className="flex flex-col gap-1">
                  {weekdays.map((day) => (
                    <div
                      key={day}
                      className="flex h-3 w-6 items-center text-xs text-muted-foreground"
                    >
                      {day[0]}
                    </div>
                  ))}
                </div>

                {/* Days */}
                <div className="flex gap-1">
                  {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-1">
                      {week.map((day, dayIndex) => (
                        <div
                          key={day.date}
                          className={`h-3 w-3 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-violet-500 ${getColor(
                            day.count
                          )}`}
                          onMouseEnter={(e) => {
                            setHoveredDay(day);
                            setMousePosition({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseLeave={() => setHoveredDay(null)}
                        />
                      ))}
                    </div>
                  ))}
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
            {new Date(hoveredDay.date).toLocaleDateString("en-US", {
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
