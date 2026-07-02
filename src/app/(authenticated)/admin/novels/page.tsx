"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  BookOpen,
  Plus,
  Trash2,
  Save,
  Send,
  Calendar,
  Maximize2,
  Minimize2,
  FileText,
  Clock,
  Sparkles,
  Bold,
  Italic,
  Heading3,
  Quote,
  Undo2,
  Loader2,
  ChevronRight,
  Book,
  User,
  Eye,
  Star,
  Settings,
  Tags,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { buildChapterSlug } from "@/lib/chapter-utils";
import { logAdminAction } from "@/lib/adminLog";

type ChapterRow = {
  id: string;
  slug: string;
  chapter_number: number;
  title: string | null;
  status: "draft" | "published" | "scheduled";
  scheduled_at: string | null;
  uploaded_by: string | null;
  novel_content: string | null;
  created_at: string;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function NovelsWriterPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  
  // Workspace States
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>("");
  const [activeChapter, setActiveChapter] = useState<ChapterRow | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>("");
  
  // Create Series Dialog State
  const [createSeriesOpen, setCreateSeriesOpen] = useState(false);
  
  // New Series Form States
  const [newTitle, setNewTitle] = useState("");
  const [newCoverUrl, setNewCoverUrl] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newArtist, setNewArtist] = useState("");
  const [newAltTitles, setNewAltTitles] = useState("");
  const [newStatus, setNewStatus] = useState<"ongoing" | "completed" | "hiatus">("ongoing");
  const [newContentRating, setNewContentRating] = useState<"safe" | "suggestive" | "nsfw" | "pornographic">("safe");
  const [newReleaseYear, setNewReleaseYear] = useState("");
  const [newGenreIds, setNewGenreIds] = useState<string[]>([]);
  const [newTagIds, setNewTagIds] = useState<string[]>([]);

  // Chapter Form States
  const [chapterNumber, setChapterNumber] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "scheduled">("draft");
  const [scheduledAt, setScheduledAt] = useState("");
  const [novelContent, setNovelContent] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch uploader profile
  const userProfile = useQuery({
    queryKey: ["admin", "novels-writer-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", user.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user,
  });

  // Fetch all novel series
  const novelSeriesQuery = useQuery({
    queryKey: ["admin", "novels-series-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("id,title,slug,cover_url")
        .eq("type", "novel")
        .eq("is_hidden", false)
        .order("title");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch genres options
  const genresQuery = useQuery({
    queryKey: ["admin", "novels-genres-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("genres")
        .select("id,name,slug")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch tags options
  const tagsQuery = useQuery({
    queryKey: ["admin", "novels-tags-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("id,name,slug")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch chapters for the selected novel series
  const chaptersQuery = useQuery({
    queryKey: ["admin", "novels-chapters", selectedSeriesId],
    queryFn: async () => {
      if (!selectedSeriesId) return [];
      const { data, error } = await supabase
        .from("chapters")
        .select("id,slug,chapter_number,title,status,scheduled_at,uploaded_by,novel_content,created_at")
        .eq("series_id", selectedSeriesId)
        .order("chapter_number", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ChapterRow[];
    },
    enabled: !!selectedSeriesId,
  });

  // Initialize selected series if none set
  useEffect(() => {
    if (novelSeriesQuery.data && novelSeriesQuery.data.length > 0 && !selectedSeriesId) {
      setSelectedSeriesId(novelSeriesQuery.data[0].id);
    }
  }, [novelSeriesQuery.data, selectedSeriesId]);

  // Load active chapter details into form
  const loadChapter = (chapter: ChapterRow) => {
    setActiveChapter(chapter);
    setChapterNumber(String(chapter.chapter_number));
    setChapterTitle(chapter.title ?? "");
    setStatus(chapter.status);
    setScheduledAt(
      chapter.scheduled_at
        ? new Date(chapter.scheduled_at).toISOString().slice(0, 16)
        : ""
    );
    setNovelContent(chapter.novel_content ?? "");
    setLastSaved("");
  };

  // Start a new chapter draft
  const startNewChapter = () => {
    setActiveChapter(null);
    
    // Auto-calculate next chapter number
    let nextNum = 1;
    if (chaptersQuery.data && chaptersQuery.data.length > 0) {
      const maxNum = Math.max(...chaptersQuery.data.map(c => c.chapter_number));
      nextNum = isFinite(maxNum) ? maxNum + 1 : 1;
    }

    setChapterNumber(String(nextNum));
    setChapterTitle("");
    setStatus("draft");
    setScheduledAt("");
    setNovelContent("");
    setLastSaved("");
  };

  // Reset Create Series Form
  const resetNewSeriesForm = () => {
    setNewTitle("");
    setNewCoverUrl("");
    setNewDescription("");
    setNewAuthor("");
    setNewArtist("");
    setNewAltTitles("");
    setNewStatus("ongoing");
    setNewContentRating("safe");
    setNewReleaseYear("");
    setNewGenreIds([]);
    setNewTagIds([]);
  };

  // Create Novel Series Mutation
  const createSeriesMutation = useMutation({
    mutationFn: async () => {
      if (!newTitle.trim()) throw new Error("Title is required");

      const seriesPayload = {
        title: newTitle.trim(),
        slug: slugify(newTitle.trim()),
        type: "novel" as const,
        cover_url: newCoverUrl.trim() || null,
        description: newDescription.trim() || null,
        author: newAuthor.trim() || null,
        artist: newArtist.trim() || null,
        alternative_titles: newAltTitles.trim() || null,
        status: newStatus,
        content_rating: newContentRating,
        release_year: newReleaseYear ? parseInt(newReleaseYear, 10) : null,
        is_hidden: false,
        updated_at: new Date().toISOString()
      };

      // 1. Insert series details
      const { data: newSeries, error: seriesError } = await supabase
        .from("series")
        .insert(seriesPayload)
        .select("id")
        .single();

      if (seriesError) throw seriesError;

      // 2. Insert genres relationships
      if (newGenreIds.length > 0) {
        const { error: genresError } = await supabase
          .from("series_genres")
          .insert(newGenreIds.map(genre_id => ({ series_id: newSeries.id, genre_id })));
        if (genresError) throw genresError;
      }

      // 3. Insert tags relationships
      if (newTagIds.length > 0) {
        const { error: tagsError } = await supabase
          .from("series_tags")
          .insert(newTagIds.map(tag_id => ({ series_id: newSeries.id, tag_id })));
        if (tagsError) throw tagsError;
      }

      await logAdminAction("create", "series", newSeries.id, { title: newTitle.trim() });
      return newSeries.id;
    },
    onSuccess: (newId) => {
      toast.success("Novel series created successfully!");
      setCreateSeriesOpen(false);
      resetNewSeriesForm();
      qc.invalidateQueries({ queryKey: ["admin", "novels-series-list"] });
      setSelectedSeriesId(newId);
      startNewChapter();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Toggle genre checkbox
  const toggleGenre = (genreId: string) => {
    setNewGenreIds(prev =>
      prev.includes(genreId) ? prev.filter(id => id !== genreId) : [...prev, genreId]
    );
  };

  // Toggle tag checkbox
  const toggleTag = (tagId: string) => {
    setNewTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  // Helper to inject HTML tags into the editor selection
  const injectTag = (tagOpen: string, tagClose: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    
    const replacement = `${tagOpen}${selected}${tagClose}`;
    const newContent = text.substring(0, start) + replacement + text.substring(end);
    
    setNovelContent(newContent);
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tagOpen.length, start + tagOpen.length + selected.length);
    }, 50);
  };

  // Word & Character count calculation
  const wordCount = useMemo(() => {
    const text = novelContent.replace(/<[^>]*>/g, ""); // Strip HTML tags
    const words = text.trim().split(/\s+/).filter(Boolean);
    return words.length;
  }, [novelContent]);

  const charCount = useMemo(() => {
    return novelContent.replace(/<[^>]*>/g, "").length;
  }, [novelContent]);

  const readingTime = useMemo(() => {
    return Math.ceil(wordCount / 200) || 1;
  }, [wordCount]);

  // Local Storage Auto-Save feature
  useEffect(() => {
    if (!selectedSeriesId || !chapterNumber || !novelContent.trim()) return;

    const autoSaveTimer = setTimeout(() => {
      const key = `novel-draft-${selectedSeriesId}-${chapterNumber}`;
      localStorage.setItem(key, JSON.stringify({
        novelContent,
        chapterTitle,
        timestamp: new Date().toISOString()
      }));
      
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSaved(`Draft auto-saved at ${time}`);
    }, 1500);

    return () => clearTimeout(autoSaveTimer);
  }, [novelContent, chapterTitle, selectedSeriesId, chapterNumber]);

  // Load auto-save draft if available
  const loadSavedDraft = () => {
    const key = `novel-draft-${selectedSeriesId}-${chapterNumber}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const data = JSON.parse(saved);
      setNovelContent(data.novelContent);
      setChapterTitle(data.chapterTitle);
      toast.success("Restored local auto-saved draft");
    } else {
      toast.error("No local auto-saved draft found for this chapter number");
    }
  };

  // Create or Update Novel Chapter mutation
  const saveMutation = useMutation({
    mutationFn: async (publishStatus: "draft" | "published" | "scheduled") => {
      if (!selectedSeriesId) throw new Error("Please select a novel series");
      if (!chapterNumber) throw new Error("Chapter number is required");
      if (!novelContent.trim()) throw new Error("Novel chapter content cannot be empty");

      const parsedNum = parseFloat(chapterNumber.replace(/[^\d.]/g, "")) || parseFloat(chapterNumber);
      const chapterNum = isNaN(parsedNum) ? 0 : parsedNum;
      const authorName = userProfile.data?.username || "Official Author";

      const payload = {
        series_id: selectedSeriesId,
        chapter_number: chapterNum,
        title: chapterTitle.trim() || null,
        slug: buildChapterSlug(chapterNum, {
          title: chapterTitle.trim() || null,
          scanlationGroup: null
        }),
        chapter_type: "novel" as const,
        novel_content: novelContent,
        status: publishStatus,
        scheduled_at:
          publishStatus === "scheduled" && scheduledAt
            ? new Date(scheduledAt).toISOString()
            : null,
        uploaded_by: authorName,
      };

      if (activeChapter) {
        // Update Chapter
        const { error } = await supabase
          .from("chapters")
          .update({
            ...payload,
            updated_at: new Date().toISOString()
          })
          .eq("id", activeChapter.id);

        if (error) throw error;
        await logAdminAction("update", "chapter", activeChapter.id, {
          series_id: selectedSeriesId,
          chapter_number: chapterNum,
          type: "novel"
        });
      } else {
        // Create Chapter
        const { data: newChapter, error } = await supabase
          .from("chapters")
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        await logAdminAction("create", "chapter", newChapter.id, {
          series_id: selectedSeriesId,
          chapter_number: chapterNum,
          type: "novel"
        });
      }

      // Clear local storage draft
      const key = `novel-draft-${selectedSeriesId}-${chapterNumber}`;
      localStorage.removeItem(key);
    },
    onSuccess: (_, publishStatus) => {
      toast.success(activeChapter ? "Chapter updated successfully!" : "New chapter published!");
      qc.invalidateQueries({ queryKey: ["admin", "novels-chapters", selectedSeriesId] });
      setLastSaved("");
      
      // Reload active chapter query
      setTimeout(async () => {
        const { data } = await supabase
          .from("chapters")
          .select("id,slug,chapter_number,title,status,scheduled_at,uploaded_by,novel_content,created_at")
          .eq("series_id", selectedSeriesId)
          .eq("chapter_number", parseFloat(chapterNumber))
          .maybeSingle();
        
        if (data) {
          loadChapter(data as ChapterRow);
        }
      }, 300);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Delete Chapter mutation
  const deleteMutation = useMutation({
    mutationFn: async (chapterId: string) => {
      const { error } = await supabase.from("chapters").delete().eq("id", chapterId);
      if (error) throw error;
      await logAdminAction("delete", "chapter", chapterId, { series_id: selectedSeriesId });
    },
    onSuccess: () => {
      toast.success("Chapter deleted");
      startNewChapter();
      qc.invalidateQueries({ queryKey: ["admin", "novels-chapters", selectedSeriesId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className={`flex flex-col flex-1 ${focusMode ? "fixed inset-0 z-50 bg-[#0c0c0e] p-6 overflow-y-auto" : "py-4 md:py-6"}`}>
        {/* Header Dashboard section */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border/30 pb-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Novels Writer Panel</h1>
              <p className="text-xs text-muted-foreground">Write and format your custom novel chapters distraction-free.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5">
            {/* Create Novel Series Button Trigger */}
            <Dialog open={createSeriesOpen} onOpenChange={(v) => { setCreateSeriesOpen(v); if(!v) resetNewSeriesForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 h-9 font-semibold text-white">
                  <Plus className="mr-1.5 h-4 w-4" /> Create Novel
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Novel Series</DialogTitle>
                  <DialogDescription>
                    Add a new web novel configuration to the site. This sets up the series title, metadata, genres, and tags.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-5 py-2">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Left Column Fields */}
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="title">Novel Title *</Label>
                        <Input
                          id="title"
                          placeholder="e.g. Shadow Slave"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="author">Author *</Label>
                        <Input
                          id="author"
                          placeholder="Writer's name"
                          value={newAuthor}
                          onChange={(e) => setNewAuthor(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="artist">Artist (optional)</Label>
                        <Input
                          id="artist"
                          placeholder="Illustrator name"
                          value={newArtist}
                          onChange={(e) => setNewArtist(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="coverUrl">Cover Image URL</Label>
                        <Input
                          id="coverUrl"
                          placeholder="https://..."
                          value={newCoverUrl}
                          onChange={(e) => setNewCoverUrl(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="altTitles">Alternative Titles (comma/line separated)</Label>
                        <Input
                          id="altTitles"
                          placeholder="Russian, Chinese titles"
                          value={newAltTitles}
                          onChange={(e) => setNewAltTitles(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Right Column Fields */}
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="desc">Synopsis / Description *</Label>
                        <Textarea
                          id="desc"
                          rows={4}
                          placeholder="Synopsis of your novel..."
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                          className="mt-1 resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="status">Status</Label>
                          <Select value={newStatus} onValueChange={(v: any) => setNewStatus(v)}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ongoing">Ongoing</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="hiatus">Hiatus</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="year">Release Year</Label>
                          <Input
                            id="year"
                            type="number"
                            placeholder="e.g. 2026"
                            value={newReleaseYear}
                            onChange={(e) => setNewReleaseYear(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="rating">Content Rating</Label>
                        <Select value={newContentRating} onValueChange={(v: any) => setNewContentRating(v)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="safe">Safe (General Audience)</SelectItem>
                            <SelectItem value="suggestive">Suggestive</SelectItem>
                            <SelectItem value="nsfw">NSFW (18+ nudity/violence)</SelectItem>
                            <SelectItem value="pornographic">Pornographic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Taxonomy: Genres & Tags lists */}
                  <div className="grid gap-4 sm:grid-cols-2 pt-3 border-t border-border/20">
                    <div>
                      <Label className="flex items-center gap-1.5 mb-2 font-semibold">
                        <Settings className="h-4 w-4 text-primary" /> Select Genres
                      </Label>
                      <div className="rounded-lg border border-border/40 bg-card p-3 max-h-40 overflow-y-auto grid grid-cols-2 gap-2">
                        {genresQuery.data?.map(g => (
                          <label key={g.id} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newGenreIds.includes(g.id)}
                              onChange={() => toggleGenre(g.id)}
                              className="rounded border-border bg-background focus:ring-primary h-3.5 w-3.5 text-primary"
                            />
                            <span className="truncate">{g.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="flex items-center gap-1.5 mb-2 font-semibold">
                        <Tags className="h-4 w-4 text-primary" /> Select Tags
                      </Label>
                      <div className="rounded-lg border border-border/40 bg-card p-3 max-h-40 overflow-y-auto grid grid-cols-2 gap-2">
                        {tagsQuery.data?.map(t => (
                          <label key={t.id} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newTagIds.includes(t.id)}
                              onChange={() => toggleTag(t.id)}
                              className="rounded border-border bg-background focus:ring-primary h-3.5 w-3.5 text-primary"
                            />
                            <span className="truncate">{t.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="mt-4 border-t border-border/10 pt-3">
                  <Button variant="outline" onClick={() => setCreateSeriesOpen(false)}>Cancel</Button>
                  <Button
                    onClick={() => createSeriesMutation.mutate()}
                    disabled={!newTitle.trim() || !newAuthor.trim() || !newDescription.trim() || createSeriesMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold min-w-[120px]"
                  >
                    {createSeriesMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Novel"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Select value={selectedSeriesId} onValueChange={(v) => { setSelectedSeriesId(v); startNewChapter(); }}>
              <SelectTrigger className="w-[200px] bg-card/60 backdrop-blur border-border/60">
                <SelectValue placeholder="Select novel series..." />
              </SelectTrigger>
              <SelectContent>
                {novelSeriesQuery.data?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              title={focusMode ? "Minimize Editor" : "Fullscreen Focus Mode"}
              onClick={() => setFocusMode(!focusMode)}
              className="border-border/60 hover:bg-secondary"
            >
              {focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Workspace Layout */}
        <div className="grid gap-6 md:grid-cols-[250px_1fr] flex-1">
          {/* Sidebar - Chapter list for current novel */}
          {!focusMode && (
            <aside className="space-y-4">
              <Button
                onClick={startNewChapter}
                disabled={!selectedSeriesId}
                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold"
              >
                <Plus className="mr-1.5 h-4 w-4" /> Write New Chapter
              </Button>

              <div className="rounded-lg border border-border/40 bg-card p-3 max-h-[calc(100vh-22rem)] overflow-y-auto space-y-1">
                <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/10 mb-2 flex items-center justify-between">
                  <span>Chapters Index</span>
                  {chaptersQuery.isLoading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                </p>

                {selectedSeriesId ? (
                  chaptersQuery.data && chaptersQuery.data.length > 0 ? (
                    chaptersQuery.data.map((ch) => (
                      <button
                        key={ch.id}
                        onClick={() => loadChapter(ch)}
                        className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-xs transition-colors group ${
                          activeChapter?.id === ch.id
                            ? "bg-primary/10 text-primary font-bold border border-primary/25"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
                        }`}
                      >
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate group-hover:text-primary font-medium">
                            Ch.{ch.chapter_number} {ch.title ? `- ${ch.title}` : ""}
                          </span>
                          <span className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(ch.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {ch.status === "draft" && <Badge variant="secondary" className="px-1 py-0 text-[8px] tracking-wide uppercase opacity-75">Draft</Badge>}
                        {ch.status === "scheduled" && <Badge variant="outline" className="px-1 py-0 text-[8px] tracking-wide uppercase border-yellow-600 text-yellow-500 bg-yellow-500/5">Sch</Badge>}
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6 italic">No chapters created yet.</p>
                  )
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-6 italic">Please create or select a novel series first.</p>
                )}
              </div>
            </aside>
          )}

          {/* Main Workspace - Editor */}
          <section className="flex flex-col flex-1 space-y-4 rounded-xl border border-border/40 bg-card/40 backdrop-blur-md p-4 sm:p-6 shadow-2xl relative">
            {!selectedSeriesId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-10 max-w-md mx-auto">
                <Book className="h-16 w-16 text-muted-foreground/60 mb-4 stroke-[1.2]" />
                <h2 className="text-lg font-bold">No Novel Selected</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Before you can write chapters, you must create a novel or select an existing one from the dropdown menu above.
                </p>
                <Button onClick={() => setCreateSeriesOpen(true)} className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                  <Plus className="mr-1.5 h-4 w-4" /> Create Your First Novel
                </Button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between border-b border-border/20 pb-4 gap-4">
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2 uppercase tracking-wide">
                    <Sparkles className="h-4 w-4 text-primary" />
                    {activeChapter ? `Edit Chapter ${chapterNumber}` : "Writing New Chapter Draft"}
                  </h2>

                  <div className="flex items-center gap-2">
                    {lastSaved && <span className="text-2xs text-muted-foreground mr-2 font-mono">{lastSaved}</span>}
                    
                    <Button onClick={loadSavedDraft} variant="outline" size="sm" className="h-8 text-2xs border-border/60 hover:bg-secondary">
                      <Undo2 className="mr-1 h-3.5 w-3.5" /> Restore Auto-save
                    </Button>
                  </div>
                </div>

                {/* Chapter Metadata Forms */}
                <div className="grid gap-4 sm:grid-cols-12">
                  <div className="sm:col-span-2">
                    <Label>Chapter #</Label>
                    <Input
                      type="text"
                      placeholder="e.g. 1"
                      value={chapterNumber}
                      onChange={(e) => setChapterNumber(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <Label>Title (optional)</Label>
                    <Input
                      type="text"
                      placeholder="e.g. The Beginning of Legend"
                      value={chapterTitle}
                      onChange={(e) => setChapterTitle(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <Label>Publish Status</Label>
                    <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Save as Draft</SelectItem>
                        <SelectItem value="published">Publish Immediately</SelectItem>
                        <SelectItem value="scheduled">Schedule Publication</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-3">
                    <Label>Scheduled Date</Label>
                    <Input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      disabled={status !== "scheduled"}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Formatted Tags Editor Toolbar */}
                <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-lg border border-border/40 bg-card/60 backdrop-blur-sm mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => injectTag("<p>", "</p>")}
                    className="h-8 px-2 hover:bg-secondary hover:text-primary text-xs font-semibold"
                    title="Paragraph tag"
                  >
                    Paragraph
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => injectTag("<strong>", "</strong>")}
                    className="h-8 px-2.5 hover:bg-secondary hover:text-primary"
                    title="Bold tag"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => injectTag("<em>", "</em>")}
                    className="h-8 px-2.5 hover:bg-secondary hover:text-primary"
                    title="Italic tag"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => injectTag("<h3>", "</h3>")}
                    className="h-8 px-2.5 hover:bg-secondary hover:text-primary"
                    title="Heading 3"
                  >
                    <Heading3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => injectTag("<blockquote>", "</blockquote>")}
                    className="h-8 px-2.5 hover:bg-secondary hover:text-primary"
                    title="Blockquote"
                  >
                    <Quote className="h-4 w-4" />
                  </Button>
                  
                  <div className="h-4 w-px bg-border/45 mx-2" />

                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    Tip: Highlight text and click any styling tool to wrap it!
                  </span>
                </div>

                {/* Textarea Editor Area */}
                <div className="flex-1 flex flex-col relative mt-2">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Write your story here... HTML formatting (<p>, <strong>, etc.) is fully supported."
                    value={novelContent}
                    onChange={(e) => setNovelContent(e.target.value)}
                    className="flex-1 font-serif text-base leading-relaxed p-4 bg-card/30 border-border/45 focus-visible:ring-primary min-h-[400px] resize-none"
                    style={{ tabSize: 4 }}
                  />
                </div>

                {/* Bottom info bar */}
                <div className="flex flex-wrap items-center justify-between border-t border-border/20 pt-4 gap-4 text-xs text-muted-foreground mt-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      <strong>{wordCount.toLocaleString()}</strong> words
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Est. <strong>{readingTime}</strong> min read
                    </span>
                    <span className="text-2xs font-mono opacity-80">
                      {charCount.toLocaleString()} characters (excl. HTML)
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {activeChapter && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete Chapter ${chapterNumber}?`)) {
                            deleteMutation.mutate(activeChapter.id);
                          }
                        }}
                        disabled={deleteMutation.isPending || saveMutation.isPending}
                        className="h-9"
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                      </Button>
                    )}

                    <Button
                      onClick={() => saveMutation.mutate(status)}
                      disabled={!chapterNumber || !novelContent.trim() || saveMutation.isPending}
                      className="bg-violet-600 hover:bg-violet-700 h-9 font-semibold text-white min-w-28"
                    >
                      {saveMutation.isPending ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : status === "published" ? (
                        <Send className="mr-1.5 h-3.5 w-3.5" />
                      ) : (
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      {status === "published"
                        ? (activeChapter ? "Update & Publish" : "Publish Now")
                        : status === "scheduled"
                        ? (activeChapter ? "Update Schedule" : "Schedule")
                        : (activeChapter ? "Update Draft" : "Save Draft")}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
