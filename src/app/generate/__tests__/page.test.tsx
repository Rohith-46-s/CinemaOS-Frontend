import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import GeneratePage from "@/app/generate/page";

// Mock next/navigation
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("project_id=CINEMA_TEST_001"),
  useRouter: () => ({ push: jest.fn(), replace: mockReplace }),
}));

// Mock API module
jest.mock("@/lib/api", () => ({
  getProjectStatus: jest.fn(),
  resumeProject: jest.fn(),
  getResultUrl: (id: string) => `http://localhost:8000/api/projects/${id}/result`,
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

import { getProjectStatus, resumeProject } from "@/lib/api";

describe("GeneratePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("polls status on mount", async () => {
    (getProjectStatus as jest.Mock).mockResolvedValue({
      project_id: "CINEMA_TEST_001",
      status: "running",
      prompt: "A boy in a forest.",
      current_stage: "Video",
      current_stage_number: 7,
      total_stages: 10,
      completed_stages: ["Story", "Characters", "Character Assets", "Environment", "Environment Assets", "Script"],
      progress: 0.6,
      failed_stage: null,
      failed_stage_number: null,
      error: null,
      result_url: null,
    });

    render(<GeneratePage />);

    await waitFor(() => {
      expect(screen.getByText("Creating your cinema")).toBeInTheDocument();
    });

    expect(getProjectStatus).toHaveBeenCalledWith("CINEMA_TEST_001");
  });

  it("displays progress from backend", async () => {
    (getProjectStatus as jest.Mock).mockResolvedValue({
      project_id: "CINEMA_TEST_001",
      status: "running",
      prompt: "A boy.",
      current_stage: "Video",
      current_stage_number: 7,
      total_stages: 10,
      completed_stages: ["Story", "Characters"],
      progress: 0.6,
      failed_stage: null,
      failed_stage_number: null,
      error: null,
      result_url: null,
    });

    render(<GeneratePage />);

    await waitFor(() => {
      expect(screen.getByText("60%")).toBeInTheDocument();
    });
    expect(screen.getByText(/Stage 7 of 10 — Video/)).toBeInTheDocument();
  });

  it("shows completed state with video when status is completed", async () => {
    (getProjectStatus as jest.Mock).mockResolvedValue({
      project_id: "CINEMA_TEST_001",
      status: "completed",
      prompt: "A boy.",
      current_stage: null,
      current_stage_number: null,
      total_stages: 10,
      completed_stages: ["Story", "Characters", "Character Assets", "Environment", "Environment Assets", "Script", "Video", "BGM", "SFX", "Render"],
      progress: 1.0,
      failed_stage: null,
      failed_stage_number: null,
      error: null,
      result_url: "/api/projects/CINEMA_TEST_001/result",
    });

    render(<GeneratePage />);

    await waitFor(() => {
      expect(screen.getAllByText("Your cinema is ready").length).toBeGreaterThan(0);
    });

    // Check for video element
    const videoEl = document.querySelector("video");
    expect(videoEl).toBeInTheDocument();
    expect(videoEl?.getAttribute("src")).toBe("http://localhost:8000/api/projects/CINEMA_TEST_001/result");

    expect(screen.getByText("Download")).toBeInTheDocument();
    expect(screen.getByText("Create Another")).toBeInTheDocument();
  });

  it("shows failed state with backend error", async () => {
    (getProjectStatus as jest.Mock).mockResolvedValue({
      project_id: "CINEMA_TEST_001",
      status: "failed",
      prompt: "A boy.",
      current_stage: null,
      current_stage_number: null,
      total_stages: 10,
      completed_stages: ["Story", "Characters"],
      progress: 0.2,
      failed_stage: "SFX",
      failed_stage_number: 9,
      error: {
        stage: "SFX",
        stage_number: 9,
        reason: "Audio generation failed: quota exceeded",
      },
      result_url: null,
    });

    render(<GeneratePage />);

    await waitFor(() => {
      expect(screen.getAllByText("Generation stopped").length).toBeGreaterThan(0);
    });

    expect(screen.getByText("Audio generation failed: quota exceeded")).toBeInTheDocument();
    expect(screen.getByText("Resume Generation")).toBeInTheDocument();
    expect(screen.getByText("Back to Create")).toBeInTheDocument();
  });

  it("resume button calls resumeProject", async () => {
    (getProjectStatus as jest.Mock).mockResolvedValue({
      project_id: "CINEMA_TEST_001",
      status: "failed",
      prompt: "A boy.",
      current_stage: null,
      current_stage_number: null,
      total_stages: 10,
      completed_stages: ["Story"],
      progress: 0.1,
      failed_stage: "SFX",
      failed_stage_number: 9,
      error: { stage: "SFX", stage_number: 9, reason: "Failed" },
      result_url: null,
    });
    (resumeProject as jest.Mock).mockResolvedValue({
      project_id: "CINEMA_TEST_001",
      status: "running",
      current_stage: "SFX",
      current_stage_number: 9,
      total_stages: 10,
      completed_stages: ["Story"],
      progress: 0.1,
      failed_stage: null,
      failed_stage_number: null,
      error: null,
      result_url: null,
    });

    render(<GeneratePage />);

    await waitFor(() => {
      expect(screen.getByText("Resume Generation")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Resume Generation"));

    await waitFor(() => {
      expect(resumeProject).toHaveBeenCalledWith("CINEMA_TEST_001");
    });
  });
});
