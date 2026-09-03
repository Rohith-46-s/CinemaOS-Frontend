"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Settings2, Film } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createProject, ApiError } from "@/lib/api";
import {
  DEFAULT_GENERATION_PROFILE,
  SCENE_DURATION,
  SCENE_OPTIONS,
  type GenerationProfile,
} from "@/lib/types";
import { ProfileSelector, ProfileHint } from "@/components/profile-selector";

const STORAGE_KEY = "cinemaos_active_project";

export default function CreatePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [scenes, setScenes] = useState<number>(2);
  const [profile, setProfile] = useState<GenerationProfile>(
    DEFAULT_GENERATION_PROFILE
  );
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
      const response = await createProject({
        prompt: trimmed,
        scenes,
        profile,
      });
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            projectId: response.project_id,
            prompt: trimmed,
            scenes,
            profile,
          })
        );
      } catch {
        // localStorage unavailable; non-fatal.
      }
      router.push(
        `/generate?project_id=${encodeURIComponent(response.project_id)}`
      );
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
      <header className="px-6 sm:px-10 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background">
            <Film className="h-3.5 w-3.5" />
          </span>
          <span className="text-sm font-semibold tracking-tight">
            CinemaOS
          </span>
        </div>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          AI cinema workspace
        </span>
      </header>

      <div className="flex-1 flex items-start sm:items-center justify-center px-4 sm:px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-2xl space-y-10"
        >
          {/* Hero */}
          <div className="text-center space-y-3">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-gradient">
              What do you want to create?
            </h1>
            <p className="text-base text-muted-foreground max-w-md mx-auto">
              Describe your story. Choose a creative mode. We&apos;ll handle
              the rest.
            </p>
          </div>

          {/* Prompt — hero element */}
          <div className="space-y-2">
            <label
              htmlFor="prompt"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Idea
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                if (error) setError(null);
              }}
              placeholder="A lone astronaut discovers a forest growing inside a crater on Mars…"
              rows={5}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-border/70 bg-card/60 px-5 py-4 text-base leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus-ring resize-none transition-colors hover:border-foreground/20"
            />
          </div>

          {/* Profile selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Creative mode
              </label>
              <span className="text-xs text-muted-foreground">
                {PROFILE_LABEL(profile)}
              </span>
            </div>
            <ProfileSelector
              value={profile}
              onChange={setProfile}
              disabled={isSubmitting}
            />
            <ProfileHint profile={profile} />
          </div>

          {/* Scene count — secondary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Length
              </label>
              <span className="text-xs text-muted-foreground">
                {scenes} {scenes === 1 ? "scene" : "scenes"} · ~{totalDuration}s
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SCENE_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setScenes(n)}
                  disabled={isSubmitting}
                  className={`h-9 w-10 rounded-lg text-sm font-medium transition-all focus-ring disabled:opacity-50 ${
                    scenes === n
                      ? "bg-foreground text-background"
                      : "bg-secondary/60 text-foreground/80 hover:bg-secondary"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </motion.div>
          )}

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-12 text-base font-semibold rounded-xl"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Cinema
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground/80 flex items-center justify-center gap-1.5">
            <Settings2 className="h-3 w-3" />
            Profiles are creative modes. Same pipeline, different feel.
          </p>
        </motion.div>
      </div>
    </main>
  );
}

function PROFILE_LABEL(p: GenerationProfile): string {
  return p === "low_cost" ? "Low cost" : p[0].toUpperCase() + p.slice(1);
}
