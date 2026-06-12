"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SeriesGrid } from "@/components/SeriesGrid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function LibraryPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("reading");

  const library = useQuery({
    queryKey: ["library", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_library")
        .select("*,series:series(id,slug,title,cover_url,type,rating_average,status,view_count)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filterByStatus = (status: string) => {
    return (library.data ?? [])
      .filter((item: any) => item.reading_status === status)
      .map((item: any) => item.series)
      .filter(Boolean);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">My Library</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="reading">Reading</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="plan_to_read">Plan to Read</TabsTrigger>
          <TabsTrigger value="dropped">Dropped</TabsTrigger>
        </TabsList>

        <TabsContent value="reading" className="mt-6">
          <SeriesGrid 
            items={filterByStatus("reading")} 
            loading={library.isLoading} 
            emptyMessage="No series in Reading. Start reading something!" 
          />
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <SeriesGrid 
            items={filterByStatus("completed")} 
            loading={library.isLoading} 
            emptyMessage="No completed series yet." 
          />
        </TabsContent>

        <TabsContent value="plan_to_read" className="mt-6">
          <SeriesGrid 
            items={filterByStatus("plan_to_read")} 
            loading={library.isLoading} 
            emptyMessage="No series planned. Add some from Browse!" 
          />
        </TabsContent>

        <TabsContent value="dropped" className="mt-6">
          <SeriesGrid 
            items={filterByStatus("dropped")} 
            loading={library.isLoading} 
            emptyMessage="No dropped series." 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
