"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { CheckCircle2, Loader2, AlertCircle, Sparkles, Check, ChevronRight } from "lucide-react";

export interface TaskStep {
  id: string;
  label: string;
  status: "pending" | "active" | "done" | "error";
  detail?: string;
}

export interface TaskSession {
  title: string;
  description?: string;
  steps: TaskStep[];
  currentStepId?: string;
  isCompleted?: boolean;
  error?: string | null;
}

interface ProcessingTaskContextType {
  isProcessing: boolean;
  currentTask: TaskSession | null;
  startTask: (config: { title: string; description?: string; steps: { id: string; label: string }[] }) => void;
  setStepStatus: (stepId: string, status: "pending" | "active" | "done" | "error", detail?: string) => void;
  completeTask: (finalMessage?: string) => Promise<void>;
  failTask: (error: string) => void;
  closeTask: () => void;
}

const ProcessingTaskContext = createContext<ProcessingTaskContextType | null>(null);

export function ProcessingTaskProvider({ children }: { children: React.ReactNode }) {
  const [currentTask, setCurrentTask] = useState<TaskSession | null>(null);

  const startTask = useCallback((config: {
    title: string;
    description?: string;
    steps: { id: string; label: string }[];
  }) => {
    setCurrentTask({
      title: config.title,
      description: config.description,
      steps: config.steps.map((s, idx) => ({
        id: s.id,
        label: s.label,
        status: idx === 0 ? "active" : "pending",
      })),
      currentStepId: config.steps[0]?.id,
      isCompleted: false,
      error: null,
    });
  }, []);

  const setStepStatus = useCallback((
    stepId: string,
    status: "pending" | "active" | "done" | "error",
    detail?: string
  ) => {
    setCurrentTask((prev) => {
      if (!prev) return null;
      const updatedSteps = prev.steps.map((step) => {
        if (step.id === stepId) {
          return { ...step, status, detail: detail ?? step.detail };
        }
        return step;
      });

      return {
        ...prev,
        steps: updatedSteps,
        currentStepId: status === "active" ? stepId : prev.currentStepId,
      };
    });
  }, []);

  const completeTask = useCallback(async (finalMessage?: string) => {
    setCurrentTask((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        isCompleted: true,
        steps: prev.steps.map((s) => ({ ...s, status: "done" })),
        description: finalMessage || prev.description,
      };
    });

    // Hold screen briefly so user sees the tick animation
    await new Promise((resolve) => setTimeout(resolve, 850));
    setCurrentTask(null);
  }, []);

  const failTask = useCallback((error: string) => {
    setCurrentTask((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        error,
        steps: prev.steps.map((s) =>
          s.status === "active" ? { ...s, status: "error", detail: error } : s
        ),
      };
    });
  }, []);

  const closeTask = useCallback(() => {
    setCurrentTask(null);
  }, []);

  const isProcessing = !!currentTask && !currentTask.error;

  const value = useMemo(
    () => ({
      isProcessing,
      currentTask,
      startTask,
      setStepStatus,
      completeTask,
      failTask,
      closeTask,
    }),
    [isProcessing, currentTask, startTask, setStepStatus, completeTask, failTask, closeTask]
  );

  return (
    <ProcessingTaskContext.Provider value={value}>
      {children}
      {currentTask && <SiteProcessingCenterModal task={currentTask} onClose={closeTask} />}
    </ProcessingTaskContext.Provider>
  );
}

export function useProcessingTask() {
  const context = useContext(ProcessingTaskContext);
  if (!context) {
    throw new Error("useProcessingTask must be used within a ProcessingTaskProvider");
  }
  return context;
}

// ── CENTER OF SCREEN PROCESSING ANIMATION MODAL ─────────────────────────
function SiteProcessingCenterModal({
  task,
  onClose,
}: {
  task: TaskSession;
  onClose: () => void;
}) {
  const totalSteps = task.steps.length;
  const completedSteps = task.steps.filter((s) => s.status === "done").length;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  const isDone = task.isCompleted || (totalSteps > 0 && completedSteps === totalSteps);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="processing-task-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md rounded-xl border border-neutral-800 bg-[#08080c] p-6 shadow-2xl shadow-black/80 overflow-hidden backdrop-blur-xl animate-in zoom-in-95 duration-200">
        {/* Sleek top hairline accent matching site aesthetic */}
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />

        {/* ── CENTER RADAR / ORB ANIMATION ────────────────────────────── */}
        <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center">
          {isDone ? (
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)] animate-in zoom-in-75 duration-300">
              <Check className="h-8 w-8 stroke-[3] animate-bounce" />
            </div>
          ) : task.error ? (
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/40 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-in zoom-in-75 duration-200">
              <AlertCircle className="h-8 w-8 stroke-[2.5]" />
            </div>
          ) : (
            <>
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 rounded-full border border-purple-500/30 animate-ping opacity-25" />
              {/* Spinning dashed radar */}
              <div
                className="absolute inset-1 rounded-full border border-dashed border-purple-400/50 animate-spin"
                style={{ animationDuration: "7s" }}
              />
              {/* Inner glowing dark core */}
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#101118] border border-purple-500/30 shadow-inner">
                <Loader2 className="h-6 w-6 text-purple-400 animate-spin" />
                <span className="absolute text-[10px] font-mono font-bold text-neutral-300">
                  {progressPercent}%
                </span>
              </div>
            </>
          )}
        </div>

        {/* Title & Subtitle */}
        <div className="text-center space-y-1.5 mb-4">
          <h3
            id="processing-task-title"
            className="text-base font-black uppercase tracking-wider text-white flex items-center justify-center gap-1.5"
          >
            <span>{task.title}</span>
            {isDone && <Sparkles className="h-4 w-4 text-emerald-400" />}
          </h3>
          <p className="text-xs text-neutral-400 font-normal leading-relaxed px-2">
            {task.error || task.description || "Performing system tasks. Please keep this tab open..."}
          </p>
        </div>

        {/* Hairline Progress Bar */}
        <div className="w-full bg-neutral-900 rounded-full h-1 mb-4 overflow-hidden border border-neutral-800/80">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isDone
                ? "bg-emerald-500 shadow-sm shadow-emerald-400"
                : task.error
                ? "bg-red-500"
                : "bg-gradient-to-r from-purple-600 via-violet-400 to-emerald-400"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* ── STEP-BY-STEP CHECKLIST WITH ANIMATED TICK MARKS (DARK SCROLLBAR) ───────────── */}
        <div className="space-y-2 text-left max-h-56 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {task.steps.map((step, idx) => {
            const isStepDone = step.status === "done";
            const isStepActive = step.status === "active";
            const isStepError = step.status === "error";

            return (
              <div
                key={step.id}
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all duration-200 ${
                  isStepDone
                    ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                    : isStepActive
                    ? "bg-purple-950/25 border-purple-500/40 text-white shadow-sm ring-1 ring-purple-500/30"
                    : isStepError
                    ? "bg-red-950/20 border-red-500/40 text-red-200"
                    : "bg-neutral-900/30 border-neutral-800/50 text-neutral-500 opacity-60"
                }`}
              >
                {/* Status Indicator Icon */}
                <div className="shrink-0 mt-0.5">
                  {isStepDone ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-in zoom-in-50 duration-200">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
                  ) : isStepActive ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/40">
                      <Loader2 className="h-3 w-3 animate-spin text-purple-400" />
                    </div>
                  ) : isStepError ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/20 text-red-400 border border-red-500/40">
                      <AlertCircle className="h-3.5 w-3.5" />
                    </div>
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-bold font-mono text-neutral-500 border border-neutral-800">
                      {idx + 1}
                    </div>
                  )}
                </div>

                {/* Step Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-semibold truncate ${
                        isStepDone
                          ? "text-emerald-300"
                          : isStepActive
                          ? "text-white font-bold"
                          : isStepError
                          ? "text-red-300 font-bold"
                          : "text-neutral-400"
                      }`}
                    >
                      {step.label}
                    </span>
                    {isStepDone && (
                      <span className="font-mono text-[9px] font-bold text-emerald-400 tracking-wider uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30 shrink-0">
                        DONE ✓
                      </span>
                    )}
                    {isStepActive && (
                      <span className="flex items-center gap-1 font-mono text-[9px] font-bold text-purple-300 tracking-wider uppercase bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/30 shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-ping" />
                        RUNNING
                      </span>
                    )}
                  </div>
                  {step.detail && (
                    <p className="text-[11px] text-neutral-400 mt-0.5 truncate font-normal">
                      {step.detail}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button on Error */}
        {task.error && (
          <div className="mt-4 pt-3 border-t border-neutral-800 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold uppercase tracking-wider text-white transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
