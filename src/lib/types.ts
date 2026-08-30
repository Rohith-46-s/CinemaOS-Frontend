export interface CreateProjectRequest {
  prompt: string;
  scenes: number;
}

export interface CreateProjectResponse {
  project_id: string;
  status: string;
  message: string;
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
}

export const PIPELINE_STAGES = [
  { number: 1, name: "Story" },
  { number: 2, name: "Characters" },
  { number: 3, name: "Character Assets" },
  { number: 4, name: "Environment" },
  { number: 5, name: "Environment Assets" },
  { number: 6, name: "Script" },
  { number: 7, name: "Video" },
  { number: 8, name: "BGM" },
  { number: 9, name: "SFX" },
  { number: 10, name: "Render" },
] as const;

export const SCENE_OPTIONS = [2, 3, 4, 5, 6, 7, 8] as const;
export const SCENE_DURATION = 8; // seconds per scene
