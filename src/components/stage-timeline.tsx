"use client";

import { motion } from "framer-motion";
import { Check, X, Loader2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PIPELINE_STAGES } from "@/lib/types";

interface StageTimelineProps {
  completedStages: string[];
  currentStage: string | null;
  failedStage: string | null;
}

export function StageTimeline({
  completedStages,
  currentStage,
  failedStage,
}: StageTimelineProps) {
  const completedSet = new Set(completedStages);

  return (
    <ol
      aria-label="Generation pipeline"
      className="relative space-y-0.5"
    >
      {PIPELINE_STAGES.map((stage, idx) => {
        const isCompleted = completedSet.has(stage.name);
        const isRunning = currentStage === stage.name && !isCompleted;
        const isFailed = failedStage === stage.name;
        const isPending = !isCompleted && !isRunning && !isFailed;
        const isLast = idx === PIPELINE_STAGES.length - 1;

        return (
          <motion.li
            key={stage.name}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.03, duration: 0.25 }}
            className={cn(
              "relative flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors",
              isRunning && "bg-accent/40",
              isFailed && "bg-destructive/10"
            )}
          >
            {/* Connector line */}
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[19px] top-[34px] bottom-[-6px] w-px",
                  isCompleted || isRunning
                    ? "bg-foreground/20"
                    : "bg-border"
                )}
              />
            )}

            <div className="relative flex-shrink-0 w-5 h-5 flex items-center justify-center">
              {isCompleted ? (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success/15 text-success"
                >
                  <Check className="h-3 w-3" strokeWidth={2.5} />
                </motion.span>
              ) : isRunning ? (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground/10">
                  <Loader2 className="h-3 w-3 text-foreground/90 animate-spin" />
                </span>
              ) : isFailed ? (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                  <X className="h-3 w-3" strokeWidth={2.5} />
                </span>
              ) : (
                <Circle
                  className="h-3 w-3 text-muted-foreground/40"
                  strokeWidth={1.5}
                />
              )}
            </div>

            <span
              className={cn(
                "text-sm font-medium truncate",
                isCompleted && "text-foreground/80",
                isRunning && "text-foreground",
                isFailed && "text-destructive",
                isPending && "text-muted-foreground"
              )}
            >
              {stage.name}
            </span>
            {isRunning && (
              <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">
                Running
              </span>
            )}
          </motion.li>
        );
      })}
    </ol>
  );
}
