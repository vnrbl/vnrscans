"use client";

import { Link, useNavigate } from "@/lib/router-compat";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EyeOff, Eye, Trash2, Pin, PinOff, Search, Image as ImageIcon, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/adminLog";
import { safeUrlOrNull } from "@/lib/safe-url";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";


type CommentFilter = "all" | "visible" | "hidden" | "media" | "spoilers" | "pinned";

export default function AdminComments() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<CommentFilter>("all");
  const [search, setSearch] = useState("");

  const q = useQuery({
    queryKey: ["admin", "comments"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("comments") as any)
        .select("*,series:series_id(slug,title),chapter:chapter_id(slug,chapter_number,title)")
        .order("created_at", { ascending: false })
        .limit(250);
      if (error) throw error;
      return data ?? [];
    },
  });

  const userIds = Array.from(new Set((q.data ?? []).map((c: any) => c.user_id).filter(Boolean)));
  const profilesQ = useQuery({
    queryKey: ["admin", "comment-profiles", userIds.join(",")],
    queryFn: async () => {
      if (userIds.length === 0) return new Map<string, any>();
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id,username,avatar_url")
        .in("user_id", userIds as string[]);
      if (error) throw error;
      return new Map((data ?? []).map((profile: any) => [profile.user_id, profile]));
    },
    enabled: userIds.length > 0,
  });

  const updateComment = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const { error } = await (supabase.from("comments") as any).update(patch).eq("id", id);
      if (error) throw error;
      const action = "is_hidden" in patch ? (patch.is_hidden ? "hide" : "unhide") : "update";
      await logAdminAction(action, "comment", id, patch);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "comments"] }),
    onError: (error: Error) => toast.error(error.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("comments").delete().eq("id", id);
      if (error) throw error;
      await logAdminAction("delete", "comment", id);
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin", "comments"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const filtered = (q.data ?? []).filter((c: any) => {
    if (filter === "visible" && c.is_hidden) return false;
    if (filter === "hidden" && !c.is_hidden) return false;
    if (filter === "media" && !c.attachment_url) return false;
    if (filter === "spoilers" && !c.is_spoiler) return false;
    if (filter === "pinned" && !c.is_pinned) return false;

    const profile = profilesQ.data?.get(c.user_id);
    const haystack = [
      c.content,
      c.attachment_url,
      c.series?.title,
      c.chapter?.title,
      c.chapter?.chapter_number ? `chapter ${c.chapter.chapter_number}` : "",
      profile?.username,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comments</h1>
          <p className="text-sm text-muted-foreground">Review comments with series context, media, spoiler, and pin controls.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search comments" className="h-9 pl-9 sm:w-64" />
          </div>
          <Select value={filter} onValueChange={(value: CommentFilter) => setFilter(value)}>
            <SelectTrigger className="h-9 sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="visible">Visible</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
              <SelectItem value="media">With media</SelectItem>
              <SelectItem value="spoilers">Spoilers</SelectItem>
              <SelectItem value="pinned">Pinned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6 divide-y divide-border/40 rounded-lg border border-border/40 bg-card">
        {q.isLoading && <div className="p-6 text-sm text-muted-foreground">Loading comments...</div>}
        {!q.isLoading && filtered.length === 0 && <div className="p-6 text-sm text-muted-foreground">No comments found.</div>}
        {filtered.map((c: any) => {
          const profile = profilesQ.data?.get(c.user_id);
          const chapterLink = c.series?.slug && c.chapter?.slug ? `/title/${c.series.slug}/${c.chapter.slug}` : null;

          return (
            <div key={c.id} className="grid gap-3 p-4 lg:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{profile?.username ?? "Reader"}</span>
                  {c.is_hidden && <Badge variant="secondary">Hidden</Badge>}
                  {c.is_pinned && <Badge>PINNED</Badge>}
                  {c.is_spoiler && (
                    <Badge variant="outline" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Spoiler
                    </Badge>
                  )}
                  {c.attachment_url && (
                    <Badge variant="outline" className="gap-1">
                      <ImageIcon className="h-3 w-3" />
                      {c.attachment_type ?? "media"}
                    </Badge>
                  )}
                </div>

                <div className="whitespace-pre-wrap text-sm">{c.content}</div>
                {c.attachment_url && (() => {
                  const safeUrl = safeUrlOrNull(c.attachment_url);
                  if (!safeUrl) return null;
                  return (
                  <a href={safeUrl} target="_blank" rel="noreferrer" className="mt-3 block w-fit overflow-hidden rounded-md border border-border/50">
                    <img src={safeUrl} alt={c.attachment_alt ?? "Comment media"} className="h-24 max-w-48 object-cover" loading="lazy" />
                  </a>
                  );
                })()}

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>{new Date(c.created_at).toLocaleString()}</span>
                  {c.series?.title && <span>{c.series.title}</span>}
                  {c.chapter?.chapter_number && <span>Ch. {c.chapter.chapter_number}</span>}
                  {chapterLink && (
                    <a href={chapterLink} className="font-medium text-primary hover:underline">
                      Open chapter
                    </a>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-start gap-1 lg:justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  title={c.is_hidden ? "Show comment" : "Hide comment"}
                  onClick={() => updateComment.mutate({ id: c.id, patch: { is_hidden: !c.is_hidden } })}
                >
                  {c.is_hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title={c.is_pinned ? "Unpin comment" : "Pin comment"}
                  onClick={() => updateComment.mutate({ id: c.id, patch: { is_pinned: !c.is_pinned } })}
                >
                  {c.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title={c.is_spoiler ? "Remove spoiler" : "Mark spoiler"}
                  onClick={() => updateComment.mutate({ id: c.id, patch: { is_spoiler: !c.is_spoiler } })}
                >
                  <AlertTriangle className={`h-4 w-4 ${c.is_spoiler ? "text-amber-500" : ""}`} />
                </Button>
                <Button variant="ghost" size="icon" title="Delete comment" onClick={() => del.mutate(c.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
