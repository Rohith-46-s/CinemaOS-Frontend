import {
  CreateProjectRequest,
  CreateProjectResponse,
  ProjectStatus,
  ProjectState,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

console.log("[API] Initialized with API_BASE_URL:", API_BASE_URL);

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      if (data.detail) {
        message = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new ApiError(message, response.status);
  }
  return response.json() as Promise<T>;
}

export async function createProject(
  request: CreateProjectRequest
): Promise<CreateProjectResponse> {
  const url = `${API_BASE_URL}/api/projects`;
  console.log("[API] createProject URL:", url);
  console.log("[API] createProject request:", request);
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  console.log("[API] createProject response status:", response.status);
  return handleResponse<CreateProjectResponse>(response);
}

export async function getProjectStatus(
  projectId: string
): Promise<ProjectStatus> {
  const response = await fetch(
    `${API_BASE_URL}/api/projects/${encodeURIComponent(projectId)}/status`
  );
  return handleResponse<ProjectStatus>(response);
}

export async function getProject(
  projectId: string
): Promise<ProjectState> {
  const response = await fetch(
    `${API_BASE_URL}/api/projects/${encodeURIComponent(projectId)}`
  );
  return handleResponse<ProjectState>(response);
}

export async function resumeProject(projectId: string): Promise<ProjectStatus> {
  const response = await fetch(
    `${API_BASE_URL}/api/projects/${encodeURIComponent(projectId)}/resume`,
    { method: "POST" }
  );
  return handleResponse<ProjectStatus>(response);
}

export function getResultUrl(projectId: string): string {
  return `${API_BASE_URL}/api/projects/${encodeURIComponent(projectId)}/result`;
}

export { API_BASE_URL };
