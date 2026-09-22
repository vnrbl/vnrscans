"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import NextLink from "next/link";
import {
  Sliders,
  X,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  List,
  Home,
  Settings,
  Play,
  Pause,
  Square,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Check,
  Volume2,
  Globe,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

export interface NovelReaderSettings {
  fontFamily: "default" | "dyslexic" | "roboto" | "lora" | "mono";
  fontSize: number; // 14 to 34
  textIndent: boolean;
  bionicReading: boolean;
  copyText: boolean;
  textAlign: "left" | "center" | "right" | "justify";
  lineHeight: number; // 1.2 to 3.0
  paragraphSpacing: number; // 18 to 64
  pageWidth: number; // 50 to 100
  autoScroll: boolean;
  autoScrollSpeed: number; // 1 to 10
  autoNext: boolean;
  theme: string;
  accentColor: string;
}

export const DEFAULT_NOVEL_SETTINGS: NovelReaderSettings = {
  fontFamily: "default",
  fontSize: 18,
  textIndent: false,
  bionicReading: false,
  copyText: true,
  textAlign: "left",
  lineHeight: 1.9,
  paragraphSpacing: 28,
  pageWidth: 90,
  autoScroll: false,
  autoScrollSpeed: 3,
  autoNext: true,
  theme: "pitch-black",
  accentColor: "purple",
};

export const NOVEL_THEMES = [
  {
    id: "pitch-black",
    name: "Pitch Black",
    bg: "bg-black",
    bgHex: "#000000",
    textHex: "#e2e8f0",
    borderHex: "#1c1c22",
    panelHex: "#09090b",
    cardHex: "#121215",
    metaHex: "#71717a",
  },
  {
    id: "charcoal",
    name: "Charcoal Night",
    bg: "bg-[#09090b]",
    bgHex: "#09090b",
    textHex: "#f4f4f5",
    borderHex: "#27272a",
    panelHex: "#121215",
    cardHex: "#18181b",
    metaHex: "#a1a1aa",
  },
  {
    id: "navy",
    name: "Midnight Navy",
    bg: "bg-[#080d1a]",
    bgHex: "#080d1a",
    textHex: "#cbd5e1",
    borderHex: "#1e293b",
    panelHex: "#0f172a",
    cardHex: "#1e293b",
    metaHex: "#64748b",
  },
  {
    id: "amethyst",
    name: "Dark Amethyst",
    bg: "bg-[#0e0919]",
    bgHex: "#0e0919",
    textHex: "#ede9fe",
    borderHex: "#2e1065",
    panelHex: "#180f28",
    cardHex: "#221538",
    metaHex: "#a78bfa",
  },
  {
    id: "sepia",
    name: "Warm Sepia",
    bg: "bg-[#f5ebd7]",
    bgHex: "#f5ebd7",
    textHex: "#382a1e",
    borderHex: "#dfd0b0",
    panelHex: "#ede0ca",
    cardHex: "#eedfc3",
    metaHex: "#7c6a55",
  },
  {
    id: "cream",
    name: "Paper Cream",
    bg: "bg-[#faf8f5]",
    bgHex: "#faf8f5",
    textHex: "#1e293b",
    borderHex: "#e2e8f0",
    panelHex: "#f1ede6",
    cardHex: "#e8e2d7",
    metaHex: "#64748b",
  },
  {
    id: "forest",
    name: "Forest Night",
    bg: "bg-[#08140e]",
    bgHex: "#08140e",
    textHex: "#d1fae5",
    borderHex: "#134e4a",
    panelHex: "#0c2016",
    cardHex: "#102a1d",
    metaHex: "#6ee7b7",
  },
  {
    id: "slate",
    name: "Slate Dusk",
    bg: "bg-[#0f172a]",
    bgHex: "#0f172a",
    textHex: "#cbd5e1",
    borderHex: "#334155",
    panelHex: "#1e293b",
    cardHex: "#26334d",
    metaHex: "#94a3b8",
  },
];

export const NOVEL_ACCENTS = [
  {
    id: "sky",
    name: "Sky Blue",
    hex: "#0284c7",
    hoverHex: "#0369a1",
    textHex: "#38bdf8",
    bgClass: "bg-[#0284c7]",
    glowHex: "rgba(2, 132, 199, 0.4)",
  },
  {
    id: "purple",
    name: "Royal Violet",
    hex: "#9333ea",
    hoverHex: "#7e22ce",
    textHex: "#c084fc",
    bgClass: "bg-[#9333ea]",
    glowHex: "rgba(147, 51, 234, 0.4)",
  },
  {
    id: "emerald",
    name: "Emerald Green",
    hex: "#10b981",
    hoverHex: "#059669",
    textHex: "#34d399",
    bgClass: "bg-[#10b981]",
    glowHex: "rgba(16, 185, 129, 0.4)",
  },
  {
    id: "amber",
    name: "Solar Gold",
    hex: "#f59e0b",
    hoverHex: "#d97706",
    textHex: "#fbbf24",
    bgClass: "bg-[#f59e0b]",
    glowHex: "rgba(245, 158, 11, 0.4)",
  },
  {
    id: "rose",
    name: "Crimson Rose",
    hex: "#f43f5e",
    hoverHex: "#e11d48",
    textHex: "#fb7185",
    bgClass: "bg-[#f43f5e]",
    glowHex: "rgba(244, 63, 94, 0.4)",
  },
  {
    id: "cyan",
    name: "Neon Cyan",
    hex: "#06b6d4",
    hoverHex: "#0891b2",
    textHex: "#22d3ee",
    bgClass: "bg-[#06b6d4]",
    glowHex: "rgba(6, 182, 212, 0.4)",
  },
  {
    id: "orange",
    name: "Flame Orange",
    hex: "#ea580c",
    hoverHex: "#c2410c",
    textHex: "#fb923c",
    bgClass: "bg-[#ea580c]",
    glowHex: "rgba(234, 88, 12, 0.4)",
  },
];

const TRANSLATION_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "pt", name: "Portuguese" },
  { code: "id", name: "Indonesian" },
  { code: "vi", name: "Vietnamese" },
  { code: "tl", name: "Tagalog" },
  { code: "ko", name: "Korean" },
  { code: "ja", name: "Japanese" },
  { code: "zh-CN", name: "Chinese" },
  { code: "ru", name: "Russian" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
];

const FONT_SIZE_STEPS = [14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34];

export interface NovelSettingsPanelProps {
  settings: NovelReaderSettings;
  updateSettings: (updater: Partial<NovelReaderSettings>) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  chapterTitle?: string;
  chapterNumber?: number;
  seriesSlug: string;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onOpenChapterList?: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  novelTextContent?: string;
}

export default function NovelSettingsPanel({
  settings,
  updateSettings,
  isOpen,
  onClose,
  onOpen,
  chapterTitle = "",
  chapterNumber,
  seriesSlug,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onOpenChapterList,
  isBookmarked,
  onToggleBookmark,
  novelTextContent = "",
}: NovelSettingsPanelProps) {
  // TTS State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState("1");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");

  // Translation State
  const [selectedLang, setSelectedLang] = useState("en");

  // Active Accent Config
  const activeAccent =
    NOVEL_ACCENTS.find((a) => a.id === settings.accentColor) || NOVEL_ACCENTS[0];

  // Active Theme Config
  const activeTheme =
    NOVEL_THEMES.find((t) => t.id === settings.theme) || NOVEL_THEMES[0];

  // Load Voices for Speech Synthesis
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const populateVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (allVoices.length > 0) {
        setVoices(allVoices);
        if (!selectedVoice) {
          const enVoice =
            allVoices.find(
              (v) =>
                v.lang.startsWith("en") &&
                (v.name.includes("David") ||
                  v.name.includes("Natural") ||
                  v.name.includes("Google") ||
                  v.name.includes("Samantha"))
            ) || allVoices[0];
          setSelectedVoice(enVoice.name);
        }
      }
    };

    populateVoices();
    window.speechSynthesis.onvoiceschanged = populateVoices;

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // TTS Controls
  const handlePlayTTS = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Text-to-speech is not supported in this browser");
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsSpeaking(true);
      setIsPaused(false);
      return;
    }

    window.speechSynthesis.cancel();

    // Strip HTML and clean text for audio narration
    const cleanText = novelTextContent
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanText) {
      toast.error("No chapter content to read aloud");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voiceObj = voices.find((v) => v.name === selectedVoice);
    if (voiceObj) utterance.voice = voiceObj;
    utterance.rate = parseFloat(ttsSpeed) || 1;

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setIsPaused(false);
  };

  const handlePauseTTS = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.pause();
    setIsSpeaking(false);
    setIsPaused(true);
  };

  const handleStopTTS = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  // Pre-load Google Translate Script and global callback once on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    (window as any).googleTranslateElementInit = () => {
      try {
        if ((window as any).google?.translate?.TranslateElement) {
          new (window as any).google.translate.TranslateElement(
            {
              pageLanguage: "auto",
              autoDisplay: false,
              layout: (window as any).google.translate.TranslateElement.InlineLayout?.SIMPLE,
            },
            "google_translate_element"
          );
        }
      } catch (e) {
        console.warn("Google translate element initialization note:", e);
      }
    };

    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.head.appendChild(script);
    } else if ((window as any).google?.translate?.TranslateElement) {
      (window as any).googleTranslateElementInit();
    }
  }, []);

  // Google Translate Helper
  const handleApplyTranslation = () => {
    if (typeof window === "undefined") return;

    const hostname = window.location.hostname;
    const hostParts = hostname.split(".");
    const rootDomain = hostParts.length > 1 ? hostParts.slice(-2).join(".") : hostname;

    const clearCookies = () => {
      const exp = "Thu, 01 Jan 1970 00:00:00 UTC";
      document.cookie = `googtrans=; expires=${exp}; path=/;`;
      document.cookie = `googtrans=; expires=${exp}; path=/; domain=${hostname};`;
      document.cookie = `googtrans=; expires=${exp}; path=/; domain=.${hostname};`;
      if (rootDomain !== hostname) {
        document.cookie = `googtrans=; expires=${exp}; path=/; domain=.${rootDomain};`;
      }
    };

    const setCookies = (val: string) => {
      document.cookie = `googtrans=${val}; path=/;`;
      document.cookie = `googtrans=${val}; path=/; domain=${hostname};`;
      document.cookie = `googtrans=${val}; path=/; domain=.${hostname};`;
      if (rootDomain !== hostname) {
        document.cookie = `googtrans=${val}; path=/; domain=.${rootDomain};`;
      }
    };

    if (selectedLang === "en") {
      clearCookies();
      const select = document.querySelector(".goog-te-combo") as any;
      if (select) {
        select.value = "en";
        select.dispatchEvent(new Event("change"));
        toast.success("Restored original language");
      } else {
        window.location.reload();
      }
      return;
    }

    const target = `/auto/${selectedLang}`;
    setCookies(target);

    const triggerCombo = () => {
      const select = document.querySelector(".goog-te-combo") as any;
      if (select) {
        select.value = selectedLang;
        select.dispatchEvent(new Event("change"));
        return true;
      }
      return false;
    };

    if (triggerCombo()) {
      const langObj = TRANSLATION_LANGUAGES.find((l) => l.code === selectedLang);
      toast.success(`Translating to ${langObj?.name || selectedLang}`);
      return;
    }

    // If combo isn't populated yet, poll briefly
    toast.loading("Activating translation...", { duration: 1200 });
    let attempts = 0;
    const timer = setInterval(() => {
      attempts++;
      if (triggerCombo()) {
        clearInterval(timer);
        const langObj = TRANSLATION_LANGUAGES.find((l) => l.code === selectedLang);
        toast.success(`Translating to ${langObj?.name || selectedLang}`);
      } else if (attempts > 8) {
        clearInterval(timer);
        // Fallback for strict browser adblockers (e.g. uBlock Origin) blocking in-page script
        toast("Opening Google Translate for this chapter...", { icon: "🌐" });
        window.open(
          `https://translate.google.com/translate?sl=auto&tl=${selectedLang}&u=${encodeURIComponent(window.location.href)}`,
          "_blank"
        );
      }
    }, 300);
  };

  const handleDecreaseFont = () => {
    const currentIndex = FONT_SIZE_STEPS.indexOf(settings.fontSize);
    if (currentIndex > 0) {
      updateSettings({ fontSize: FONT_SIZE_STEPS[currentIndex - 1] });
    } else if (settings.fontSize > 12) {
      updateSettings({ fontSize: settings.fontSize - 2 });
    }
  };

  const handleIncreaseFont = () => {
    const currentIndex = FONT_SIZE_STEPS.indexOf(settings.fontSize);
    if (currentIndex >= 0 && currentIndex < FONT_SIZE_STEPS.length - 1) {
      updateSettings({ fontSize: FONT_SIZE_STEPS[currentIndex + 1] });
    } else if (settings.fontSize < 38) {
      updateSettings({ fontSize: settings.fontSize + 2 });
    }
  };

  return (
    <>
      {/* ─── FLOATING ACTION BUTTON (Visible on bottom-left when drawer is closed) ─── */}
      {!isOpen && (
        <div className="fixed bottom-6 left-6 z-40 animate-in fade-in zoom-in-75 duration-200">
          <button
            onClick={onOpen}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl text-white font-semibold text-xs border border-white/10 backdrop-blur-xl transition-all duration-300 transform hover:scale-105 active:scale-95 group cursor-pointer"
            style={{
              backgroundColor: activeAccent.hex,
              boxShadow: `0 10px 25px -5px ${activeAccent.glowHex}`,
            }}
            title="Reader Preferences"
          >
            <Sliders className="h-4 w-4 transition-transform group-hover:rotate-45" />
            <span className="tracking-wide">Settings</span>
          </button>
        </div>
      )}

      {/* ─── DRAWER OVERLAY & SIDEBAR (LEFT) ─── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-start pointer-events-none">
          {/* Transparent Backdrop (no blur, no darkening, so preview layout is 100% visible live) */}
          <div
            onClick={onClose}
            className="fixed inset-0 bg-black/15 pointer-events-auto cursor-default"
          />

          {/* Drawer Panel */}
          <div
            className="relative w-full max-w-[390px] sm:max-w-[420px] h-full shadow-2xl flex flex-col z-10 transition-transform duration-300 ease-out animate-in slide-in-from-left select-none border-r overflow-hidden pointer-events-auto"
            style={{
              backgroundColor: activeTheme.panelHex,
              borderColor: activeTheme.borderHex,
              color: activeTheme.textHex,
              boxShadow: "0 20px 40px -10px rgba(0,0,0,0.8)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: activeTheme.borderHex }}
            >
              <div className="min-w-0 pr-3">
                <h3 className="text-sm sm:text-base font-bold truncate text-foreground">
                  {chapterNumber != null ? `Chapter ${chapterNumber}` : "Chapter"}
                  {chapterTitle ? `: ${chapterTitle}` : ""}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Navigation Action Row */}
            <div
              className="grid grid-cols-6 gap-1 px-4 py-3 border-b"
              style={{ borderColor: activeTheme.borderHex }}
            >
              {/* Prev Chapter */}
              <button
                disabled={!hasPrev}
                onClick={onPrev}
                className="flex items-center justify-center h-10 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer text-foreground"
                title="Previous Chapter"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Bookmark */}
              <button
                onClick={() => {
                  if (onToggleBookmark) {
                    onToggleBookmark();
                  } else {
                    toast.success("Bookmark updated");
                  }
                }}
                className={`flex items-center justify-center h-10 rounded-xl transition-colors cursor-pointer ${
                  isBookmarked
                    ? "text-white"
                    : "bg-white/5 hover:bg-white/10 text-foreground"
                }`}
                style={isBookmarked ? { backgroundColor: activeAccent.hex } : {}}
                title={isBookmarked ? "Bookmarked" : "Bookmark this chapter"}
              >
                <Bookmark className="h-4 w-4 fill-current" />
              </button>

              {/* Chapter List */}
              <button
                onClick={() => {
                  if (onOpenChapterList) onOpenChapterList();
                  else toast.info("Opening chapter list...");
                }}
                className="flex items-center justify-center h-10 rounded-xl bg-white/5 hover:bg-white/10 text-foreground transition-colors cursor-pointer"
                title="Chapter List / Contents"
              >
                <List className="h-4 w-4" />
              </button>

              {/* Home */}
              <NextLink
                href={`/title/${seriesSlug}`}
                className="flex items-center justify-center h-10 rounded-xl bg-white/5 hover:bg-white/10 text-foreground transition-colors cursor-pointer"
                title="Novel Overview"
              >
                <Home className="h-4 w-4" />
              </NextLink>

              {/* Settings (Active indicator) */}
              <button
                className="flex items-center justify-center h-10 rounded-xl text-white transition-colors cursor-default"
                style={{ backgroundColor: activeAccent.hex }}
                title="Reading Settings (Active)"
              >
                <Settings className="h-4 w-4" />
              </button>

              {/* Next Chapter */}
              <button
                disabled={!hasNext}
                onClick={onNext}
                className="flex items-center justify-center h-10 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer text-foreground"
                title="Next Chapter"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Settings Controls Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
              {/* 1. Font Family Selector */}
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-black/20 border border-white/5">
                  <button
                    onClick={() => updateSettings({ fontFamily: "default" })}
                    className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all cursor-pointer truncate ${
                      settings.fontFamily === "default"
                        ? "text-white shadow-md font-sans"
                        : "text-muted-foreground hover:text-foreground font-sans"
                    }`}
                    style={
                      settings.fontFamily === "default"
                        ? { backgroundColor: activeAccent.hex }
                        : {}
                    }
                  >
                    Default
                  </button>

                  <button
                    onClick={() => updateSettings({ fontFamily: "dyslexic" })}
                    className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all cursor-pointer truncate font-novel-dyslexic ${
                      settings.fontFamily === "dyslexic"
                        ? "text-white shadow-md"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    style={
                      settings.fontFamily === "dyslexic"
                        ? { backgroundColor: activeAccent.hex }
                        : {}
                    }
                  >
                    Dyslexic
                  </button>

                  <button
                    onClick={() => updateSettings({ fontFamily: "roboto" })}
                    className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all cursor-pointer truncate font-novel-roboto ${
                      settings.fontFamily === "roboto"
                        ? "text-white shadow-md"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    style={
                      settings.fontFamily === "roboto"
                        ? { backgroundColor: activeAccent.hex }
                        : {}
                    }
                  >
                    Roboto
                  </button>

                  <button
                    onClick={() => updateSettings({ fontFamily: "lora" })}
                    className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all cursor-pointer truncate font-novel-lora ${
                      settings.fontFamily === "lora"
                        ? "text-white shadow-md"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    style={
                      settings.fontFamily === "lora"
                        ? { backgroundColor: activeAccent.hex }
                        : {}
                    }
                  >
                    Lora
                  </button>
                </div>
              </div>

              {/* 2. Font Size Slider with Tick Steps */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <button
                    onClick={handleDecreaseFont}
                    className="p-1 hover:text-foreground cursor-pointer font-bold flex items-center gap-0.5"
                    title="Decrease font size"
                  >
                    <span>A⁻</span>
                  </button>

                  <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                    {FONT_SIZE_STEPS.map((step) => (
                      <button
                        key={step}
                        onClick={() => updateSettings({ fontSize: step })}
                        className={`cursor-pointer transition-colors ${
                          settings.fontSize === step
                            ? "font-bold text-foreground underline underline-offset-4"
                            : "opacity-60 hover:opacity-100"
                        }`}
                        style={
                          settings.fontSize === step
                            ? { color: activeAccent.textHex }
                            : {}
                        }
                      >
                        {step}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleIncreaseFont}
                    className="p-1 hover:text-foreground cursor-pointer font-bold flex items-center gap-0.5"
                    title="Increase font size"
                  >
                    <span>A⁺</span>
                  </button>
                </div>

                <Slider
                  min={14}
                  max={34}
                  step={2}
                  value={[settings.fontSize]}
                  onValueChange={([val]) => updateSettings({ fontSize: val })}
                  className="w-full cursor-pointer py-1"
                />
              </div>

              {/* 3. Translation Control */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Translation
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <select
                      value={selectedLang}
                      onChange={(e) => setSelectedLang(e.target.value)}
                      className="w-full h-9 rounded-xl bg-black/20 border border-white/10 px-3 pr-8 text-xs appearance-none focus:outline-none focus:ring-1 cursor-pointer text-foreground"
                      style={{ focusRingColor: activeAccent.hex } as any}
                    >
                      {TRANSLATION_LANGUAGES.map((l) => (
                        <option
                          key={l.code}
                          value={l.code}
                          className="bg-neutral-900 text-neutral-200"
                        >
                          {l.name}
                        </option>
                      ))}
                    </select>
                    <Globe className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>

                  <button
                    onClick={handleApplyTranslation}
                    className="h-9 px-3 rounded-xl text-white font-semibold text-xs transition-colors cursor-pointer shrink-0"
                    style={{ backgroundColor: activeAccent.hex }}
                  >
                    Select Lang
                  </button>
                </div>
                {/* Hidden container for Google Translate widget */}
                <div
                  id="google_translate_element"
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    opacity: 0,
                    pointerEvents: "none",
                    width: 1,
                    height: 1,
                    overflow: "hidden",
                  }}
                />
              </div>

              {/* 4. Text to Speech (TTS) Controls */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Text to Speech
                  </label>
                  {isSpeaking && (
                    <span
                      className="text-[10px] font-bold animate-pulse"
                      style={{ color: activeAccent.textHex }}
                    >
                      Narrating...
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 p-2 rounded-xl bg-black/20 border border-white/10">
                  {/* Play / Pause */}
                  <button
                    onClick={isSpeaking ? handlePauseTTS : handlePlayTTS}
                    className="h-9 w-9 flex items-center justify-center rounded-lg text-white transition-transform active:scale-95 cursor-pointer"
                    style={{ backgroundColor: activeAccent.hex }}
                    title={isSpeaking ? "Pause" : "Play"}
                  >
                    {isSpeaking ? (
                      <Pause className="h-4 w-4 fill-current" />
                    ) : (
                      <Play className="h-4 w-4 fill-current ml-0.5" />
                    )}
                  </button>

                  {/* Stop */}
                  <button
                    onClick={handleStopTTS}
                    disabled={!isSpeaking && !isPaused}
                    className="h-9 w-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-foreground transition-colors cursor-pointer"
                    title="Stop"
                  >
                    <Square className="h-3.5 w-3.5 fill-current" />
                  </button>

                  {/* Speed */}
                  <select
                    value={ttsSpeed}
                    onChange={(e) => setTtsSpeed(e.target.value)}
                    className="h-9 w-14 rounded-lg bg-white/5 border border-white/5 text-center text-xs font-semibold cursor-pointer text-foreground appearance-none"
                  >
                    <option value="0.75" className="bg-neutral-900 text-neutral-200">
                      0.75×
                    </option>
                    <option value="1" className="bg-neutral-900 text-neutral-200">
                      1×
                    </option>
                    <option value="1.25" className="bg-neutral-900 text-neutral-200">
                      1.25×
                    </option>
                    <option value="1.5" className="bg-neutral-900 text-neutral-200">
                      1.5×
                    </option>
                    <option value="2" className="bg-neutral-900 text-neutral-200">
                      2×
                    </option>
                  </select>

                  {/* Voice Selector */}
                  <div className="flex-1 min-w-0">
                    <select
                      value={selectedVoice}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                      className="w-full h-9 rounded-lg bg-white/5 border border-white/5 px-2 text-xs truncate cursor-pointer text-foreground appearance-none"
                      title={selectedVoice}
                    >
                      {voices.map((v) => (
                        <option
                          key={v.name}
                          value={v.name}
                          className="bg-neutral-900 text-neutral-200"
                        >
                          {v.name} ({v.lang})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 5. Reading Settings Toggles */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Read Setting
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {/* Text Indent */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/5">
                    <span className="text-xs font-medium text-foreground">
                      Text Indent
                    </span>
                    <Switch
                      checked={settings.textIndent}
                      onCheckedChange={(checked) =>
                        updateSettings({ textIndent: checked })
                      }
                    />
                  </div>

                  {/* Bionic Reading */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/5">
                    <span className="text-xs font-medium text-foreground">
                      Bionic Reading
                    </span>
                    <Switch
                      checked={settings.bionicReading}
                      onCheckedChange={(checked) =>
                        updateSettings({ bionicReading: checked })
                      }
                    />
                  </div>
                </div>

                {/* Copy Text */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/5">
                  <span className="text-xs font-medium text-foreground">
                    Copy Text
                  </span>
                  <Switch
                    checked={settings.copyText}
                    onCheckedChange={(checked) =>
                      updateSettings({ copyText: checked })
                    }
                  />
                </div>
              </div>

              {/* 6. Text Alignment Controls */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Text Alignment
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "left", icon: AlignLeft, label: "Left" },
                    { id: "center", icon: AlignCenter, label: "Center" },
                    { id: "right", icon: AlignRight, label: "Right" },
                    { id: "justify", icon: AlignJustify, label: "Justify" },
                  ].map(({ id, icon: Icon, label }) => {
                    const isActive = settings.textAlign === id;
                    return (
                      <button
                        key={id}
                        onClick={() => updateSettings({ textAlign: id as any })}
                        className={`h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                          isActive
                            ? "text-white shadow-md"
                            : "bg-black/20 border border-white/5 text-muted-foreground hover:text-foreground"
                        }`}
                        style={isActive ? { backgroundColor: activeAccent.hex } : {}}
                        title={label}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 7. Line Height Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                    Line Height
                  </span>
                  <span
                    className="font-mono font-bold"
                    style={{ color: activeAccent.textHex }}
                  >
                    {settings.lineHeight.toFixed(1)}
                  </span>
                </div>
                <Slider
                  min={1.2}
                  max={3.0}
                  step={0.1}
                  value={[settings.lineHeight]}
                  onValueChange={([val]) => updateSettings({ lineHeight: val })}
                  className="w-full cursor-pointer py-1"
                />
              </div>

              {/* 8. Paragraph Spacing Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                    Paragraph Spacing
                  </span>
                  <span
                    className="font-mono font-bold"
                    style={{ color: activeAccent.textHex }}
                  >
                    {Math.max(18, settings.paragraphSpacing)}px
                  </span>
                </div>
                <Slider
                  min={18}
                  max={64}
                  step={2}
                  value={[Math.max(18, settings.paragraphSpacing)]}
                  onValueChange={([val]) =>
                    updateSettings({ paragraphSpacing: val })
                  }
                  className="w-full cursor-pointer py-1"
                />
              </div>

              {/* 9. Page Width Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                    Page Width
                  </span>
                  <span
                    className="font-mono font-bold"
                    style={{ color: activeAccent.textHex }}
                  >
                    {settings.pageWidth}%
                  </span>
                </div>
                <Slider
                  min={50}
                  max={100}
                  step={5}
                  value={[settings.pageWidth]}
                  onValueChange={([val]) => updateSettings({ pageWidth: val })}
                  className="w-full cursor-pointer py-1"
                />
              </div>

              {/* 10. Scroll Settings */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Scroll Settings
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {/* Auto Scroll */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/5">
                    <span className="text-xs font-medium text-foreground">
                      Auto Scroll
                    </span>
                    <Switch
                      checked={settings.autoScroll}
                      onCheckedChange={(checked) =>
                        updateSettings({ autoScroll: checked })
                      }
                    />
                  </div>

                  {/* Auto Next */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/5">
                    <span className="text-xs font-medium text-foreground">
                      Auto Next
                    </span>
                    <Switch
                      checked={settings.autoNext}
                      onCheckedChange={(checked) =>
                        updateSettings({ autoNext: checked })
                      }
                    />
                  </div>
                </div>

                {/* Auto Scroll Speed slider if enabled */}
                {settings.autoScroll && (
                  <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-1.5 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground text-[11px]">
                        Scroll Speed
                      </span>
                      <span
                        className="font-mono font-bold text-[11px]"
                        style={{ color: activeAccent.textHex }}
                      >
                        {settings.autoScrollSpeed}×
                      </span>
                    </div>
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={[settings.autoScrollSpeed]}
                      onValueChange={([val]) =>
                        updateSettings({ autoScrollSpeed: val })
                      }
                      className="w-full cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* 11. Background Theme Swatches */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Background (Dark mode & Themes)
                </label>

                <div className="grid grid-cols-4 gap-2">
                  {NOVEL_THEMES.map((t) => {
                    const isSelected = settings.theme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => updateSettings({ theme: t.id })}
                        className={`h-10 rounded-xl border-2 transition-all flex items-center justify-center cursor-pointer relative ${
                          isSelected
                            ? "scale-105 shadow-md"
                            : "opacity-80 hover:opacity-100 hover:scale-102"
                        }`}
                        style={{
                          backgroundColor: t.bgHex,
                          borderColor: isSelected
                            ? activeAccent.hex
                            : t.borderHex,
                        }}
                        title={t.name}
                      >
                        {isSelected && (
                          <Check
                            className="h-4 w-4 stroke-[3]"
                            style={{
                              color:
                                t.id === "sepia" || t.id === "cream"
                                  ? "#18181b"
                                  : activeAccent.textHex,
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 12. Highlight / Accent Color Swatches */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Highlight (buttons, links, tags...)
                </label>

                <div className="grid grid-cols-7 gap-1.5">
                  {NOVEL_ACCENTS.map((a) => {
                    const isSelected = settings.accentColor === a.id;
                    return (
                      <button
                        key={a.id}
                        onClick={() => updateSettings({ accentColor: a.id })}
                        className={`h-8 rounded-lg transition-all flex items-center justify-center cursor-pointer relative ${
                          isSelected
                            ? "ring-2 ring-white scale-110 shadow-lg"
                            : "opacity-85 hover:opacity-100 hover:scale-105"
                        }`}
                        style={{ backgroundColor: a.hex }}
                        title={a.name}
                      >
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-white stroke-[3]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
