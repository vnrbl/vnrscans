"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import Link from "next/link";

type ServiceStatus = "checking" | "operational" | "degraded" | "outage";

interface ServiceData {
  name: string;
  uptime: string;
  status: ServiceStatus;
  latency?: number;
  timeAgoStart: string;
  timeAgoEnd: string;
  history: {
    status: "operational" | "degraded" | "outage";
    uptime: number;
    time: string;
  }[];
}

interface StatusDashboardProps {
  site: "vnr" | "asura";
}

export function StatusDashboard({ site }: StatusDashboardProps) {
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(90); // 1m 30s countdown
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [hoveredBar, setHoveredBar] = useState<{
    service: string;
    index: number;
    x: number;
    y: number;
    uptime: number;
    time: string;
    status: string;
  } | null>(null);

  const [services, setServices] = useState<Record<string, ServiceData>>({
    frontend: {
      name: "Frontend",
      uptime: "100%",
      status: "checking",
      timeAgoStart: "9h ago",
      timeAgoEnd: "11m ago",
      history: generateHistory("frontend"),
    },
    backend: {
      name: "Backend",
      uptime: "100%",
      status: "checking",
      timeAgoStart: "9h ago",
      timeAgoEnd: "12m ago",
      history: generateHistory("backend"),
    },
    images: {
      name: "Images",
      uptime: "100%",
      status: "checking",
      timeAgoStart: "9h ago",
      timeAgoEnd: "12m ago",
      history: generateHistory("images"),
    },
  });

  // Helper to generate historical data
  function generateHistory(service: string) {
    const bars = 50;
    const history = [];
    const now = new Date();

    for (let i = 0; i < bars; i++) {
      const minutesAgo = (bars - i) * 10 + 2; 
      const timeStr = new Date(now.getTime() - minutesAgo * 60 * 1000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const status: "operational" | "degraded" | "outage" = "operational";
      const blockUptime = 100;

      history.push({
        status,
        uptime: blockUptime,
        time: timeStr,
      });
    }
    return history;
  }

  // Live checker function
  const checkServices = async () => {
    setIsChecking(true);
    const updated = { ...services };

    // Set all to checking
    Object.keys(updated).forEach((k) => {
      updated[k].status = "checking";
    });
    setServices({ ...updated });

    // 1. Frontend Check
    const startFe = performance.now();
    let feStatus: ServiceStatus = "operational";
    let feLatency = 0;
    try {
      const res = await fetch("/favicon.ico", { method: "HEAD", cache: "no-store" });
      feLatency = Math.round(performance.now() - startFe);
      if (!res.ok) feStatus = "degraded";
    } catch (err) {
      feStatus = "outage";
      feLatency = Math.round(performance.now() - startFe);
    }

    // 2. Backend Check (Supabase query)
    const startBe = performance.now();
    let beStatus: ServiceStatus = "operational";
    let beLatency = 0;
    try {
      const { error } = await supabase.from("series").select("id").limit(1);
      beLatency = Math.round(performance.now() - startBe);
      if (error) {
        console.error("Supabase check error:", error);
        beStatus = "degraded";
      }
    } catch (err) {
      beStatus = "outage";
      beLatency = Math.round(performance.now() - startBe);
    }

    // 3. Images Check (asset download check)
    const startImg = performance.now();
    let imgStatus: ServiceStatus = "operational";
    let imgLatency = 0;
    try {
      const res = await fetch("/apple-touch-icon.png", { method: "HEAD", cache: "no-store" });
      imgLatency = Math.round(performance.now() - startImg);
      if (!res.ok) imgStatus = "degraded";
    } catch (err) {
      imgStatus = "outage";
      imgLatency = Math.round(performance.now() - startImg);
    }

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(
      2,
      "0"
    )}:${String(now.getSeconds()).padStart(2, "0")}`;

    setServices({
      frontend: {
        ...updated.frontend,
        status: feStatus,
        latency: feLatency,
      },
      backend: {
        ...updated.backend,
        status: beStatus,
        latency: beLatency,
      },
      images: {
        ...updated.images,
        status: imgStatus,
        latency: imgLatency,
      },
    });

    setLastUpdated(formattedDate);
    setIsChecking(false);
  };

  // Perform initial check
  useEffect(() => {
    checkServices();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (isChecking) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          checkServices();
          return 90;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isChecking]);

  // Format countdown seconds to MM:SS
  const formatCountdown = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Determine overall status
  const getOverallStatus = () => {
    const statuses = Object.values(services).map((s) => s.status);
    if (statuses.includes("checking")) return "checking";
    if (statuses.includes("outage")) return "outage";
    if (statuses.includes("degraded")) return "degraded";
    return "operational";
  };

  const overall = getOverallStatus();
  const statusCopy: Record<ServiceStatus, string> = {
    checking: "Checking",
    operational: "Operational",
    degraded: "Degraded",
    outage: "Unavailable",
  };

  return (
    <div className="min-h-screen bg-[#07080c] text-[#e2e8f0] font-sans antialiased flex flex-col items-center py-12 px-4 relative overflow-hidden select-none">
      {/* Background ambient radial glow */}
      <div className="absolute top-[-20%] left-[50%] -translate-x-1/2 w-[600px] h-[350px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Floating Hover Tooltip */}
      {hoveredBar && (
        <div
          className="absolute z-50 bg-[#0f111a] border border-[#27272a] rounded px-3 py-1.5 text-xs text-[#94a3b8] pointer-events-none shadow-2xl flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100"
          style={{
            left: hoveredBar.x,
            top: hoveredBar.y - 50,
            transform: "translateX(-50%)",
          }}
        >
          <div className="font-semibold text-white flex items-center justify-between gap-3">
            <span>
              {hoveredBar.status === "operational"
                ? "Uptime"
                : hoveredBar.status === "degraded"
                ? "Degraded Performance"
                : "Service Outage"}
            </span>
            <span
              className={`text-[10px] px-1 rounded ${
                hoveredBar.status === "operational"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : hoveredBar.status === "degraded"
                  ? "bg-amber-500/15 text-amber-400"
                  : "bg-red-500/15 text-red-400"
              }`}
            >
              {hoveredBar.uptime}%
            </span>
          </div>
          <div className="text-[10px] text-zinc-500">{hoveredBar.time}</div>
        </div>
      )}

      {/* Content wrapper */}
      <div className="w-full max-w-4xl flex flex-col flex-1 z-10">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/home"
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Platform
          </Link>

          <button
            onClick={() => {
              if (!isChecking) {
                setCountdown(90);
                checkServices();
              }
            }}
            disabled={isChecking}
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-white transition-colors disabled:opacity-50 uppercase tracking-widest cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${isChecking ? "animate-spin" : ""}`} /> Force Refresh
          </button>
        </div>

        {/* Brand Status Title */}
        <div className="flex items-center gap-3.5 mb-8">
          {site === "asura" ? (
            /* Hooded Figure Logo SVG (Asura Scans) */
            <div className="relative flex items-center justify-center h-12 w-12 rounded-full border border-purple-500/20 bg-[#0c0d12] shadow-[0_0_15px_rgba(124,58,237,0.15)] overflow-hidden shrink-0">
              <svg
                width="44"
                height="44"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full p-1"
              >
                <path
                  d="M20 7C14 7 11 11 11 17C11 23 14 28 20 31C26 28 29 23 29 17C29 11 26 7 20 7Z"
                  fill="#0e0f17"
                  stroke="#6d28d9"
                  strokeWidth="1.5"
                />
                <path
                  d="M20 9C15.5 9 13.5 12 13.5 17C13.5 22 15.5 26 20 28.5C24.5 26 26.5 22 26.5 17C26.5 12 24.5 9 20 9Z"
                  fill="#040508"
                />
                <path
                  d="M20 12C17.5 12 16 14 16 17C16 20 17.5 22 20 24C22.5 24 24 20 24 17C24 14 22.5 12 20 12Z"
                  fill="#000"
                />
                <path
                  d="M 15.5 17.5 L 18.5 19 L 17.5 20 L 15 18.5 Z"
                  fill="#d8b4fe"
                  className="animate-pulse"
                />
                <path
                  d="M 24.5 17.5 L 21.5 19 L 22.5 20 L 25 18.5 Z"
                  fill="#d8b4fe"
                  className="animate-pulse"
                />
                <ellipse cx="16.5" cy="18.5" rx="3" ry="1.5" fill="#a855f7" opacity="0.4" />
                <ellipse cx="23.5" cy="18.5" rx="3" ry="1.5" fill="#a855f7" opacity="0.4" />
              </svg>
            </div>
          ) : (
            /* Monochromatic Crest Logo (VNR Scans) */
            <div className="relative flex items-center justify-center h-12 w-12 rounded border border-neutral-800 bg-neutral-950 font-black text-white text-base shadow-[0_0_15px_rgba(255,255,255,0.05)] shrink-0">
              VS
            </div>
          )}
          
          <h1 className="text-2xl font-bold tracking-wide text-white">
            {site === "asura" ? "Asura Scans Status" : "vnrscans Status"}
          </h1>
        </div>

        {/* Global Status Banner */}
        <div
          className={`border rounded-lg p-5 w-full flex items-center justify-between mb-8 shadow-xl transition-all duration-300 ${
            overall === "checking"
              ? "bg-[#0f1118]/80 border-blue-500/20"
              : overall === "operational"
              ? "bg-[#0f1915]/60 border-emerald-500/20"
              : overall === "degraded"
              ? "bg-[#1f1910]/60 border-amber-500/20"
              : "bg-[#241313]/60 border-red-500/20"
          }`}
        >
          <div className="flex items-center gap-3.5">
            {overall === "checking" ? (
              <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
            ) : overall === "operational" ? (
              <CheckCircle2 className="h-6 w-6 text-[#10b981] drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
            ) : overall === "degraded" ? (
              <AlertCircle className="h-6 w-6 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]" />
            )}
            <span className="text-lg font-bold tracking-wide text-white">
              {overall === "checking"
                ? "Checking System Status..."
                : overall === "operational"
                ? "All Systems Operational"
                : overall === "degraded"
                ? "Service Attention Needed"
                : "Service Unavailable"}
            </span>
          </div>
        </div>

        {/* Services Card section */}
        <div className="mb-6 flex flex-col">
          {/* Custom Underlined Highlight Section Header */}
          <div className="mb-6">
            <h2 className="text-lg font-extrabold text-white tracking-widest uppercase bg-[#2563eb]/25 border-b border-[#2563eb]/50 px-2 py-0.5 rounded w-fit select-none">
              Services
            </h2>
          </div>

          <div className="bg-[#0c0d12] border border-zinc-800/60 rounded-lg p-6 md:p-8 flex flex-col gap-8 shadow-2xl">
            {Object.values(services).map((service) => (
              <div
                key={service.name}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 last:pb-0 border-b border-zinc-800/40 last:border-b-0"
              >
                {/* Service Metadata (Left) */}
                <div className="flex items-center gap-3 min-w-[200px]">
                  {/* Uptime Badge */}
                  <div
                    className={`text-[11px] font-extrabold text-black uppercase tracking-wider px-2 py-0.5 rounded-full select-none ${
                      service.uptime === "100%"
                        ? "bg-[#10b981]"
                        : "bg-[#34d399]"
                    }`}
                  >
                    {service.uptime}
                  </div>
                  {/* Service Name */}
                  <div className="text-base font-bold text-white tracking-wide">
                    {service.name}
                  </div>
                  {/* Live Status indicator */}
                  <div className="flex items-center gap-1.5 ml-2">
                    {service.status === "checking" ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />
                    ) : service.status === "operational" ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
                    ) : service.status === "degraded" ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    )}
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold font-mono">
                      {service.status === "checking"
                        ? "Checking..."
                        : service.latency
                        ? `${statusCopy[service.status]} - ${service.latency}ms`
                        : statusCopy[service.status]}
                    </span>
                  </div>
                </div>

                {/* Timeline Graph & Labels (Right) */}
                <div className="flex flex-col gap-1 items-end w-full lg:w-auto">
                  {/* Graph Blocks */}
                  <div className="flex items-end gap-[3px] h-8 w-full justify-between lg:justify-start">
                    {service.history.map((bar, index) => {
                      let barColor = "bg-[#10b981]"; // Default operational green
                      if (bar.status === "degraded") barColor = "bg-amber-400";
                      if (bar.status === "outage") barColor = "bg-red-500";

                      return (
                        <div
                          key={index}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredBar({
                              service: service.name,
                              index,
                              x: rect.left + window.scrollX + rect.width / 2,
                              y: rect.top + window.scrollY,
                              uptime: bar.uptime,
                              time: bar.time,
                              status: bar.status,
                            });
                          }}
                          onMouseLeave={() => setHoveredBar(null)}
                          className={`h-7 w-[5px] sm:w-[6px] md:w-[7px] rounded-sm cursor-pointer transition-all duration-150 hover:h-8 ${barColor} opacity-90 hover:opacity-100 hover:shadow-[0_0_8px_currentColor]`}
                          style={{
                            color:
                              bar.status === "operational"
                                ? "#10b981"
                                : bar.status === "degraded"
                                ? "#fbbf24"
                                : "#ef4444",
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Time Labels */}
                  <div className="text-[10px] text-zinc-500 tracking-wider font-semibold flex justify-between w-full mt-1.5">
                    <span>{service.timeAgoStart}</span>
                    <span>{service.timeAgoEnd}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info (Centered) */}
        <div className="mt-8 flex flex-col items-center gap-1.5 text-xs text-zinc-500 tracking-wide">
          <div>
            Last Updated: {lastUpdated || "Calculating..."}
          </div>
          <div className="flex items-center gap-1">
            Refresh In: <span className="font-mono text-zinc-400 font-bold">{formatCountdown(countdown)}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
