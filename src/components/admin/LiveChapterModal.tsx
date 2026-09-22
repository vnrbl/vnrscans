"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  FileUp,
  Sparkles,
  Loader2,
  Trash2,
  Save,
  Plus,
  BookOpen,
  Eye,
  Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { buildChapterSlug } from "@/lib/chapter-utils";
import { parseNovelDocumentFile, autoFormatLineGaps } from "@/lib/document-parser";

export interface LiveChapterData {
  id?: string;
  series_id?: string;
  chapter_number: number;
  title?: string | null;
  slug?: string;
  chapter_type?: "novel" | "image";
  novel_content?: string | null;
  status?: "draft" | "published" | "scheduled";
  scheduled_at?: string | null;
  scanlation_group?: string | null;
  image_urls?: string[];
}

interface LiveChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "edit" | "create";
  seriesId: string;
  seriesSlug: string;
  seriesTitle: string;
  seriesType?: string; // "novel" | "manga" | "manhwa" | "manhua"
  chapter?: LiveChapterData | null;
  initialChapterNumber?: number;
  onSuccess?: (chapter: any, action: "updated" | "created" | "deleted") => void;
}

export function LiveChapterModal({
  isOpen,
  onClose,
  mode,
  seriesId,
  seriesSlug,
  seriesTitle,
  seriesType = "manga",
  chapter,
  initialChapterNumber,
  onSuccess,
}: LiveChapterModalProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isNovel = seriesType === "novel" || chapter?.chapter_type === "novel";

  // Form State
  const [chapterNumber, setChapterNumber] = useState<string>("");
  const [chapterTitle, setChapterTitle] = useState<string>("");
  const [novelContent, setNovelContent] = useState<string>("");
  const [imageUrls, setImageUrls] = useState<string>("");
  const [status, setStatus] = useState<"draft" | "published" | "scheduled">("published");
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [scanlationGroup, setScanlationGroup] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [importingDoc, setImportingDoc] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"content" | "preview">("content");

  // Sync form when modal opens or chapter changes
  useEffect(() => {
    if (!isOpen) return;

    if (mode === "edit" && chapter) {
      setChapterNumber(chapter.chapter_number.toString());
      setChapterTitle(chapter.title || "");
      if (isNovel) {
        if (typeof chapter.novel_content === "string") {
          setNovelContent(chapter.novel_content);
        } else if (chapter.id) {
          supabase
            .from("chapters")
            .select("novel_content")
            .eq("id", chapter.id)
            .single()
            .then(({ data }) => {
              if (data?.novel_content) {
                setNovelContent(data.novel_content);
              }
            });
        }
      } else {
        setNovelContent("");
      }

      setStatus(chapter.status || "published");
      setScheduledAt(
        chapter.scheduled_at
          ? new Date(chapter.scheduled_at).toISOString().slice(0, 16)
          : ""
      );
      setScanlationGroup(chapter.scanlation_group || "");

      // If comic/manga, fetch existing pages if not provided
      if (!isNovel) {
        if (chapter.image_urls && chapter.image_urls.length > 0) {
          setImageUrls(chapter.image_urls.join("\n"));
        } else if (chapter.id) {
          supabase
            .from("chapter_pages")
            .select("image_url")
            .eq("chapter_id", chapter.id)
            .order("page_number", { ascending: true })
            .then(({ data }) => {
              if (data && data.length > 0) {
                setImageUrls(data.map((p) => p.image_url).join("\n"));
              } else {
                setImageUrls("");
              }
            });
        }
      }
    } else {
      // Create mode
      const nextNum = initialChapterNumber != null ? initialChapterNumber : 1;
      setChapterNumber(nextNum.toString());
      setChapterTitle("");
      setNovelContent("");
      setImageUrls("");
      setStatus("published");
      setScheduledAt("");
      setScanlationGroup(chapter?.scanlation_group || "");
    }
    setActiveTab("content");
  }, [isOpen, mode, chapter, initialChapterNumber, isNovel]);

  // Derived word and character counts
  const wordCount = React.useMemo(() => {
    if (!novelContent) return 0;
    return novelContent.trim().split(/\s+/).filter(Boolean).length;
  }, [novelContent]);

  const pageCount = React.useMemo(() => {
    if (!imageUrls) return 0;
    return imageUrls.split("\n").map((u) => u.trim()).filter(Boolean).length;
  }, [imageUrls]);

  // Handle document import (.docx, .doc, .pdf, .txt, .md)
  const handleDocumentUpload = async (file: File) => {
    setImportingDoc(true);
    const toastId = toast.loading(`Importing text from "${file.name}"...`);
    try {
      const result = await parseNovelDocumentFile(file);
      let updatedContent = result.text;

      if (novelContent && novelContent.trim()) {
        const replace = window.confirm(
          `Novel content is not empty. Do you want to replace the current text with "${file.name}"?\n\nClick OK to replace, or Cancel to append.`
        );
        if (!replace) {
          updatedContent = `${novelContent.trim()}\n\n${result.text}`;
        }
      }

      setNovelContent(updatedContent);

      if (!chapterTitle && result.chapterTitleSuggestion) {
        setChapterTitle(result.chapterTitleSuggestion);
      }
      if (!chapterNumber && result.chapterNumberSuggestion) {
        setChapterNumber(result.chapterNumberSuggestion);
      }

      toast.success(
        `Imported ${result.wordCount.toLocaleString()} words from ${file.name}`,
        { id: toastId }
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to parse document", { id: toastId });
    } finally {
      setImportingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Auto format line gaps
  const handleAutoFormatLineGaps = () => {
    if (!novelContent.trim()) {
      toast.error("Please enter novel text first");
      return;
    }
    const formatted = autoFormatLineGaps(novelContent);
    setNovelContent(formatted);
    toast.success("Applied paragraph line spacing");
  };

  // Save (Create or Update)
  const handleSave = async (openImmediately: boolean = false) => {
    const parsedNum = parseFloat(chapterNumber.trim());
    if (isNaN(parsedNum)) {
      toast.error("Please enter a valid chapter number");
      return;
    }

    if (isNovel && !novelContent.trim()) {
      toast.error("Novel chapter content cannot be empty");
      return;
    }

    if (!isNovel && !imageUrls.trim()) {
      toast.error("Please provide at least one image URL for manga pages");
      return;
    }

    setSaving(true);
    const toastId = toast.loading(
      mode === "edit" ? "Saving chapter changes live..." : "Creating new chapter live..."
    );

    try {
      const cleanGroup = scanlationGroup.trim() || null;
      const cleanSlug = buildChapterSlug(parsedNum, {
        scanlationGroup: cleanGroup,
      });

      const effectiveUploader = user?.email?.split("@")[0] || "admin";

      if (mode === "edit") {
        if (!chapter?.id) throw new Error("Chapter ID is missing for edit");
        const chapterId = chapter.id;

        // 1. Update chapter record
        const { data: updatedChapter, error: updateError } = await supabase
          .from("chapters")
          .update({
            chapter_number: parsedNum,
            title: chapterTitle.trim() || null,
            slug: cleanSlug,
            novel_content: isNovel ? novelContent : null,
            status: status,
            scheduled_at:
              status === "scheduled" && scheduledAt
                ? new Date(scheduledAt).toISOString()
                : null,
            scanlation_group: cleanGroup,
            updated_at: new Date().toISOString(),
          })
          .eq("id", chapterId)
          .select()
          .single();

        if (updateError) throw updateError;

        // 2. If comic/manga, replace pages if changed
        if (!isNovel) {
          const lines = imageUrls
            .split("\n")
            .map((u) => u.trim())
            .filter(Boolean);

          await supabase.from("chapter_pages").delete().eq("chapter_id", chapterId);

          const pagesPayload = lines.map((url, idx) => ({
            chapter_id: chapterId,
            page_number: idx + 1,
            image_url: url,
          }));

          const { error: pagesErr } = await supabase
            .from("chapter_pages")
            .insert(pagesPayload);
          if (pagesErr) throw pagesErr;
        }

        toast.success(`Chapter ${parsedNum} updated live!`, { id: toastId });

        // Invalidate queries across the app
        qc.invalidateQueries({ queryKey: ["chapter"] });
        qc.invalidateQueries({ queryKey: ["chapters"] });
        qc.invalidateQueries({ queryKey: ["series"] });
        qc.invalidateQueries({ queryKey: ["admin", "chapters"] });

        onSuccess?.(updatedChapter, "updated");
        onClose();

        if (openImmediately || cleanSlug !== chapter.slug) {
          router.push(`/title/${seriesSlug}/${cleanSlug}`);
        }
      } else {
        // CREATE MODE
        // Check for duplicates
        const { data: existing } = await supabase
          .from("chapters")
          .select("id")
          .eq("series_id", seriesId)
          .eq("chapter_number", parsedNum)
          .limit(1);

        if (existing && existing.length > 0) {
          const proceed = window.confirm(
            `Chapter ${parsedNum} already exists for this series. Are you sure you want to create an alternate version with this number?`
          );
          if (!proceed) {
            setSaving(false);
            toast.dismiss(toastId);
            return;
          }
        }

        // 1. Insert chapter record
        const { data: newChapter, error: insertError } = await supabase
          .from("chapters")
          .insert({
            series_id: seriesId,
            chapter_number: parsedNum,
            title: chapterTitle.trim() || null,
            slug: cleanSlug,
            chapter_type: isNovel ? "novel" : "image",
            novel_content: isNovel ? novelContent : null,
            status: status,
            scheduled_at:
              status === "scheduled" && scheduledAt
                ? new Date(scheduledAt).toISOString()
                : null,
            uploaded_by: effectiveUploader,
            scanlation_group: cleanGroup,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // 2. If comic/manga, insert pages
        if (!isNovel) {
          const lines = imageUrls
            .split("\n")
            .map((u) => u.trim())
            .filter(Boolean);

          const pagesPayload = lines.map((url, idx) => ({
            chapter_id: newChapter.id,
            page_number: idx + 1,
            image_url: url,
          }));

          const { error: pagesErr } = await supabase
            .from("chapter_pages")
            .insert(pagesPayload);
          if (pagesErr) throw pagesErr;
        }

        toast.success(`Chapter ${parsedNum} created live!`, { id: toastId });

        // Invalidate queries
        qc.invalidateQueries({ queryKey: ["chapter"] });
        qc.invalidateQueries({ queryKey: ["chapters"] });
        qc.invalidateQueries({ queryKey: ["series"] });
        qc.invalidateQueries({ queryKey: ["admin", "chapters"] });

        onSuccess?.(newChapter, "created");
        onClose();

        if (openImmediately) {
          router.push(`/title/${seriesSlug}/${cleanSlug}`);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Operation failed", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  // Delete chapter
  const handleDelete = async () => {
    if (!chapter?.id) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to DELETE Chapter ${chapter.chapter_number}? This cannot be undone.`
    );
    if (!confirmDelete) return;

    setDeleting(true);
    const toastId = toast.loading(`Deleting Chapter ${chapter.chapter_number}...`);
    try {
      await supabase.from("chapter_pages").delete().eq("chapter_id", chapter.id);
      const { error } = await supabase.from("chapters").delete().eq("id", chapter.id);
      if (error) throw error;

      toast.success(`Chapter ${chapter.chapter_number} deleted`, { id: toastId });
      qc.invalidateQueries({ queryKey: ["chapter"] });
      qc.invalidateQueries({ queryKey: ["chapters"] });
      qc.invalidateQueries({ queryKey: ["series"] });
      qc.invalidateQueries({ queryKey: ["admin", "chapters"] });

      onSuccess?.(chapter, "deleted");
      onClose();
      router.push(`/title/${seriesSlug}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete chapter", { id: toastId });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-neutral-950 border-neutral-800 text-neutral-100 shadow-2xl">
        {/* Hidden file input for Doc/PDF upload */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".docx,.doc,.pdf,.txt,.md"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleDocumentUpload(file);
          }}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 bg-neutral-900/60 shrink-0">
          <div className="min-w-0 pr-6">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-2xs uppercase tracking-wider font-bold px-2 py-0.5"
              >
                Admin Live
              </Badge>
              <h2 className="text-lg font-bold truncate text-white">
                {mode === "edit"
                  ? `Live Edit: Chapter ${chapterNumber || chapter?.chapter_number || ""}`
                  : `Add Chapter to "${seriesTitle}"`}
              </h2>
            </div>
            <p className="text-xs text-neutral-400 truncate mt-0.5">
              Series: <span className="text-neutral-200 font-medium">{seriesTitle}</span> • Type:{" "}
              <span className="capitalize text-primary font-medium">{isNovel ? "Novel" : "Manga"}</span>
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0 scrollbar-thin">
          {/* Row 1: Chapter Number, Title, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            <div className="sm:col-span-3">
              <Label className="text-xs font-semibold text-neutral-300">
                Chapter # <span className="text-red-400">*</span>
              </Label>
              <Input
                type="number"
                step="any"
                value={chapterNumber}
                onChange={(e) => setChapterNumber(e.target.value)}
                placeholder="1"
                className="mt-1 h-9 bg-neutral-900/90 border-neutral-800 focus:border-primary text-sm font-semibold"
              />
            </div>

            <div className="sm:col-span-6">
              <Label className="text-xs font-semibold text-neutral-300">
                Chapter Title <span className="text-neutral-500 text-2xs font-normal">(optional)</span>
              </Label>
              <Input
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                placeholder="e.g. The Change, Awakening..."
                className="mt-1 h-9 bg-neutral-900/90 border-neutral-800 focus:border-primary text-sm"
              />
            </div>

            <div className="sm:col-span-3">
              <Label className="text-xs font-semibold text-neutral-300">Publish Status</Label>
              <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                <SelectTrigger className="mt-1 h-9 bg-neutral-900/90 border-neutral-800 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-100">
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Scanlation Group & Scheduled Date */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            <div className="sm:col-span-6">
              <Label className="text-xs font-semibold text-neutral-300">
                Scanlation Group <span className="text-neutral-500 text-2xs font-normal">(optional)</span>
              </Label>
              <Input
                value={scanlationGroup}
                onChange={(e) => setScanlationGroup(e.target.value)}
                placeholder="e.g. Asura, Reaper, Official..."
                className="mt-1 h-9 bg-neutral-900/90 border-neutral-800 focus:border-primary text-sm"
              />
            </div>

            {status === "scheduled" && (
              <div className="sm:col-span-6 animate-in fade-in duration-200">
                <Label className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  Scheduled Release Date & Time
                </Label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="mt-1 h-9 bg-neutral-900/90 border-neutral-800 focus:border-amber-400 text-sm"
                />
              </div>
            )}
          </div>

          {/* Row 3: Content Section */}
          {isNovel ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-semibold text-neutral-300">
                    Novel Text Content <span className="text-red-400">*</span>
                  </Label>
                  <span className="text-2xs font-mono font-bold px-2 py-0.5 rounded-full bg-neutral-800/80 text-neutral-300 border border-neutral-700/60">
                    {wordCount.toLocaleString()} words • {novelContent.length.toLocaleString()} chars
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={importingDoc}
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7.5 px-2.5 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-amber-300 hover:text-amber-200 shadow-sm"
                  >
                    {importingDoc ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin text-amber-400" />
                    ) : (
                      <FileUp className="h-3.5 w-3.5 mr-1 text-amber-400" />
                    )}
                    Import Doc / PDF
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAutoFormatLineGaps}
                    className="h-7.5 px-2.5 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white shadow-sm"
                    title="Insert clean paragraph gaps between text blocks"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1 text-violet-400" />
                    Auto Line Gaps
                  </Button>

                  <div className="border-l border-neutral-800 h-5 mx-0.5" />

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab(activeTab === "content" ? "preview" : "content")}
                    className={`h-7.5 px-2 text-xs font-medium ${
                      activeTab === "preview"
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    {activeTab === "preview" ? "Edit Mode" : "Preview"}
                  </Button>
                </div>
              </div>

              {activeTab === "content" ? (
                <Textarea
                  value={novelContent}
                  onChange={(e) => setNovelContent(e.target.value)}
                  placeholder="Paste or write chapter novel content here, or click 'Import Doc / PDF' to upload .docx/.pdf..."
                  rows={14}
                  className="font-mono text-xs sm:text-sm leading-relaxed p-3.5 bg-neutral-900/90 border-neutral-800 focus:border-primary text-neutral-100 placeholder:text-neutral-600 resize-y min-h-[280px]"
                />
              ) : (
                <div className="max-h-[360px] overflow-y-auto p-4 rounded-lg bg-neutral-900 border border-neutral-800 space-y-3 font-serif text-sm leading-relaxed text-neutral-200">
                  <div className="text-center border-b border-neutral-800 pb-3 mb-4">
                    <p className="text-xs uppercase tracking-widest text-primary font-bold">{seriesTitle}</p>
                    <h3 className="text-lg font-bold text-white mt-1">
                      Chapter {chapterNumber}
                      {chapterTitle ? `: ${chapterTitle}` : ""}
                    </h3>
                    <p className="text-2xs font-mono opacity-60 mt-1">[ {wordCount.toLocaleString()} words ]</p>
                  </div>
                  {novelContent
                    .split(/\n\s*\n/)
                    .filter((p) => p.trim())
                    .map((paragraph, idx) => (
                      <p key={idx} className="indent-4">
                        {paragraph.trim()}
                      </p>
                    ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <Label className="text-xs font-semibold text-neutral-300">
                  Chapter Image Pages (URLs) <span className="text-red-400">*</span>
                </Label>
                <span className="text-2xs font-mono font-bold px-2 py-0.5 rounded-full bg-neutral-800/80 text-neutral-300 border border-neutral-700/60">
                  {pageCount} pages detected
                </span>
              </div>
              <Textarea
                value={imageUrls}
                onChange={(e) => setImageUrls(e.target.value)}
                placeholder="Enter image URLs (one per line):&#10;https://example.com/page1.jpg&#10;https://example.com/page2.jpg"
                rows={10}
                className="font-mono text-xs leading-relaxed p-3 bg-neutral-900/90 border-neutral-800 focus:border-primary text-neutral-100 placeholder:text-neutral-600 resize-y min-h-[220px]"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-neutral-800 px-6 py-3.5 bg-neutral-900/80 shrink-0">
          <div>
            {mode === "edit" && chapter?.id && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={saving || deleting}
                onClick={handleDelete}
                className="h-9 px-3 text-xs font-semibold"
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                )}
                Delete Chapter
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving || deleting}
              onClick={onClose}
              className="h-9 px-3.5 text-xs font-medium border-neutral-700 hover:bg-neutral-800 text-neutral-300"
            >
              Cancel
            </Button>

            {mode === "create" && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={saving || deleting}
                onClick={() => handleSave(true)}
                className="h-9 px-3.5 text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-900/30"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                )}
                Create & Read Now
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              disabled={saving || deleting}
              onClick={() => handleSave(false)}
              className="h-9 px-4 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : mode === "edit" ? (
                <Save className="h-3.5 w-3.5 mr-1.5" />
              ) : (
                <Plus className="h-3.5 w-3.5 mr-1.5" />
              )}
              {mode === "edit" ? "Save Changes Live" : "Create Chapter"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
