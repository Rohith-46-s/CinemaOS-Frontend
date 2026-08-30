"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Film, Sparkles, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createProject, ApiError } from "@/lib/api";
import { SCENE_OPTIONS, SCENE_DURATION } from "@/lib/types";

const STORAGE_KEY = "cinemaos_active_project";

export default function CreatePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [scenes, setScenes] = useState<number>(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalDuration = scenes * SCENE_DURATION;

  const handleSubmit = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      setError("Please describe the story you want to create.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await createProject({ prompt: trimmed, scenes });
      // Persist active project for refresh recovery.
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ projectId: response.project_id, prompt: trimmed, scenes })
        );
      } catch {
        // localStorage unavailable; non-fatal.
      }
      router.push(`/generate?project_id=${encodeURIComponent(response.project_id)}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error && err.message.includes("fetch")) {
        setError(
          "Cannot reach the CinemaOS backend. Make sure it is running on the configured API URL."
        );
      } else {
        setError("Something went wrong starting your cinema. Please try again.");
      }
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-2xl"
        >
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center gap-2 mb-4">
              <Film className="h-8 w-8 text-blue-300" />
              <h1 className="text-5xl font-bold tracking-tight text-gradient">
                CINEMAOS
              </h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Turn your imagination into cinema.
            </p>
          </div>

          <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
            <CardContent className="p-6 space-y-6">
              {/* Prompt */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Create your story
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Describe the story you want to create..."
                  rows={5}
                  disabled={isSubmitting}
                  className="w-full rounded-md border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 resize-none"
                />
              </div>

              {/* Scene count */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  Number of scenes
                </label>
                <div className="flex flex-wrap gap-2">
                  {SCENE_OPTIONS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setScenes(n)}
                      disabled={isSubmitting}
                      className={`h-10 w-12 rounded-md text-sm font-medium transition-all disabled:opacity-50 ${
                        scenes === n
                          ? "bg-primary text-primary-foreground shadow"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {scenes} scenes &middot; ~{totalDuration} seconds total
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full h-12 text-base font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Cinema
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  );
}
