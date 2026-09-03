"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Download,
  RefreshCw,
  Trash2,
  Film,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { StageTimeline } from "@/components/stage-timeline";
import {
  getProjectStatus,
  resumeProject,
  getResultUrl,
  deleteProjectMedia,
  ApiError,
} from "@/lib/api";
import {
  ProjectStatus,
  PROFILE_META,
  type GenerationProfile,
} from "@/lib/types";
import { cn } from "@/lib/utils";

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [showTechnical, setShowTechnical] = useState(false);
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

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      setErrorMessage("No project ID provided.");
      return;
    }

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

  const handleDelete = async () => {
    if (!projectId) return;
    setIsDeleting(true);
    setDeleteMessage(null);
    try {
      const result = await deleteProjectMedia({
        project_id: projectId,
        confirm: true,
      });
      setShowDeleteConfirm(false);
      setDeleteMessage(
        `Deleted ${result.deleted} object${
          result.deleted === 1 ? "" : "s"
        } from project storage.`
      );
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Could not delete project media.";
      setDeleteMessage(message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!projectId) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full surface rounded-2xl p-6 text-center space-y-4">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
          <h2 className="text-lg font-semibold">No project found</h2>
          <p className="text-sm text-muted-foreground">
            Start by creating a new cinema project.
          </p>
          <Button onClick={handleBackToCreate} className="w-full">
            Back to Create
          </Button>
        </div>
      </main>
    );
  }

  const isRunning = status?.status === "running" || status?.status === "pending";
  const isCompleted = status?.status === "completed";
  const isFailed = status?.status === "failed";
  const activeProfile: GenerationProfile | null =
    (status?.profile as GenerationProfile | null | undefined) ?? null;

  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-6 sm:px-10 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToCreate}
            className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            New project
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background">
            <Film className="h-3 w-3" />
          </span>
          <span className="text-sm font-semibold tracking-tight">CinemaOS</span>
        </div>
      </header>

      <div className="flex-1 px-4 sm:px-6 pb-16">
        <div className="max-w-5xl mx-auto space-y-8">
          {loading && !status && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="h-6 w-6 text-foreground/70 animate-spin" />
              <p className="text-sm text-muted-foreground">
                Connecting to backend…
              </p>
            </div>
          )}

          {status && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {/* Title + meta */}
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                  {isCompleted
                    ? "Your cinema is ready"
                    : isFailed
                    ? "Generation stopped"
                    : "Creating your cinema"}
                </h1>
                {status.prompt && (
                  <p className="text-sm text-muted-foreground italic line-clamp-2 max-w-2xl">
                    &ldquo;{status.prompt}&rdquo;
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {activeProfile && (
                    <ProfileChip profile={activeProfile} />
                  )}
                  {status.total_duration && (
                    <span className="text-xs text-muted-foreground">
                      · {status.total_duration.toFixed(0)}s total
                    </span>
                  )}
                  {status.total_stages > 0 && (
                    <span className="text-xs text-muted-foreground">
                      · {status.completed_stages.length} / {status.total_stages}{" "}
                      stages
                    </span>
                  )}
                </div>
              </div>

              {/* Progress + Timeline grid */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-3 surface rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Pipeline
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(status.progress * 100)}%
                    </span>
                  </div>
                  <StageTimeline
                    completedStages={status.completed_stages}
                    currentStage={status.current_stage}
                    failedStage={status.failed_stage}
                  />
                </div>

                <div className="lg:col-span-2 surface rounded-2xl p-5 space-y-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                      Current stage
                    </p>
                    <p className="text-base font-medium">
                      {isCompleted
                        ? "Complete"
                        : isFailed
                        ? "Stopped"
                        : status.current_stage
                        ? status.current_stage
                        : "Waiting…"}
                    </p>
                    {status.current_stage && !isCompleted && !isFailed && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Stage {status.current_stage_number} of{" "}
                        {status.total_stages}
                      </p>
                    )}
                  </div>
                  <div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        className="h-full bg-foreground/90"
                        initial={{ width: 0 }}
                        animate={{ width: `${status.progress * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {errorMessage && (
                <ErrorCard
                  message={errorMessage}
                  technical={errorMessage}
                  showTechnical={showTechnical}
                  onToggleTechnical={() => setShowTechnical((v) => !v)}
                />
              )}

              {isFailed && (
                <FailedCard
                  status={status}
                  isResuming={isResuming}
                  onResume={handleResume}
                  onBack={handleBackToCreate}
                />
              )}

              {isCompleted && status.result_url && (
                <CompletedCard
                  projectId={projectId}
                  resultUrl={getResultUrl(projectId)}
                  showDeleteConfirm={showDeleteConfirm}
                  isDeleting={isDeleting}
                  onRequestDelete={() => {
                    setShowDeleteConfirm(true);
                    setDeleteMessage(null);
                  }}
                  onCancelDelete={() => setShowDeleteConfirm(false)}
                  onConfirmDelete={handleDelete}
                  deleteMessage={deleteMessage}
                />
              )}
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <DeleteConfirmDialog
            projectId={projectId}
            isDeleting={isDeleting}
            onCancel={() => setShowDeleteConfirm(false)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function ProfileChip({ profile }: { profile: GenerationProfile }) {
  const meta = PROFILE_META[profile];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-secondary/60 px-2 py-1 text-xs font-medium text-foreground/80">
      <span className="h-1.5 w-1.5 rounded-full bg-foreground/70" />
      {meta.label}
    </span>
  );
}

function ErrorCard({
  message,
  technical,
  showTechnical,
  onToggleTechnical,
}: {
  message: string;
  technical: string;
  showTechnical: boolean;
  onToggleTechnical: () => void;
}) {
  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/[0.06] p-4 text-sm">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0 space-y-1">
          <p className="font-medium text-destructive">{message}</p>
          <button
            type="button"
            onClick={onToggleTechnical}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            {showTechnical ? "Hide" : "Show"} technical details
            {showTechnical ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
          {showTechnical && (
            <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap break-words mt-1 p-2 rounded-md bg-background/40 border border-border/60">
              {technical}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

function FailedCard({
  status,
  isResuming,
  onResume,
  onBack,
}: {
  status: ProjectStatus;
  isResuming: boolean;
  onResume: () => void;
  onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface rounded-2xl p-5 space-y-4"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <h3 className="text-sm font-semibold">Generation stopped</h3>
      </div>
      {status.error && (
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-[100px_1fr] gap-2">
            <span className="text-muted-foreground">Current stage</span>
            <span className="font-medium">
              {status.error.stage}
              {status.error.stage_number > 0 && (
                <span className="text-muted-foreground font-normal">
                  {" "}
                  · {status.error.stage_number}
                </span>
              )}
            </span>
          </div>
          <div className="grid grid-cols-[100px_1fr] gap-2">
            <span className="text-muted-foreground">Reason</span>
            <span>{status.error.reason}</span>
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        You can resume generation from where it stopped, or go back and start
        over with a new idea.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={onResume}
          disabled={isResuming}
          className="rounded-lg"
        >
          {isResuming ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
          )}
          Resume Generation
        </Button>
        <Button variant="outline" onClick={onBack} className="rounded-lg">
          Back to Create
        </Button>
      </div>
    </motion.div>
  );
}

function CompletedCard({
  projectId,
  resultUrl,
  showDeleteConfirm,
  isDeleting,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
  deleteMessage,
}: {
  projectId: string;
  resultUrl: string;
  showDeleteConfirm: boolean;
  isDeleting: boolean;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  deleteMessage: string | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="surface rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="font-medium">Your cinema is ready</span>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {projectId}
          </span>
        </div>
        <div className="p-3 sm:p-4">
          <video
            src={resultUrl}
            controls
            preload="metadata"
            playsInline
            className="w-full rounded-lg bg-black max-h-[70vh] object-contain"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <a
          href={resultUrl}
          download={`${projectId}_FINAL.mp4`}
          className="contents"
        >
          <Button className="rounded-lg">
            <Download className="mr-2 h-4 w-4" />
            Download Video
          </Button>
        </a>
        <Button
          variant="outline"
          className="rounded-lg"
          onClick={() => {
            window.location.href = "/";
          }}
        >
          Create Another
        </Button>
        <div className="ml-auto">
          {!showDeleteConfirm && !deleteMessage && (
            <Button
              variant="ghost"
              onClick={onRequestDelete}
              className="rounded-lg text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete project media
            </Button>
          )}
          {deleteMessage && (
            <span className="text-xs text-muted-foreground">
              {deleteMessage}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function DeleteConfirmDialog({
  projectId,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  projectId: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-background/70 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md surface-strong rounded-2xl p-5 space-y-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="delete-dialog-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 text-destructive flex-shrink-0">
              <Trash2 className="h-4 w-4" />
            </span>
            <div className="space-y-1">
              <h2
                id="delete-dialog-title"
                className="text-base font-semibold"
              >
                Delete project media?
              </h2>
              <p className="text-sm text-muted-foreground">
                This permanently deletes generated media for this project from
                CinemaOS storage.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            disabled={isDeleting}
            className="h-7 w-7 -mt-1"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-mono text-foreground/80">{projectId}</span>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-lg"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-lg"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Permanently delete
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center px-4">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 text-foreground/70 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading…</p>
          </div>
        </main>
      }
    >
      <GenerationContent />
    </Suspense>
  );
}
