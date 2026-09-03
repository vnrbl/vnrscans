"use client";

import React, { useState, useEffect } from "react";
import { Download, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already running as standalone PWA
    const checkStandalone = () => {
      const isDisplayStandalone = window.matchMedia("(display-mode: standalone)").matches;
      const isNavStandalone = (window.navigator as any).standalone === true;
      setIsStandalone(isDisplayStandalone || isNavStandalone);
    };
    checkStandalone();

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Capture install event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Check if user previously dismissed it within 7 days
      const dismissed = localStorage.getItem("vnr-pwa-dismissed");
      if (dismissed && Date.now() - parseInt(dismissed, 10) < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    try {
      localStorage.setItem("vnr-pwa-dismissed", Date.now().toString());
    } catch {}
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-50 sm:max-w-sm rounded-2xl border border-primary/40 bg-card/95 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white shadow-md">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">Install vnrscans App</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Instant fullscreen reading, offline mode & faster load times!
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
          title="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={handleDismiss} className="text-xs h-8">
          Later
        </Button>
        <Button
          size="sm"
          onClick={handleInstall}
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold h-8 px-3.5 gap-1.5 shadow-md"
        >
          <Download className="h-3.5 w-3.5" />
          Install
        </Button>
      </div>
    </div>
  );
}
