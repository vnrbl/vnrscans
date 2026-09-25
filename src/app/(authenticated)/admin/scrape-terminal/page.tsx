"use client";

import { Link, useNavigate } from "@/lib/router-compat";
import { useState, useRef, useEffect } from "react";
import { $runCloudScrape, $syncAllSeriesImportSources, $syncDueScheduledSeries, $scanAllSeriesTimings } from "@/lib/api/scraper.actions";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/adminLog";


type Step =
  | "AWAITING_SERIES_OPTION"
  | "AWAITING_SEARCH_QUERY"
  | "AWAITING_SEARCH_SELECTION"
  | "AWAITING_MANUAL_UUID"
  | "AWAITING_URL"
  | "AWAITING_IMAGE_EXAMPLE"
  | "AWAITING_SCANLATION_GROUP"
  | "AWAITING_UPLOADER"
  | "AWAITING_CONFIRM"
  | "PROCESSING";

type SeriesOption = {
  id: string;
  title: string;
  slug?: string | null;
};

type ScrapeContext = {
  seriesId?: string | null;
  seriesTitle?: string | null;
  searchMatches?: SeriesOption[];
  url?: string;
  imageUrlExample?: string | null;
  scanlationGroup?: string | null;
  uploader?: string | null;
};

const inferSourceGroup = (sourceUrl: string) => {
  try {
    const host = new URL(sourceUrl).hostname.replace(/^www\./, "").toLowerCase();
    if (host.includes("hivetoon")) return "Hive Toons";
    if (host.includes("asura")) return "Asura Scans";
    if (host.includes("vortex")) return "Vortex Scans";
    if (host.includes("elftoon")) return "Elf Toons";
    if (host.includes("qiscan") || host.includes("qimanga")) return "Qi Scans";
    return new URL(sourceUrl).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

const formatSeriesPrompt = (seriesList: SeriesOption[]) => [
  "📚 --- vnrscans Cloud Scraper Terminal --- 📚",
  "bash: cloud scraper shell ready",
  "",
  "Available Series in database:",
  ...seriesList.map((series, index) => `  [${index + 1}] ${series.title}`),
  "  [R] ⏱️ Check & Import Due Scheduled Series (Estimated Next Release)",
  "  [T] 🔍 Scan & Recalculate Scan Timings for All Series",
  "  [A] ⚡ Sync ALL Series' New Chapters (Automated Update)",
  "  [S] Search by Title",
  "  [M] Enter UUID manually",
  "  [skip] Press Enter to run without DB linking (Dry-run)",
  "",
  "Choose a series option: ",
];

export default function ScrapeTerminal() {
  const [output, setOutput] = useState<string[]>([
    "📚 --- vnrscans Cloud Scraper Terminal --- 📚",
    "bash: loading scraper shell...",
    "",
  ]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState<Step>("AWAITING_SERIES_OPTION");
  const [context, setContext] = useState<ScrapeContext>({});
  const [seriesList, setSeriesList] = useState<SeriesOption[]>([]);
  const [sessionClosed, setSessionClosed] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const runTokenRef = useRef(0);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [output]);

  const appendLine = (line: string) => {
    setOutput((prev) => [...prev, line]);
  };

  const appendLines = (lines: string[]) => {
    setOutput((prev) => [...prev, ...lines]);
  };

  const printSeriesPrompt = () => {
    appendLines([
      "",
      "Available Series in database:",
      ...seriesList.map((series, index) => `  [${index + 1}] ${series.title}`),
      "  [S] Search by Title",
      "  [M] Enter UUID manually",
      "  [skip] Press Enter to run without DB linking (Dry-run)",
      "",
      "Choose a series option: ",
    ]);
  };

  const clearTerminal = () => {
    setOutput(formatSeriesPrompt(seriesList));
    setStep("AWAITING_SERIES_OPTION");
    setContext({});
    setInput("");
    setSessionClosed(false);
  };

  const interruptTerminal = () => {
    runTokenRef.current += 1;
    setInput("");
    setContext({});
    setSessionClosed(false);
    setStep("AWAITING_SERIES_OPTION");
    appendLines(["^C", "Interrupted.", ...formatSeriesPrompt(seriesList)]);
  };

  const exitTerminal = () => {
    runTokenRef.current += 1;
    setInput("");
    setContext({});
    setSessionClosed(true);
    setStep("AWAITING_SERIES_OPTION");
    appendLines(["logout", "Session closed. Type `clear` or refresh the page to start again."]);
  };

  useEffect(() => {
    const handleGlobalKeys = (event: KeyboardEvent) => {
      if (!event.ctrlKey) return;

      const key = event.key.toLowerCase();
      if (key === "c") {
        event.preventDefault();
        interruptTerminal();
      }

      if (key === "l") {
        event.preventDefault();
        clearTerminal();
      }
    };

    window.addEventListener("keydown", handleGlobalKeys);
    return () => window.removeEventListener("keydown", handleGlobalKeys);
  }, [seriesList]);

  useEffect(() => {
    let cancelled = false;

    const loadSeries = async () => {
      const { data, error } = await supabase
        .from("series")
        .select("id, title, slug")
        .order("title");

      if (cancelled) return;

      if (error) {
        appendLines([
          "❌ Failed to fetch series list: " + error.message,
          "Type [M] to enter UUID manually, or press Enter for dry-run.",
          "",
          "Choose a series option: ",
        ]);
        return;
      }

      const list = data ?? [];
      setSeriesList(list);

      if (list.length === 0) {
        appendLines([
          "⚠️ No series found in the database. Please create a series first.",
          "Type [M] to enter UUID manually, or press Enter for dry-run.",
          "",
          "Choose a series option: ",
        ]);
        return;
      }

      setOutput(formatSeriesPrompt(list));
    };

    loadSeries();

    return () => {
      cancelled = true;
    };
  }, []);

  const resetToUrlPrompt = () => {
    setStep("AWAITING_URL");
    appendLine("");
    appendLine("Enter Series URL to scrape: ");
  };

  const processScrape = async (ctx: ScrapeContext) => {
    const runToken = runTokenRef.current;
    const { seriesId, url, imageUrlExample, scanlationGroup, uploader } = ctx;

    if (!url) {
      appendLine("❌ Missing source URL.");
      resetToUrlPrompt();
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      appendLine("❌ You must be signed in as admin to run the cloud scraper.");
      if (runToken !== runTokenRef.current) return;
      resetToUrlPrompt();
      return;
    }

    try {
      const result = await $runCloudScrape({
        data: {
          accessToken,
          seriesId: seriesId || null,
          url,
          imageUrlExample: imageUrlExample || "",
          scanlationGroup: scanlationGroup || inferSourceGroup(url) || null,
          uploader: uploader || null,
        },
      });

      if (runToken !== runTokenRef.current) return;

      if (!result.success) {
        appendLine("❌ Error: " + (result.error || "Cloud scrape failed"));
        resetToUrlPrompt();
        return;
      }

      appendLine("✅ Discovered " + result.chaptersFound + " chapter(s).");
      appendLine("📊 Stats:");
      appendLine(`  - Already in DB for this scan/group: ${result.skipped}`);
      appendLine(`  - Imported: ${result.imported}`);
      appendLine(`  - Failed: ${result.failed}`);

      if (result.dryRun) {
        appendLine("");
        appendLine("[Dry-run] Source chapter list:");
      } else if (result.details.length > 0) {
        appendLine("");
        appendLine("Import details:");
      }

      result.details.slice(0, 50).forEach((entry: any) => {
        const suffix = entry.pages ? ` (${entry.pages} pages)` : entry.message ? ` - ${entry.message}` : "";
        appendLine(`  - Chapter ${entry.chapter}: ${entry.status}${suffix}`);
      });

      if (result.details.length > 50) {
        appendLine(`  ... ${result.details.length - 50} more`);
      }

      appendLine("");
      appendLine("📊 --- Import Complete --- 📊");
      await logAdminAction("scrape", "series", undefined, {
        url,
        chaptersFound: result.chaptersFound,
        imported: result.imported,
        failed: result.failed,
        skipped: result.skipped,
        dryRun: !!result.dryRun,
      });
    } catch (err: unknown) {
      if (runToken !== runTokenRef.current) return;
      appendLine("❌ Fatal Error: " + (err instanceof Error ? err.message : "Cloud scrape failed"));
      resetToUrlPrompt();
      return;
    }

    appendLine("");
    appendLine("---");
    printSeriesPrompt();
    setStep("AWAITING_SERIES_OPTION");
    setContext({});
  };

  const handleInput = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey && e.key.toLowerCase() === "c") {
      e.preventDefault();
      e.stopPropagation();
      interruptTerminal();
      return;
    }

    if (e.key !== "Enter") return;
    if (step === "PROCESSING") return;

    const val = input.trim();
    setInput("");
    appendLine("> " + val);

    if (val.toLowerCase() === "clear") {
      clearTerminal();
      return;
    }

    if (val.toLowerCase() === "exit") {
      exitTerminal();
      return;
    }

    if (sessionClosed) {
      appendLine("Session is closed. Type `clear` to start again.");
      return;
    }

    if (step === "AWAITING_SERIES_OPTION") {
      const choice = val.toLowerCase();

      if (choice === "r") {
        setStep("PROCESSING");
        appendLine("");
        appendLine("⏱️ Checking all series on their Estimated Next Release timing...");
        appendLine("Holding newly imported chapters for 30 minutes with direct source links...");

        (async () => {
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData.session?.access_token;
            if (!accessToken) {
              appendLine("❌ You must be signed in as admin.");
              printSeriesPrompt();
              setStep("AWAITING_SERIES_OPTION");
              return;
            }

            const res = await $syncDueScheduledSeries({
              data: { accessToken, forceAll: false, maxChaptersPerSeries: 25 },
            });

            if (!res.success) {
              appendLine(`❌ Scheduled check failed: ${res.error || "Unknown error"}`);
            } else {
              appendLine(`✅ Scheduled Check Complete!`);
              appendLine(`📊 Due Sources Processed: ${res.totalProcessed} (Total Due: ${res.totalDue})`);
              appendLine(`✨ New Chapters Imported: ${res.totalImported} (30-min unlock hold applied)`);
              if (res.results && res.results.length > 0) {
                appendLine("");
                appendLine("Summary:");
                res.results.forEach((r: any) => {
                  appendLine(`  - ${r.seriesTitle}: ${r.imported} imported [${r.status}]`);
                });
              }
            }
          } catch (err: any) {
            appendLine(`❌ Fatal error: ${err.message}`);
          } finally {
            appendLine("");
            appendLine("---");
            printSeriesPrompt();
            setStep("AWAITING_SERIES_OPTION");
          }
        })();
        return;
      }

      if (choice === "t") {
        setStep("PROCESSING");
        appendLine("");
        appendLine("🔍 Scanning source update timings and recalculating Estimated Next Release times...");

        (async () => {
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData.session?.access_token;
            if (!accessToken) {
              appendLine("❌ You must be signed in as admin.");
              printSeriesPrompt();
              setStep("AWAITING_SERIES_OPTION");
              return;
            }

            const res = await $scanAllSeriesTimings({
              data: { accessToken },
            });

            if (!res.success) {
              appendLine(`❌ Timing scan failed: ${res.error || "Unknown error"}`);
            } else {
              appendLine(`✅ Timing Scan Complete!`);
              appendLine(`⏱️ ${res.message}`);
            }
          } catch (err: any) {
            appendLine(`❌ Fatal error: ${err.message}`);
          } finally {
            appendLine("");
            appendLine("---");
            printSeriesPrompt();
            setStep("AWAITING_SERIES_OPTION");
          }
        })();
        return;
      }

      if (choice === "a") {
        setStep("PROCESSING");
        appendLine("");
        appendLine("⚡ Initiating Global Sync for all series in database...");
        appendLine("Please wait while sources are checked for new chapters...");

        (async () => {
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData.session?.access_token;
            if (!accessToken) {
              appendLine("❌ You must be signed in as admin to sync series.");
              printSeriesPrompt();
              setStep("AWAITING_SERIES_OPTION");
              return;
            }

            const res = await $syncAllSeriesImportSources({
              data: {
                accessToken,
                maxChaptersPerSeries: 50,
              },
            });

            if (!res.success) {
              appendLine(`❌ Sync failed: ${res.error || "Unknown error"}`);
            } else {
              appendLine(`✅ Global Sync Complete!`);
              appendLine(`📈 Total Series Checked: ${res.totalSources}`);
              appendLine(`✨ Total New Chapters Imported: ${res.totalImported}`);
              if (res.results && res.results.length > 0) {
                appendLine("");
                appendLine("Results Breakdown:");
                res.results.forEach((r: any) => {
                  appendLine(`  - ${r.sourceUrl}: ${r.imported} imported, ${r.skipped} skipped, ${r.failed} failed${r.error ? ` (${r.error})` : ''}`);
                });
              }
            }
          } catch (err: any) {
            appendLine(`❌ Fatal error: ${err.message}`);
          } finally {
            appendLine("");
            appendLine("---");
            printSeriesPrompt();
            setStep("AWAITING_SERIES_OPTION");
          }
        })();
        return;
      }

      if (choice === "s") {
        setStep("AWAITING_SEARCH_QUERY");
        appendLine("Enter title to search: ");
        return;
      }

      if (choice === "m") {
        setStep("AWAITING_MANUAL_UUID");
        appendLine("Enter Series UUID: ");
        return;
      }

      if (choice === "" || choice === "skip") {
        setContext({ seriesId: null, seriesTitle: "Dry-run Mode" });
        setStep("AWAITING_URL");
        appendLine("");
        appendLine("Selected Series: Dry-run Mode");
        appendLine("Enter Series URL to scrape (e.g., https://site.com/manga/title): ");
        return;
      }

      const idx = parseInt(choice, 10) - 1;
      if (!Number.isNaN(idx) && idx >= 0 && idx < seriesList.length) {
        const selected = seriesList[idx];
        setContext((prev) => ({ ...prev, seriesId: selected.id, seriesTitle: selected.title }));
        setStep("AWAITING_URL");
        appendLine("");
        appendLine(`Selected Series: "${selected.title}"`);
        appendLine("Enter Series URL to scrape (e.g., https://site.com/manga/title): ");
        return;
      }

      appendLine("❌ Invalid option. Choose a number, 's', 'm', or press Enter.");
      appendLine("");
      appendLine("Choose a series option: ");
      return;
    }

    if (step === "AWAITING_SEARCH_QUERY") {
      if (val.toLowerCase() === "cancel") {
        setStep("AWAITING_SERIES_OPTION");
        printSeriesPrompt();
        return;
      }

      if (!val) {
        appendLine("❌ Search query cannot be empty.");
        appendLine("Enter title to search: ");
        return;
      }

      const localMatches = seriesList.filter((series) =>
        series.title.toLowerCase().includes(val.toLowerCase()),
      );

      if (localMatches.length === 0) {
        appendLine("❌ No matching series found.");
        appendLine("Enter title to search (or type 'cancel' to go back): ");
        return;
      }

      appendLine("");
      appendLine("Matching Series:");
      localMatches.forEach((match, idx) => {
        appendLine(`  [${idx + 1}] ${match.title}`);
      });
      setContext((prev) => ({ ...prev, searchMatches: localMatches }));
      setStep("AWAITING_SEARCH_SELECTION");
      appendLine("");
      appendLine("Select a series number: ");
      return;
    }

    if (step === "AWAITING_SEARCH_SELECTION") {
      if (val.toLowerCase() === "cancel") {
        setStep("AWAITING_SERIES_OPTION");
        printSeriesPrompt();
        return;
      }

      const idx = parseInt(val, 10) - 1;
      const matches = context.searchMatches || [];
      if (Number.isNaN(idx) || idx < 0 || idx >= matches.length) {
        appendLine("❌ Invalid selection.");
        appendLine("Select a series number: ");
        return;
      }

      const selected = matches[idx];
      setContext((prev) => ({ ...prev, seriesId: selected.id, seriesTitle: selected.title }));
      setStep("AWAITING_URL");
      appendLine("");
      appendLine(`Selected Series: "${selected.title}"`);
      appendLine("Enter Series URL to scrape (e.g., https://site.com/manga/title): ");
      return;
    }

    if (step === "AWAITING_MANUAL_UUID") {
      if (val.toLowerCase() === "cancel") {
        setStep("AWAITING_SERIES_OPTION");
        printSeriesPrompt();
        return;
      }

      setStep("PROCESSING");
      appendLine("Verifying UUID...");
      const { data: match, error } = await supabase
        .from("series")
        .select("title")
        .eq("id", val)
        .maybeSingle();

      if (error || !match) {
        appendLine("❌ Series not found for UUID.");
        setStep("AWAITING_MANUAL_UUID");
        appendLine("");
        appendLine("Enter Series UUID (or type 'cancel' to go back): ");
        return;
      }

      setContext((prev) => ({ ...prev, seriesId: val, seriesTitle: match.title }));
      setStep("AWAITING_URL");
      appendLine("");
      appendLine(`Selected Series: "${match.title}"`);
      appendLine("Enter Series URL to scrape (e.g., https://site.com/manga/title): ");
      return;
    }

    if (step === "AWAITING_URL") {
      if (!val) {
        appendLine("❌ URL is required.");
        appendLine("Enter Series URL to scrape: ");
        return;
      }

      try {
        new URL(val);
        setContext((prev) => ({ ...prev, url: val }));
        setStep("AWAITING_IMAGE_EXAMPLE");
        appendLine("Enter Image URL Example (optional, press Enter to skip): ");
      } catch {
        appendLine("❌ Please enter a valid URL.");
        appendLine("Enter Series URL to scrape: ");
      }
      return;
    }

    if (step === "AWAITING_IMAGE_EXAMPLE") {
      const sourceGroupFallback = inferSourceGroup(context.url || "");
      setContext((prev) => ({ ...prev, imageUrlExample: val || null }));
      setStep("AWAITING_SCANLATION_GROUP");
      appendLine(
        `Enter Scanlation Group name (optional, press Enter to use ${sourceGroupFallback || "source URL"}): `,
      );
      return;
    }

    if (step === "AWAITING_SCANLATION_GROUP") {
      const sourceGroupFallback = inferSourceGroup(context.url || "");
      const scanlationGroup = val || sourceGroupFallback || null;
      setContext((prev) => ({ ...prev, scanlationGroup }));

      if (scanlationGroup) {
        appendLine(`Using scan/source group: ${scanlationGroup}`);
      }

      setStep("AWAITING_UPLOADER");
      appendLine("Enter Uploader Username (optional, press Enter for \"vnr610\"): ");
      return;
    }

    if (step === "AWAITING_UPLOADER") {
      const uploader = val || "vnr610";
      const nextContext = { ...context, uploader };
      setContext(nextContext);
      setStep("AWAITING_CONFIRM");
      appendLine("");
      appendLine("Ready to run cloud scrape:");
      appendLine(`  series: ${nextContext.seriesTitle || "Dry-run Mode"}`);
      appendLine(`  source: ${nextContext.url}`);
      appendLine(`  group: ${nextContext.scanlationGroup || inferSourceGroup(nextContext.url || "") || "none"}`);
      appendLine(`  uploader: ${uploader}`);
      appendLine("");
      appendLine("Run scrape and import now? (y/n): ");
      return;
    }

    if (step === "AWAITING_CONFIRM") {
      if (val.toLowerCase() !== "y" && val.toLowerCase() !== "yes") {
        appendLine("Aborted.");
        resetToUrlPrompt();
        return;
      }

      setStep("PROCESSING");
      appendLine("");
      appendLine("🚀 Starting cloud scrape using local-script method...");
      appendLine("");
      await processScrape(context);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-[calc(100vh-8rem)]">
      <div className="flex flex-col h-full bg-zinc-950 text-zinc-300 font-mono text-sm rounded-lg border border-zinc-800 shadow-xl overflow-hidden p-4">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-zinc-800">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="text-xs text-zinc-500 ml-2">vnrscans bash cloud terminal</div>
        </div>

        <div
          className="flex-1 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
          onClick={() => inputRef.current?.focus()}
        >
          {output.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap break-words min-h-[1.25rem]">
              {line}
            </div>
          ))}

          {step !== "PROCESSING" && (
            <div className="flex items-center mt-2">
              <span className="mr-2 font-bold text-green-500">{sessionClosed ? "" : "$"}</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleInput}
                className="flex-1 bg-transparent outline-none border-none text-zinc-100"
                autoFocus
                spellCheck={false}
                autoComplete="off"
              />
            </div>
          )}
          {sessionClosed && <div className="text-zinc-600 mt-2">[closed]</div>}
          {!sessionClosed && step === "PROCESSING" && <div className="animate-pulse text-zinc-500 mt-2">_</div>}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
}
