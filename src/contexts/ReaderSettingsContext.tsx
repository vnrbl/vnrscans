"use client";

import { createContext, useContext, useEffect, useState } from "react";

export interface ReaderSettings {
  readingDirection: "ltr" | "rtl" | "vertical";
  pageFit: "width" | "height" | "original";
  readingMode: "page" | "webtoon";
  imageQuality: "high" | "medium" | "low";
  autoScrollSpeed: number;
  showNovelsOnHome: boolean;
}

const defaultSettings: ReaderSettings = {
  readingDirection: "ltr",
  pageFit: "width",
  readingMode: "page",
  imageQuality: "high",
  autoScrollSpeed: 50,
  showNovelsOnHome: false,
};

interface ReaderSettingsContextType {
  settings: ReaderSettings;
  updateSettings: (newSettings: Partial<ReaderSettings>) => void;
}

const ReaderSettingsContext = createContext<ReaderSettingsContextType | undefined>(undefined);

export function ReaderSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ReaderSettings>(defaultSettings);
  const [mounted, setMounted] = useState(false);

  // Load settings from localStorage on client side only
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("readerSettings");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (e) {
        console.error("Failed to parse reader settings:", e);
      }
    }
  }, []);

  const updateSettings = (newSettings: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (mounted) {
        localStorage.setItem("readerSettings", JSON.stringify(updated));
      }
      return updated;
    });
  };

  return (
    <ReaderSettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </ReaderSettingsContext.Provider>
  );
}

export function useReaderSettings() {
  const context = useContext(ReaderSettingsContext);
  if (context === undefined) {
    throw new Error("useReaderSettings must be used within a ReaderSettingsProvider");
  }
  return context;
}
