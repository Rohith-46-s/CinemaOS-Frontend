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
    <div className="space-y-1">
      {PIPELINE_STAGES.map((stage, idx) => {
        const isCompleted = completedSet.has(stage.name);
        const isRunning = currentStage === stage.name && !isCompleted;
        const isFailed = failedStage === stage.name;
        const isPending = !isCompleted && !isRunning && !isFailed;

        return (
          <motion.div
            key={stage.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.04, duration: 0.3 }}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
              isRunning && "bg-accent/50",
              isFailed && "bg-destructive/10"
            )}
          >
            {/* Status indicator */}
            <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center">
              {isCompleted ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center"
                >
                  <Check className="h-3.5 w-3.5 text-green-400" />
                </motion.div>
              ) : isRunning ? (
                <Loader2 className="h-5 w-5 text-blue-300 animate-spin-slow" />
              ) : isFailed ? (
                <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center">
                  <X className="h-3.5 w-3.5 text-destructive" />
                </div>
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/40" />
              )}
            </div>

            {/* Stage number + name */}
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={cn(
                  "text-xs font-mono w-5 text-right flex-shrink-0",
                  isCompleted
                    ? "text-green-400/80"
                    : isRunning
                    ? "text-blue-300"
                    : isFailed
                    ? "text-destructive"
                    : "text-muted-foreground/60"
                )}
              >
                {String(stage.number).padStart(2, "0")}
              </span>
              <span
                className={cn(
                  "text-sm font-medium truncate",
                  isCompleted
                    ? "text-foreground/90"
                    : isRunning
                    ? "text-foreground"
                    : isFailed
                    ? "text-destructive"
                    : "text-muted-foreground"
                )}
              >
                {stage.name}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
