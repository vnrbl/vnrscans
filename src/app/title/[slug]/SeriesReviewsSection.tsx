"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  MessageSquare,
  Star,
  Sparkles,
  Heart,
  Flame,
  Laugh,
  ThumbsUp,
  Image as ImageIcon,
  Send,
  Loader2,
  Trash2,
  Pin,
  Smile,
  Shield,
  CornerDownRight,
  Flag,
  Check,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { safeUrlOrNull, serializeAttachmentUrls, MAX_COMMENT_ATTACHMENTS } from "@/lib/safe-url";
import { LiveWebGifPicker } from "@/components/comments/LiveWebGifPicker";
import { CommentAttachmentGrid } from "@/components/comments/CommentAttachmentGrid";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SeriesReviewsSectionProps {
  seriesId: string;
  seriesTitle: string;
  slug: string;
  currentRating?: number | string | null;
}

const REVIEW_REACTIONS = [
  { type: "like", label: "Helpful", icon: ThumbsUp },
  { type: "fire", label: "Fire", icon: Flame },
  { type: "heart", label: "Love", icon: Heart },
  { type: "funny", label: "Funny", icon: Laugh },
] as const;

export function SeriesReviewsSection({
  seriesId,
  seriesTitle,
  slug,
  currentRating,
}: SeriesReviewsSectionProps) {
  const { user } = useAuth();
  const { isAdmin, isMod } = useIsAdmin();
  const canModerate = isAdmin || isMod;
  const qc = useQueryClient();

  const [reviewBody, setReviewBody] = useState("");
  const [selectedRating, setSelectedRating] = useState<number>(10);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [attachmentType, setAttachmentType] = useState<"image" | "gif" | null>(null);
  const [attachmentAlt, setAttachmentAlt] = useState<string | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState<string | null>(null);
  const reviewFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const serializedAttachmentUrl = serializeAttachmentUrls(attachmentUrls);

  const uploadReviewImage = async (file: File) => {
    if (!user) throw new Error("Sign in to upload images");
    if (!file.type.startsWith("image/")) throw new Error("Please choose an image file");
    if (file.size > 5 * 1024 * 1024) throw new Error("Image must be under 5MB");

    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("comment-media").upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) throw error;

    const { data } = supabase.storage.from("comment-media").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleReviewImageUpload = async (fileList: FileList | File[] | null) => {
    if (!fileList || fileList.length === 0) return;
    if (!user) {
      toast.error("Please sign in to upload images");
      return;
    }
    const files = Array.from(fileList);
    const maxAllowed = MAX_COMMENT_ATTACHMENTS;
    const currentCount = attachmentUrls.length;
    const remainingSlots = maxAllowed - currentCount;

    if (remainingSlots <= 0) {
      toast.error("Maximum 5 images allowed per review");
      return;
    }

    let filesToUpload = files;
    if (files.length > remainingSlots) {
      toast.warning(`Maximum 5 images allowed. Uploading first ${remainingSlots} image${remainingSlots === 1 ? "" : "s"}.`);
      filesToUpload = files.slice(0, remainingSlots);
    }

    try {
      setUploadingAttachment(true);
      const newUrls: string[] = [];
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        setUploadProgressText(`Uploading ${i + 1}/${filesToUpload.length}...`);
        try {
          const url = await uploadReviewImage(file);
          newUrls.push(url);
        } catch (err) {
          toast.error(`Failed to upload ${file.name}: ${err instanceof Error ? err.message : "Error"}`);
        }
      }

      if (newUrls.length > 0) {
        setAttachmentType("image");
        setAttachmentUrls((prev) => [...prev, ...newUrls].slice(0, MAX_COMMENT_ATTACHMENTS));
        setAttachmentAlt(filesToUpload[0]?.name || "Review image");
        toast.success(`Attached ${newUrls.length} image${newUrls.length > 1 ? "s" : ""}`);
      }
    } finally {
      setUploadingAttachment(false);
      setUploadProgressText(null);
      if (reviewFileInputRef.current) {
        reviewFileInputRef.current.value = "";
      }
    }
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachmentUrls((prev) => {
      const next = prev.filter((_, idx) => idx !== indexToRemove);
      if (next.length === 0) {
        setAttachmentType(null);
        setAttachmentAlt(null);
      }
      return next;
    });
  };

  const clearAttachments = () => {
    setAttachmentUrls([]);
    setAttachmentType(null);
    setAttachmentAlt(null);
    if (reviewFileInputRef.current) {
      reviewFileInputRef.current.value = "";
    }
  };

  const [showMemeDrawer, setShowMemeDrawer] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "top" | "highest" | "lowest">("top");
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(new Set());

  // Reply state
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");

  // 1. Fetch Series-Level Comments (chapter_id IS NULL)
  const reviewsQ = useQuery({
    queryKey: ["series-reviews", seriesId],
    queryFn: async () => {
      try {
        const { data, error } = await (supabase.from("comments") as any)
          .select(
            "id,user_id,series_id,chapter_id,parent_id,content,attachment_type,attachment_url,attachment_alt,is_hidden,is_spoiler,is_pinned,created_at,updated_at"
          )
          .eq("series_id", seriesId)
          .is("chapter_id", null)
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("[SeriesReviews] Fetch error:", error);
          return [];
        }
        return (data || []) as any[];
      } catch (err) {
        console.warn("[SeriesReviews] Query catch:", err);
        return [];
      }
    },
    enabled: !!seriesId,
    staleTime: 1000 * 30,
  });

  const userIds = Array.from(
    new Set((reviewsQ.data || []).map((c: any) => c.user_id).filter(Boolean))
  ) as string[];

  // 2. Fetch Profiles for commentators
  const profilesQ = useQuery({
    queryKey: ["series-review-profiles", userIds.join(",")],
    queryFn: async () => {
      if (userIds.length === 0) return new Map<string, any>();
      try {
        const [profilesRes, rolesRes, userRatingsRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("user_id,username,avatar_url,avatar_frame,accent_color,user_level,is_vip")
            .in("user_id", userIds),
          supabase.from("user_roles").select("user_id,role").in("user_id", userIds),
          supabase
            .from("ratings")
            .select("user_id,rating")
            .eq("series_id", seriesId)
            .in("user_id", userIds),
        ]);

        const map = new Map<string, any>();
        (profilesRes.data || []).forEach((p: any) => {
          map.set(p.user_id, {
            ...p,
            roles: (rolesRes.data || [])
              .filter((r: any) => r.user_id === p.user_id)
              .map((r: any) => r.role),
            userRating: (userRatingsRes.data || []).find((r: any) => r.user_id === p.user_id)
              ?.rating,
          });
        });
        return map;
      } catch {
        return new Map<string, any>();
      }
    },
    enabled: userIds.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  // 3. Fetch Reactions on series reviews
  const reviewIds = (reviewsQ.data || []).map((r: any) => r.id);
  const reactionsQ = useQuery({
    queryKey: ["series-review-reactions", reviewIds.join(",")],
    queryFn: async () => {
      if (reviewIds.length === 0)
        return { counts: new Map<string, Record<string, number>>(), mine: new Set<string>() };

      try {
        const { data, error } = await (supabase.from("comment_reactions") as any)
          .select("comment_id,user_id,reaction_type")
          .in("comment_id", reviewIds);

        if (error) {
          return { counts: new Map<string, Record<string, number>>(), mine: new Set<string>() };
        }

        const counts = new Map<string, Record<string, number>>();
        const mine = new Set<string>();

        (data || []).forEach((row: any) => {
          const bucket = counts.get(row.comment_id) || {};
          bucket[row.reaction_type] = (bucket[row.reaction_type] || 0) + 1;
          counts.set(row.comment_id, bucket);

          if (user && row.user_id === user.id) {
            mine.add(`${row.comment_id}:${row.reaction_type}`);
          }
        });

        return { counts, mine };
      } catch {
        return { counts: new Map<string, Record<string, number>>(), mine: new Set<string>() };
      }
    },
    enabled: reviewIds.length > 0,
    staleTime: 1000 * 20,
  });

  // Post Review / Series Comment Mutation
  const postReviewMutation = useMutation({
    mutationFn: async ({
      body,
      rating,
      parentId = null,
      attachUrl = null,
      attachType = null,
      attachAlt = null,
      spoiler = false,
    }: {
      body: string;
      rating?: number;
      parentId?: string | null;
      attachUrl?: string | null;
      attachType?: "image" | "gif" | null;
      attachAlt?: string | null;
      spoiler?: boolean;
    }) => {
      if (!user) throw new Error("Please sign in to post a review");
      const cleanBody = body.trim();
      if (!cleanBody && !attachUrl) throw new Error("Please write a review or attach media");

      // 1. If rating is provided and it's a top-level review, upsert rating in `ratings` table
      if (!parentId && rating) {
        await (supabase.from("ratings") as any).upsert(
          {
            user_id: user.id,
            series_id: seriesId,
            rating: rating,
          },
          { onConflict: "user_id,series_id" }
        );
      }

      // 2. Insert series-level comment (chapter_id is NULL)
      const { error: commentErr } = await (supabase.from("comments") as any).insert({
        user_id: user.id,
        series_id: seriesId,
        chapter_id: null,
        parent_id: parentId,
        content: cleanBody || (attachType === "gif" ? "[GIF]" : "[Meme]"),
        attachment_type: attachType,
        attachment_url: attachUrl,
        attachment_alt: attachAlt,
        is_spoiler: spoiler,
      });

      if (commentErr) throw commentErr;
    },
    onSuccess: (_, vars) => {
      toast.success(vars.parentId ? "Reply posted!" : "Series review posted!");
      setReviewBody("");
      setAttachmentUrls([]);
      setAttachmentType(null);
      setAttachmentAlt(null);
      setIsSpoiler(false);
      setShowMemeDrawer(false);
      setReplyingToId(null);
      setReplyBody("");
      qc.invalidateQueries({ queryKey: ["series-reviews", seriesId] });
      qc.invalidateQueries({ queryKey: ["series-review-reactions"] });
      qc.invalidateQueries({ queryKey: ["series", "detail", slug] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to post review");
    },
  });

  // Toggle Reaction Mutation
  const toggleReactionMutation = useMutation({
    mutationFn: async ({ reviewId, type, hasReacted }: { reviewId: string; type: string; hasReacted: boolean }) => {
      if (!user) throw new Error("Please sign in to react");

      if (hasReacted) {
        await (supabase.from("comment_reactions") as any)
          .delete()
          .eq("comment_id", reviewId)
          .eq("user_id", user.id)
          .eq("reaction_type", type);
      } else {
        await (supabase.from("comment_reactions") as any).insert({
          comment_id: reviewId,
          user_id: user.id,
          reaction_type: type,
        });
      }
    },
    onMutate: async ({ reviewId, type, hasReacted }) => {
      const queryKey = ["series-review-reactions", reviewIds.join(",")];
      await qc.cancelQueries({ queryKey });

      const prevData = qc.getQueryData<{
        counts: Map<string, Record<string, number>>;
        mine: Set<string>;
      }>(queryKey);

      if (prevData) {
        const nextCounts = new Map(prevData.counts);
        const nextMine = new Set(prevData.mine);
        const key = `${reviewId}:${type}`;

        const reviewBucket = { ...(nextCounts.get(reviewId) || {}) };
        const currentCount = reviewBucket[type] || 0;

        if (hasReacted) {
          nextMine.delete(key);
          reviewBucket[type] = Math.max(0, currentCount - 1);
        } else {
          nextMine.add(key);
          reviewBucket[type] = currentCount + 1;
        }

        nextCounts.set(reviewId, reviewBucket);
        qc.setQueryData(queryKey, { counts: nextCounts, mine: nextMine });
      }

      return { prevData, queryKey };
    },
    onError: (err: any, _, context) => {
      if (context?.prevData) {
        qc.setQueryData(context.queryKey, context.prevData);
      }
      toast.error(err.message || "Failed to update reaction");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["series-review-reactions"] });
    },
  });

  // Delete Review Mutation
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      if (!user) throw new Error("Sign in required");
      const { error } = await supabase.from("comments").delete().eq("id", reviewId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Review deleted");
      qc.invalidateQueries({ queryKey: ["series-reviews", seriesId] });
    },
  });

  // Pin Review Mutation
  const togglePinMutation = useMutation({
    mutationFn: async ({ reviewId, isPinned }: { reviewId: string; isPinned: boolean }) => {
      if (!canModerate) throw new Error("Admin/Moderator permissions required");
      const { error } = await (supabase.from("comments") as any)
        .update({ is_pinned: !isPinned })
        .eq("id", reviewId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pin status updated");
      qc.invalidateQueries({ queryKey: ["series-reviews", seriesId] });
    },
  });

  // Filter & organize comments
  const allReviews = reviewsQ.data || [];
  const topLevelReviews = allReviews.filter((r: any) => !r.parent_id);
  const repliesByParent = new Map<string, any[]>();

  allReviews
    .filter((r: any) => r.parent_id)
    .forEach((reply: any) => {
      const existing = repliesByParent.get(reply.parent_id) || [];
      existing.push(reply);
      repliesByParent.set(reply.parent_id, existing);
    });

  // Sorted top level reviews
  const sortedTopLevel = [...topLevelReviews].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;

    if (sortBy === "top") {
      const aTotal = Object.values(reactionsQ.data?.counts.get(a.id) || {}).reduce(
        (acc: number, v: any) => acc + (Number(v) || 0),
        0
      );
      const bTotal = Object.values(reactionsQ.data?.counts.get(b.id) || {}).reduce(
        (acc: number, v: any) => acc + (Number(v) || 0),
        0
      );
      if (bTotal !== aTotal) return bTotal - aTotal;
    }

    if (sortBy === "highest") {
      const aRating = profilesQ.data?.get(a.user_id)?.userRating || 0;
      const bRating = profilesQ.data?.get(b.user_id)?.userRating || 0;
      if (bRating !== aRating) return bRating - aRating;
    }

    if (sortBy === "lowest") {
      const aRating = profilesQ.data?.get(a.user_id)?.userRating || 10;
      const bRating = profilesQ.data?.get(b.user_id)?.userRating || 10;
      if (aRating !== bRating) return aRating - bRating;
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const numericAvg = Number(currentRating || 0);

  return (
    <section className="mt-12 pt-10 border-t border-border/40 space-y-6">
      {/* Header & Score Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-400">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
                <span>Community Reviews & Discussion</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary font-mono font-normal text-muted-foreground">
                  {topLevelReviews.length}
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Read what fellow readers think about {seriesTitle} & leave your own review
              </p>
            </div>
          </div>
        </div>

        {/* Aggregate Rating Badge */}
        {numericAvg > 0 && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-card/60 border border-border/40 backdrop-blur shadow-sm">
            <div className="flex items-center gap-1.5 text-amber-400">
              <Star className="h-5 w-5 fill-amber-400" />
              <span className="text-lg font-black tracking-tight">{numericAvg.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">/10</span>
            </div>
            <div className="h-6 w-px bg-border/40" />
            <span className="text-xs text-muted-foreground font-medium">Series Score</span>
          </div>
        )}
      </div>

      {/* Review Composer */}
      <div className="rounded-2xl border border-border/40 bg-card/40 p-4 sm:p-5 space-y-4 shadow-md backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-purple-400" />
            Write a Series Review
          </span>

          {/* Star Rating Picker (1 to 10) */}
          <div className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1 rounded-xl border border-border/30">
            <span className="text-2xs font-semibold text-muted-foreground mr-1">Your Rating:</span>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setSelectedRating(star)}
                className={`p-0.5 transition-transform hover:scale-125 cursor-pointer ${
                  star <= selectedRating ? "text-amber-400" : "text-muted-foreground/30"
                }`}
                title={`Rate ${star}/10`}
              >
                <Star className={`h-3.5 w-3.5 ${star <= selectedRating ? "fill-amber-400" : ""}`} />
              </button>
            ))}
            <span className="text-xs font-bold text-amber-400 ml-1.5 font-mono">{selectedRating}/10</span>
          </div>
        </div>

        {/* Text Area */}
        <Textarea
          value={reviewBody}
          onChange={(e) => setReviewBody(e.target.value)}
          placeholder={
            user
              ? `Share your thoughts on ${seriesTitle}... What did you like or dislike? (Paragraphs & markdown supported)`
              : "Sign in to leave a series review and join the conversation..."
          }
          disabled={!user}
          rows={4}
          className="text-xs sm:text-sm resize-none bg-background/50 leading-relaxed font-light whitespace-pre-wrap focus:ring-1 focus:ring-purple-500/50"
        />

        {/* Hidden File Input for Review Images (Max 5) */}
        <input
          ref={reviewFileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={!user || uploadingAttachment || attachmentUrls.length >= MAX_COMMENT_ATTACHMENTS}
          onChange={(e) => handleReviewImageUpload(e.target.files)}
        />

        {/* Multi-Image Attachment Preview Strip */}
        {attachmentUrls.length > 0 && (
          <div className="space-y-2 rounded-xl border border-purple-500/40 bg-secondary/30 p-2.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-purple-400" />
                {attachmentUrls.length} / {MAX_COMMENT_ATTACHMENTS} attached ({attachmentType === "gif" ? "GIF" : "Images"})
              </span>
              <button
                type="button"
                onClick={clearAttachments}
                className="text-2xs text-destructive hover:underline cursor-pointer"
              >
                Remove all
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {attachmentUrls.map((url, idx) => (
                <div key={idx} className="relative group/thumb rounded-lg overflow-hidden border border-border/50 bg-black/40">
                  <img
                    src={url}
                    alt={`Preview ${idx + 1}`}
                    className="h-16 w-16 sm:h-20 sm:w-20 object-cover"
                  />
                  <span className="absolute bottom-1 left-1 px-1 py-0.2 rounded bg-black/75 text-[10px] font-mono text-white">
                    #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-black/80 text-white hover:bg-destructive transition-colors cursor-pointer"
                    title="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Toolbar & Action Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Upload Image Button (max 5) */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => reviewFileInputRef.current?.click()}
              disabled={!user || uploadingAttachment || attachmentUrls.length >= MAX_COMMENT_ATTACHMENTS}
              className="h-8 gap-1.5 text-xs font-semibold cursor-pointer border-border/50 hover:bg-secondary/60"
            >
              {uploadingAttachment ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{uploadProgressText || "Uploading..."}</span>
                </>
              ) : (
                <>
                  <ImageIcon className="h-3.5 w-3.5 text-purple-400" />
                  <span>
                    {attachmentUrls.length >= MAX_COMMENT_ATTACHMENTS
                      ? "Limit reached (5/5)"
                      : attachmentUrls.length > 0
                      ? `Add More (${attachmentUrls.length}/5)`
                      : "Add Image (Max 5)"}
                  </span>
                </>
              )}
            </Button>

            {/* Reaction Meme / GIF Drawer Toggle */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowMemeDrawer(!showMemeDrawer)}
              disabled={!user}
              className={`h-8 gap-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                showMemeDrawer
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{showMemeDrawer ? "Hide GIFs" : "Search Web GIFs"}</span>
            </Button>

            {/* Spoiler Checkbox */}
            <label className="flex items-center gap-2 text-xs text-muted-foreground select-none cursor-pointer hover:text-foreground transition-colors ml-2">
              <input
                type="checkbox"
                checked={isSpoiler}
                onChange={(e) => setIsSpoiler(e.target.checked)}
                disabled={!user}
                className="rounded border-border"
              />
              <span>Contains Spoilers</span>
            </label>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() =>
              postReviewMutation.mutate({
                body: reviewBody,
                rating: selectedRating,
                attachUrl: serializedAttachmentUrl,
                attachType: attachmentType,
                attachAlt: attachmentAlt,
                spoiler: isSpoiler,
              })
            }
            disabled={
              !user ||
              (!reviewBody.trim() && attachmentUrls.length === 0) ||
              postReviewMutation.isPending ||
              uploadingAttachment
            }
            className="h-8 font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 cursor-pointer shadow-md"
          >
            {postReviewMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span>Post Review</span>
              </>
            )}
          </Button>
        </div>

        {/* Live Web GIF Search Drawer */}
        {showMemeDrawer && (
          <LiveWebGifPicker
            onSelectGif={(gif) => {
              setAttachmentUrls([gif.url]);
              setAttachmentType("gif");
              setAttachmentAlt(gif.title);
              setShowMemeDrawer(false);
              toast.success("Attached GIF!");
            }}
            onClose={() => setShowMemeDrawer(false)}
          />
        )}
      </div>

      {/* Sorting Bar */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <span className="text-xs font-semibold text-muted-foreground">
          Showing {sortedTopLevel.length} review{sortedTopLevel.length === 1 ? "" : "s"}
        </span>

        <div className="flex items-center gap-2">
          <span className="text-2xs text-muted-foreground font-semibold">Sort by:</span>
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="h-8 text-xs w-36 bg-card/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top" className="text-xs">Most Helpful</SelectItem>
              <SelectItem value="newest" className="text-xs">Newest First</SelectItem>
              <SelectItem value="highest" className="text-xs">Highest Rating</SelectItem>
              <SelectItem value="lowest" className="text-xs">Lowest Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reviews List */}
      {reviewsQ.isLoading ? (
        <div className="py-12 flex justify-center items-center">
          <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
        </div>
      ) : sortedTopLevel.length === 0 ? (
        <div className="py-12 text-center rounded-2xl border border-border/30 bg-card/20 p-8 space-y-2">
          <MessageSquare className="h-8 w-8 text-muted-foreground/40 mx-auto" />
          <h3 className="text-sm font-bold text-foreground">No reviews yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Be the first to share your thoughts and rate {seriesTitle}!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedTopLevel.map((review) => {
            const author = profilesQ.data?.get(review.user_id) || {};
            const isAuthor = user?.id === review.user_id;
            const replies = repliesByParent.get(review.id) || [];
            const isSpoilerRevealed = revealedSpoilers.has(review.id);
            const userRatingScore = author.userRating;

            return (
              <div
                key={review.id}
                className={`rounded-2xl border transition-all duration-200 p-4 sm:p-5 space-y-3 ${
                  review.is_pinned
                    ? "border-purple-500/40 bg-purple-950/15 shadow-sm"
                    : "border-border/40 bg-card/30 hover:border-border/60"
                }`}
              >
                {/* Author Info & Rating Bar */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-9 w-9 border border-border/50">
                      <AvatarImage src={author.avatar_url || ""} />
                      <AvatarFallback className="text-xs font-bold">
                        {(author.username || "U")[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-foreground truncate">
                          {author.username || "Reader"}
                        </span>
                        {author.roles?.includes("admin") && (
                          <Badge className="bg-red-600/80 text-white text-[10px] px-1.5 py-0">Admin</Badge>
                        )}
                        {author.is_vip && (
                          <Badge className="bg-amber-500/80 text-black text-[10px] px-1.5 py-0 font-bold">VIP</Badge>
                        )}
                        {author.user_level && (
                          <span className="text-2xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-mono">
                            Lv.{author.user_level}
                          </span>
                        )}
                        {review.is_pinned && (
                          <Badge variant="outline" className="text-2xs text-purple-400 border-purple-500/40 gap-1">
                            <Pin className="h-2.5 w-2.5" /> Pinned Review
                          </Badge>
                        )}
                      </div>
                      <span className="text-2xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Star Rating Badge for this reviewer */}
                  {userRatingScore && (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold shrink-0">
                      <Star className="h-3.5 w-3.5 fill-amber-400" />
                      <span>{userRatingScore}/10</span>
                    </div>
                  )}
                </div>

                {/* Review Body */}
                <div className="text-xs sm:text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {review.is_spoiler && !isSpoilerRevealed ? (
                    <div className="p-3 rounded-xl bg-secondary/50 border border-border/30 flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground italic">
                        ⚠️ This review contains spoilers
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const next = new Set(revealedSpoilers);
                          next.add(review.id);
                          setRevealedSpoilers(next);
                        }}
                        className="h-7 text-xs font-semibold text-purple-400 cursor-pointer"
                      >
                        Reveal Spoiler
                      </Button>
                    </div>
                  ) : (
                    <div>
                      {review.content !== "[GIF]" && review.content !== "[Meme]" && review.content}
                    </div>
                  )}
                </div>

                {/* Attachment Media */}
                {review.attachment_url && (!review.is_spoiler || isSpoilerRevealed) && (
                  <div className="pt-1">
                    <CommentAttachmentGrid
                      urls={review.attachment_url}
                      alt={review.attachment_alt || "Review media"}
                      type={review.attachment_type}
                    />
                  </div>
                )}

                {/* Reactions & Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/20">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {REVIEW_REACTIONS.map((r) => {
                      const Icon = r.icon;
                      const count = reactionsQ.data?.counts.get(review.id)?.[r.type] || 0;
                      const active = reactionsQ.data?.mine.has(`${review.id}:${r.type}`);

                      return (
                        <button
                          key={r.type}
                          type="button"
                          onClick={() => {
                            if (!user) {
                              toast.error("Please sign in to react");
                              return;
                            }
                            toggleReactionMutation.mutate({
                              reviewId: review.id,
                              type: r.type,
                              hasReacted: Boolean(active),
                            });
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
                            active
                              ? "bg-purple-600/20 text-purple-300 border border-purple-500/40"
                              : "bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span>{count > 0 ? count : r.label}</span>
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setReplyingToId(replyingToId === review.id ? null : review.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                    >
                      <CornerDownRight className="h-3.5 w-3.5" />
                      <span>Reply</span>
                      {replies.length > 0 && <span className="ml-0.5">({replies.length})</span>}
                    </button>
                  </div>

                  {/* Moderation Controls */}
                  <div className="flex items-center gap-1">
                    {canModerate && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          togglePinMutation.mutate({
                            reviewId: review.id,
                            isPinned: review.is_pinned,
                          })
                        }
                        className="h-7 w-7 text-muted-foreground hover:text-purple-400 cursor-pointer"
                        title={review.is_pinned ? "Unpin review" : "Pin review"}
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </Button>
                    )}

                    {(isAuthor || canModerate) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (window.confirm("Delete this review?")) {
                            deleteReviewMutation.mutate(review.id);
                          }
                        }}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive cursor-pointer"
                        title="Delete review"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Reply Composer Box */}
                {replyingToId === review.id && (
                  <div className="pt-3 border-t border-border/20 pl-4 border-l-2 border-l-purple-500/40 space-y-2 animate-in fade-in duration-200">
                    <Textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder="Write a reply..."
                      rows={2}
                      className="text-xs resize-none bg-background/50"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingToId(null)}
                        className="h-7 text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                          postReviewMutation.mutate({
                            body: replyBody,
                            parentId: review.id,
                          })
                        }
                        disabled={!replyBody.trim() || postReviewMutation.isPending}
                        className="h-7 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white"
                      >
                        Reply
                      </Button>
                    </div>
                  </div>
                )}

                {/* Replies Thread */}
                {replies.length > 0 && (
                  <div className="space-y-2.5 pt-2 pl-4 sm:pl-6 border-l-2 border-l-border/30">
                    {replies.map((reply) => {
                      const replyAuthor = profilesQ.data?.get(reply.user_id) || {};
                      return (
                        <div
                          key={reply.id}
                          className="p-3 rounded-xl bg-secondary/20 border border-border/20 space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={replyAuthor.avatar_url || ""} />
                                <AvatarFallback className="text-[10px]">
                                  {(replyAuthor.username || "U")[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-bold text-foreground">
                                {replyAuthor.username || "Reader"}
                              </span>
                              <span className="text-2xs text-muted-foreground">
                                {new Date(reply.created_at).toLocaleDateString()}
                              </span>
                            </div>

                            {(user?.id === reply.user_id || canModerate) && (
                              <button
                                type="button"
                                onClick={() => deleteReviewMutation.mutate(reply.id)}
                                className="text-muted-foreground hover:text-destructive p-0.5"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                            {reply.content}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
