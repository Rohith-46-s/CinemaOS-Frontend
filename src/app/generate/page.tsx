"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Film,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Download,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StageTimeline } from "@/components/stage-timeline";
import {
  getProjectStatus,
  resumeProject,
  getResultUrl,
  ApiError,
} from "@/lib/api";
import { ProjectStatus } from "@/lib/types";

const STORAGE_KEY = "cinemaos_active_project";
const POLL_INTERVAL_MS = 2000;

function GenerationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get("project_id");

  const [status, setStatus] = useState<ProjectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isResuming, setIsResuming] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    if (!projectId) return;
    try {
      const result = await getProjectStatus(projectId);
      setStatus(result);
      setErrorMessage(null);
      if (result.status === "completed" || result.status === "failed") {
        stopPolling();
        setLoading(false);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to reach the CinemaOS backend.");
      }
      stopPolling();
      setLoading(false);
    }
  }, [projectId, stopPolling]);

  // Start polling on mount.
  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      setErrorMessage("No project ID provided.");
      return;
    }

    // Sync localStorage with the active project from URL.
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ projectId }));
    } catch {
      // ignore
    }

    fetchStatus();
    pollRef.current = setInterval(fetchStatus, POLL_INTERVAL_MS);

    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleResume = async () => {
    if (!projectId) return;
    setIsResuming(true);
    setErrorMessage(null);
    try {
      const result = await resumeProject(projectId);
      setStatus(result);
      // Resume polling.
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(fetchStatus, POLL_INTERVAL_MS);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to resume generation.");
      }
    } finally {
      setIsResuming(false);
    }
  };

  const handleBackToCreate = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    router.push("/");
  };

  // No project id in URL.
  if (!projectId) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">No project found</h2>
            <p className="text-sm text-muted-foreground">
              Start by creating a new cinema project.
            </p>
            <Button onClick={handleBackToCreate} className="w-full">
              Back to Create
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const isRunning = status?.status === "running" || status?.status === "pending";
  const isCompleted = status?.status === "completed";
  const isFailed = status?.status === "failed";

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackToCreate}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              <Film className="h-6 w-6 text-blue-300 flex-shrink-0" />
              <h1 className="text-2xl font-bold tracking-tight text-gradient truncate">
                CINEMAOS
              </h1>
            </div>
          </div>

          {/* Loading state */}
          {loading && !status && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-8 w-8 text-blue-300 animate-spin" />
              <p className="text-muted-foreground">Connecting to backend...</p>
            </div>
          )}

          {/* Status loaded */}
          {status && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Title */}
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2">
                  {isCompleted
                    ? "Your cinema is ready"
                    : isFailed
                    ? "Generation stopped"
                    : "Creating your cinema"}
                </h2>
                {status.prompt && (
                  <p className="text-sm text-muted-foreground italic line-clamp-2">
                    &ldquo;{status.prompt}&rdquo;
                  </p>
                )}
              </div>

              {/* Progress + Timeline grid */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Timeline card */}
                <Card className="lg:col-span-3 border-border/50 bg-card/60">
                  <CardContent className="p-5">
                    <StageTimeline
                      completedStages={status.completed_stages}
                      currentStage={status.current_stage}
                      failedStage={status.failed_stage}
                    />
                  </CardContent>
                </Card>

                {/* Progress card */}
                <Card className="lg:col-span-2 border-border/50 bg-card/60">
                  <CardContent className="p-5 space-y-5">
                    {/* Current stage */}
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                        Current Stage
                      </p>
                      <p className="text-lg font-semibold">
                        {status.current_stage
                          ? `Stage ${status.current_stage_number} of ${status.total_stages} — ${status.current_stage}`
                          : isCompleted
                          ? "Complete"
                          : isFailed
                          ? "Stopped"
                          : "Waiting..."}
                      </p>
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-2">
                        <span>Progress</span>
                        <span>{Math.round(status.progress * 100)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-300"
                          initial={{ width: 0 }}
                          animate={{ width: `${status.progress * 100}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      </div>
                    </div>

                    {/* Completed count */}
                    <div className="text-sm text-muted-foreground">
                      {status.completed_stages.length} of {status.total_stages}{" "}
                      stages complete
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Error display */}
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {errorMessage}
                </motion.div>
              )}

              {/* Failed state */}
              {isFailed && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  <Card className="border-destructive/40 bg-destructive/5">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        <h3 className="font-semibold">Generation stopped</h3>
                      </div>
                      {status.error && (
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="text-muted-foreground">Stage:</span>{" "}
                            <span className="font-medium">{status.error.stage}</span>
                          </p>
                          <p>
                            <span className="text-muted-foreground">Reason:</span>{" "}
                            <span className="font-medium">{status.error.reason}</span>
                          </p>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-3 pt-1">
                        <Button
                          onClick={handleResume}
                          disabled={isResuming}
                          variant="secondary"
                        >
                          {isResuming ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                          )}
                          Resume Generation
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleBackToCreate}
                          disabled={isResuming}
                        >
                          Back to Create
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Completed state */}
              {isCompleted && status.result_url && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 space-y-4"
                >
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <h3 className="font-semibold text-foreground">
                      Your cinema is ready
                    </h3>
                  </div>

                  <Card className="border-border/50 bg-card/60 overflow-hidden">
                    <CardContent className="p-4">
                      <video
                        src={getResultUrl(projectId)}
                        controls
                        preload="metadata"
                        className="w-full rounded-md bg-black max-h-[60vh] object-contain"
                      >
                        Your browser does not support the video tag.
                      </video>
                    </CardContent>
                  </Card>

                  <div className="flex flex-wrap gap-3">
                    <a
                      href={getResultUrl(projectId)}
                      download={`${projectId}_FINAL.mp4`}
                    >
                      <Button>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </a>
                    <Button variant="outline" onClick={handleBackToCreate}>
                      Create Another
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function GeneratePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center px-4">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 text-blue-300 animate-spin" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
      }
    >
      <GenerationContent />
    </Suspense>
  );
}
