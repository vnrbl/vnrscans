"use client";

import { Settings as SettingsIcon, BookOpen, Menu, Clock, Lock } from "lucide-react";
import { useReaderSettings } from "@/contexts/ReaderSettingsContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useIsAdmin } from "@/hooks/useAuth";

export default function SettingsPage() {
  const { settings, updateSettings } = useReaderSettings();
  const { isAdmin } = useIsAdmin();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-6 sm:px-6 md:px-8">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <SettingsIcon className="h-8 w-8 text-violet-600" />
            <h1 className="text-3xl font-bold">Settings</h1>
          </div>
          <p className="mt-2 text-muted-foreground">
            Customize your reading experience
          </p>
        </div>

        <div className="space-y-6">
          {/* Reader Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Reader Settings
              </CardTitle>
              <CardDescription>
                Configure how you want to read manga, manhwa, and novels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Reading Direction */}
              <div className="space-y-2">
                <Label htmlFor="reading-direction">Reading Direction</Label>
                <Select
                  value={settings.readingDirection}
                  onValueChange={(value: any) => updateSettings({ readingDirection: value })}
                >
                  <SelectTrigger id="reading-direction">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ltr">Left to Right (LTR)</SelectItem>
                    <SelectItem value="rtl">Right to Left (RTL)</SelectItem>
                    <SelectItem value="vertical">Vertical (Webtoon)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose how pages are ordered when reading
                </p>
              </div>

              <Separator />

              {/* Reading Mode */}
              <div className="space-y-2">
                <Label htmlFor="reading-mode">Reading Mode</Label>
                <Select
                  value={settings.readingMode}
                  onValueChange={(value: any) => updateSettings({ readingMode: value })}
                >
                  <SelectTrigger id="reading-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="page">Page by Page</SelectItem>
                    <SelectItem value="webtoon">Continuous Scroll (Webtoon)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Page mode shows one page at a time, webtoon mode scrolls continuously
                </p>
              </div>

              <Separator />

              {/* Page Fit */}
              <div className="space-y-2">
                <Label htmlFor="page-fit">Page Fit</Label>
                <Select
                  value={settings.pageFit}
                  onValueChange={(value: any) => updateSettings({ pageFit: value })}
                >
                  <SelectTrigger id="page-fit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="width">Fit to Width</SelectItem>
                    <SelectItem value="height">Fit to Height</SelectItem>
                    <SelectItem value="original">Original Size</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  How images should be sized on your screen
                </p>
              </div>

              <Separator />

              {/* Image Quality */}
              <div className="space-y-2">
                <Label htmlFor="image-quality">Image Quality</Label>
                <Select
                  value={settings.imageQuality}
                  onValueChange={(value: any) => updateSettings({ imageQuality: value })}
                >
                  <SelectTrigger id="image-quality">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High Quality</SelectItem>
                    <SelectItem value="medium">Medium Quality</SelectItem>
                    <SelectItem value="low">Low Quality (Data Saver)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Lower quality uses less bandwidth but images may look compressed
                </p>
              </div>

              <Separator />

              {/* Auto-scroll Speed */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="scroll-speed">Auto-scroll Speed</Label>
                  <span className="text-sm text-muted-foreground">{settings.autoScrollSpeed}%</span>
                </div>
                <Slider
                  id="scroll-speed"
                  min={0}
                  max={100}
                  step={5}
                  value={[settings.autoScrollSpeed]}
                  onValueChange={(value) => updateSettings({ autoScrollSpeed: value[0] })}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Speed for automatic scrolling in webtoon mode (0 = disabled)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Home Feed Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Menu className="h-5 w-5" />
                Home Feed Settings
              </CardTitle>
              <CardDescription>
                Configure what content types are visible on the home page feed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Show Novels Toggle */}
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <Label htmlFor="show-novels" className="cursor-pointer font-medium">
                    Show Novels on Home Page
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Toggle visibility of Novels in home page lists, recently added chapters, and the hero carousel
                  </p>
                </div>
                <Switch
                  id="show-novels"
                  checked={settings.showNovelsOnHome}
                  onCheckedChange={(checked) => updateSettings({ showNovelsOnHome: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Chapter Release & Early Access Hold Settings - Admin Only */}
          {isAdmin && (
            <Card className="border-amber-500/30 bg-gradient-to-b from-card to-amber-950/10 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-amber-400">
                    <Lock className="h-5 w-5 text-amber-500" />
                    Chapter Release & Early Access Settings
                  </CardTitle>
                  <span className="rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-xs font-mono font-bold text-amber-400">
                    Admin Only
                  </span>
                </div>
                <CardDescription>
                  Configure early access hold policies and lock countdowns for newly released chapters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <Label htmlFor="enable-30min-hold" className="cursor-pointer font-medium flex items-center gap-2">
                      <span>30-Minute Early Access Hold</span>
                      {settings.enable30MinHold !== false ? (
                        <span className="rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                          Active
                        </span>
                      ) : (
                        <span className="rounded bg-neutral-800 border border-neutral-700 px-1.5 py-0.5 text-[10px] font-bold text-neutral-400">
                          Turned Off
                        </span>
                      )}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      When enabled, newly imported chapters have a 30-minute early access hold with countdown timers before unlocking. When turned off, chapters are immediately unlocked for all readers with zero wait time.
                    </p>
                  </div>
                  <Switch
                    id="enable-30min-hold"
                    checked={settings.enable30MinHold !== false}
                    onCheckedChange={(checked) => updateSettings({ enable30MinHold: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>Note:</strong> These settings are saved to your device and will be remembered across sessions.
                </p>
                <p>
                  Settings are applied automatically when reading chapters. Some settings may not apply to all content types.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
