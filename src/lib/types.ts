export type GenerationProfile =
  | "movie"
  | "youtube"
  | "reel"
  | "anime"
  | "educational"
  | "low_cost";

export const GENERATION_PROFILES: readonly GenerationProfile[] = [
  "movie",
  "youtube",
  "reel",
  "anime",
  "educational",
  "low_cost",
] as const;

export const DEFAULT_GENERATION_PROFILE: GenerationProfile = "movie";

export interface ProfileMeta {
  id: GenerationProfile;
  label: string;
  description: string;
  aspectRatio: "16:9" | "9:16";
  pacing: string;
  highlight: string;
}

export const PROFILE_META: Record<GenerationProfile, ProfileMeta> = {
  movie: {
    id: "movie",
    label: "Movie",
    description: "Cinematic storytelling and continuity",
    aspectRatio: "16:9",
    pacing: "Deliberate, cinematic pacing",
    highlight: "Dramatic lighting and consistent characters",
  },
  youtube: {
    id: "youtube",
    label: "YouTube",
    description: "Engaging long-form video storytelling",
    aspectRatio: "16:9",
    pacing: "Engaging, fast-paced pacing",
    highlight: "Voiceover-first with a strong opening hook",
  },
  reel: {
    id: "reel",
    label: "Reel",
    description: "Short-form vertical high-retention video",
    aspectRatio: "9:16",
    pacing: "Rapid, high-retention pacing",
    highlight: "Vertical 9:16 — designed for short-form platforms",
  },
  anime: {
    id: "anime",
    label: "Anime",
    description: "Consistent anime visual storytelling",
    aspectRatio: "16:9",
    pacing: "Expressive, story-driven pacing",
    highlight: "Anime visual language applied throughout",
  },
  educational: {
    id: "educational",
    label: "Educational",
    description: "Clear concept-focused visual explanation",
    aspectRatio: "16:9",
    pacing: "Calm, didactic pacing",
    highlight: "Voiceover-led with clear visual explanation",
  },
  low_cost: {
    id: "low_cost",
    label: "Low cost",
    description: "Optimized for minimal generation cost",
    aspectRatio: "16:9",
    pacing: "Efficient, single-pass pacing",
    highlight: "Uses optimized settings to keep cost down",
  },
};

export interface CreateProjectRequest {
  prompt: string;
  scenes: number;
  scene_duration?: number;
  profile?: GenerationProfile;
}

export interface CreateProjectResponse {
  project_id: string;
  status: string;
  message: string;
  profile?: GenerationProfile;
}

export interface ProjectError {
  stage: string;
  stage_number: number;
  reason: string;
}

export interface ProjectStatus {
  project_id: string;
  prompt: string | null;
  scenes: number | null;
  scene_duration: number | null;
  total_duration: number | null;
  status: "pending" | "running" | "completed" | "failed";
  current_stage: string | null;
  current_stage_number: number | null;
  total_stages: number;
  completed_stages: string[];
  failed_stage: string | null;
  failed_stage_number: number | null;
  error: ProjectError | null;
  progress: number;
  result_url: string | null;
  final_output_path: string | null;
  created_at: string | null;
  updated_at: string | null;
  profile?: GenerationProfile | null;
}

export interface StageStatus {
  number: number;
  name: string;
  status: "pending" | "running" | "completed" | "failed";
}

export interface ProjectState {
  project_id: string;
  prompt: string | null;
  status: string;
  scenes: number | null;
  scene_duration: number | null;
  total_duration: number | null;
  stages: StageStatus[];
  failed_stage: string | null;
  failed_stage_number: number | null;
  error: ProjectError | null;
  result_url: string | null;
  final_output_path: string | null;
  created_at: string | null;
  updated_at: string | null;
  profile?: GenerationProfile | null;
}

/**
 * Pipeline stages displayed in the UI.
 * Mirrors the active backend pipeline (EnvironmentAssetsAgent is NOT in
 * the active pipeline). The stage list is a UI affordance only — the
 * actual current_stage values come from the backend's status response.
 */
export const PIPELINE_STAGES = [
  { number: 1, name: "Story" },
  { number: 2, name: "Characters" },
  { number: 3, name: "Character Assets" },
  { number: 4, name: "Environment" },
  { number: 5, name: "Script" },
  { number: 6, name: "Video" },
  { number: 7, name: "BGM" },
  { number: 8, name: "SFX" },
  { number: 9, name: "Render" },
] as const;

export const SCENE_OPTIONS = [2, 3, 4, 5, 6, 7, 8] as const;
export const SCENE_DURATION = 8;

export interface DeleteProjectRequest {
  project_id: string;
  confirm: boolean;
}

export interface DeleteProjectResponse {
  project_id: string;
  deleted: number;
  errors: string[];
  prefix: string;
}
