"use client";

import { motion } from "framer-motion";
import {
  Film,
  Youtube,
  Smartphone,
  Sparkles,
  GraduationCap,
  PiggyBank,
  Check,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  GENERATION_PROFILES,
  PROFILE_META,
  type GenerationProfile,
} from "@/lib/types";

const ICON_MAP: Record<GenerationProfile, LucideIcon> = {
  movie: Film,
  youtube: Youtube,
  reel: Smartphone,
  anime: Sparkles,
  educational: GraduationCap,
  low_cost: PiggyBank,
};

interface ProfileSelectorProps {
  value: GenerationProfile;
  onChange: (next: GenerationProfile) => void;
  disabled?: boolean;
}

export function ProfileSelector({
  value,
  onChange,
  disabled = false,
}: ProfileSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Generation profile"
      className="grid grid-cols-2 sm:grid-cols-3 gap-2.5"
    >
      {GENERATION_PROFILES.map((id) => {
        const meta = PROFILE_META[id];
        const Icon = ICON_MAP[id];
        const selected = value === id;
        return (
          <motion.button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(id)}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "group relative flex flex-col items-start gap-1.5 rounded-xl px-3.5 py-3 text-left",
              "border transition-all duration-200 focus-ring",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              selected
                ? "border-foreground/30 bg-foreground/[0.04] shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]"
                : "border-border bg-card/40 hover:bg-card/70 hover:border-foreground/15"
            )}
          >
            <div className="flex items-center gap-2 w-full">
              <span
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                  selected
                    ? "bg-foreground text-background"
                    : "bg-secondary text-foreground/80"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span
                className={cn(
                  "text-sm font-semibold tracking-tight",
                  selected ? "text-foreground" : "text-foreground/85"
                )}
              >
                {meta.label}
              </span>
              {selected && (
                <Check
                  className="ml-auto h-3.5 w-3.5 text-foreground/80"
                  aria-hidden
                />
              )}
            </div>
            <p className="text-[11px] leading-snug text-muted-foreground line-clamp-2">
              {meta.description}
            </p>
          </motion.button>
        );
      })}
    </div>
  );
}

export function ProfileHint({ profile }: { profile: GenerationProfile }) {
  const meta = PROFILE_META[profile];
  return (
    <motion.div
      key={profile}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
    >
      <span className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-secondary/50 px-2 py-1 font-medium text-foreground/80">
        <span className="font-mono tracking-tight">{meta.aspectRatio}</span>
      </span>
      <span className="text-muted-foreground/80">{meta.pacing}</span>
      <span aria-hidden className="text-muted-foreground/40">·</span>
      <span>{meta.highlight}</span>
    </motion.div>
  );
}
