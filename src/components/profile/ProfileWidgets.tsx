import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Code, Copy, Check, Eye, Sparkles, Share2 } from "lucide-react";

type WidgetType = "card" | "banner" | "minimal";
type WidgetTheme = "light" | "dark" | "violet";

export function ProfileWidgets() {
  const qc = useQueryClient();
  const [widgetType, setWidgetType] = useState<WidgetType>("card");
  const [widgetTheme, setWidgetTheme] = useState<WidgetTheme>("dark");
  const [copied, setCopied] = useState(false);

  // Fetch user profile for preview
  const profile = useQuery({
    queryKey: ["profile", "widget-preview"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("*, user_id")
        .eq("user_id", u.user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch stats
  const stats = useQuery({
    queryKey: ["widget-stats"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return { chapters: 0, series: 0, achievements: 0 };

      const [chapters, series, achievements] = await Promise.all([
        supabase
          .from("reading_history")
          .select("*", { count: "exact", head: true })
          .eq("user_id", u.user.id),
        supabase
          .from("series_follows")
          .select("*", { count: "exact", head: true })
          .eq("user_id", u.user.id),
        supabase
          .from("user_achievements")
          .select("*", { count: "exact", head: true })
          .eq("user_id", u.user.id),
      ]);

      return {
        chapters: chapters.count || 0,
        series: series.count || 0,
        achievements: achievements.count || 0,
      };
    },
  });

  const generateEmbedCode = () => {
    if (!profile.data) return "";
    const username = profile.data.username || "user";
    const baseUrl = window.location.origin;
    return `<iframe src="${baseUrl}/widget/${username}?type=${widgetType}&theme=${widgetTheme}" width="${
      widgetType === "banner" ? "600" : "300"
    }" height="${widgetType === "minimal" ? "100" : "400"}" frameborder="0"></iframe>`;
  };

  const generateMarkdownCode = () => {
    if (!profile.data) return "";
    const username = profile.data.username || "user";
    const baseUrl = window.location.origin;
    return `[![vnrscans Profile](${baseUrl}/widget/${username}?type=${widgetType}&theme=${widgetTheme})](${baseUrl}/profile)`;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const getPreviewColors = () => {
    if (widgetTheme === "light") {
      return {
        bg: "bg-white",
        text: "text-gray-900",
        secondary: "text-gray-600",
        border: "border-gray-200",
      };
    } else if (widgetTheme === "violet") {
      return {
        bg: "bg-gradient-to-br from-violet-600 to-purple-600",
        text: "text-white",
        secondary: "text-violet-100",
        border: "border-violet-400",
      };
    } else {
      return {
        bg: "bg-gray-900",
        text: "text-white",
        secondary: "text-gray-400",
        border: "border-gray-700",
      };
    }
  };

  const colors = getPreviewColors();

  const renderPreview = () => {
    if (!profile.data || !stats.data) return null;

    const { username, avatar_url, bio, user_level } = profile.data;

    if (widgetType === "minimal") {
      return (
        <div className={`p-4 rounded-lg border ${colors.border} ${colors.bg}`}>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full overflow-hidden bg-violet-500/20">
              {avatar_url ? (
                <img src={avatar_url} alt={username} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center font-bold text-violet-500">
                  {username?.charAt(0)?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className={`font-bold ${colors.text}`}>{username}</p>
              <p className={`text-sm ${colors.secondary}`}>Level {user_level}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm ${colors.secondary}`}>vnrscans</p>
            </div>
          </div>
        </div>
      );
    }

    if (widgetType === "banner") {
      return (
        <div className={`p-6 rounded-lg border ${colors.border} ${colors.bg}`}>
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full overflow-hidden bg-violet-500/20">
              {avatar_url ? (
                <img src={avatar_url} alt={username} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-2xl font-bold text-violet-500">
                  {username?.charAt(0)?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className={`text-xl font-bold ${colors.text}`}>{username}</h3>
              {bio && <p className={`text-sm mt-1 ${colors.secondary} line-clamp-1`}>{bio}</p>}
              <div className="flex gap-4 mt-2">
                <div>
                  <p className={`text-lg font-bold ${colors.text}`}>{stats.data.chapters}</p>
                  <p className={`text-xs ${colors.secondary}`}>Chapters</p>
                </div>
                <div>
                  <p className={`text-lg font-bold ${colors.text}`}>{stats.data.series}</p>
                  <p className={`text-xs ${colors.secondary}`}>Following</p>
                </div>
                <div>
                  <p className={`text-lg font-bold ${colors.text}`}>{user_level}</p>
                  <p className={`text-xs ${colors.secondary}`}>Level</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Card type
    return (
      <div className={`p-6 rounded-lg border ${colors.border} ${colors.bg}`}>
        <div className="text-center">
          <div className="h-24 w-24 rounded-full overflow-hidden mx-auto bg-violet-500/20">
            {avatar_url ? (
              <img src={avatar_url} alt={username} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-3xl font-bold text-violet-500">
                {username?.charAt(0)?.toUpperCase()}
              </div>
            )}
          </div>
          <h3 className={`text-xl font-bold mt-4 ${colors.text}`}>{username}</h3>
          <p className={`text-sm mt-1 ${colors.secondary}`}>Level {user_level}</p>
          {bio && <p className={`text-sm mt-2 ${colors.secondary} line-clamp-2`}>{bio}</p>}

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <p className={`text-2xl font-bold ${colors.text}`}>{stats.data.chapters}</p>
              <p className={`text-xs ${colors.secondary}`}>Chapters</p>
            </div>
            <div>
              <p className={`text-2xl font-bold ${colors.text}`}>{stats.data.series}</p>
              <p className={`text-xs ${colors.secondary}`}>Series</p>
            </div>
            <div>
              <p className={`text-2xl font-bold ${colors.text}`}>{stats.data.achievements}</p>
              <p className={`text-xs ${colors.secondary}`}>Badges</p>
            </div>
          </div>

          <p className={`text-xs mt-4 ${colors.secondary}`}>vnrscans • Profile Widget</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Profile Widgets</h2>
        <p className="text-sm text-muted-foreground">
          Create embeddable profile cards to share on websites and social media
        </p>
      </div>

      {/* Customization */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Customize Your Widget</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Widget Type</Label>
            <Select value={widgetType} onValueChange={(v) => setWidgetType(v as WidgetType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">Card (300x400)</SelectItem>
                <SelectItem value="banner">Banner (600x200)</SelectItem>
                <SelectItem value="minimal">Minimal (300x100)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Theme</Label>
            <Select value={widgetTheme} onValueChange={(v) => setWidgetTheme(v as WidgetTheme)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="violet">Violet Gradient</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Preview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Preview</h3>
          <Badge variant="outline" className="gap-1">
            <Eye className="h-3 w-3" />
            Live Preview
          </Badge>
        </div>
        <div className="flex items-center justify-center p-8 bg-muted/50 rounded-lg">
          {renderPreview()}
        </div>
      </Card>

      {/* Embed Codes */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Embed Code</h3>
        <Tabs defaultValue="html">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="html">HTML</TabsTrigger>
            <TabsTrigger value="markdown">Markdown</TabsTrigger>
          </TabsList>

          <TabsContent value="html" className="space-y-3">
            <Label>HTML Embed Code</Label>
            <div className="relative">
              <Input
                value={generateEmbedCode()}
                readOnly
                className="pr-20 font-mono text-sm"
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-1 top-1 h-8"
                onClick={() => handleCopy(generateEmbedCode())}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Copy and paste this code into your website or blog
            </p>
          </TabsContent>

          <TabsContent value="markdown" className="space-y-3">
            <Label>Markdown Code</Label>
            <div className="relative">
              <Input
                value={generateMarkdownCode()}
                readOnly
                className="pr-20 font-mono text-sm"
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-1 top-1 h-8"
                onClick={() => handleCopy(generateMarkdownCode())}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use this code in GitHub README, forums, or anywhere that supports Markdown
            </p>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Info */}
      <Card className="p-4 border-violet-500/20 bg-violet-500/5">
        <div className="flex gap-3">
          <Sparkles className="h-5 w-5 text-violet-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-medium">Share Your Profile</p>
            <p className="text-muted-foreground">
              These widgets update automatically with your latest stats. Share them on your personal website, GitHub profile, or social media!
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
