import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import GeneratePage from "@/app/generate/page";

const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("project_id=CINEMA_TEST_001"),
  useRouter: () => ({ push: jest.fn(), replace: mockReplace }),
}));

jest.mock("@/lib/api", () => ({
  getProjectStatus: jest.fn(),
  resumeProject: jest.fn(),
  deleteProjectMedia: jest.fn(),
  getResultUrl: (id: string) => `http://localhost:8000/api/projects/${id}/result`,
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

import { getProjectStatus, resumeProject, deleteProjectMedia } from "@/lib/api";

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
      current_stage_number: 6,
      total_stages: 9,
      completed_stages: ["Story", "Characters", "Script"],
      progress: 0.6,
      failed_stage: null,
      failed_stage_number: null,
      error: null,
      result_url: null,
      profile: "movie",
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
      current_stage_number: 6,
      total_stages: 9,
      completed_stages: ["Story", "Characters"],
      progress: 0.6,
      failed_stage: null,
      failed_stage_number: null,
      error: null,
      result_url: null,
      profile: "reel",
    });

    render(<GeneratePage />);

    await waitFor(() => {
      expect(screen.getByText("60%")).toBeInTheDocument();
    });
    expect(screen.getAllByText("Video").length).toBeGreaterThan(0);
    expect(screen.getByText("Reel")).toBeInTheDocument();
  });

  it("shows completed state with video when status is completed", async () => {
    (getProjectStatus as jest.Mock).mockResolvedValue({
      project_id: "CINEMA_TEST_001",
      status: "completed",
      prompt: "A boy.",
      current_stage: null,
      current_stage_number: null,
      total_stages: 9,
      completed_stages: [
        "Story",
        "Characters",
        "Character Assets",
        "Environment",
        "Script",
        "Video",
        "BGM",
        "SFX",
        "Render",
      ],
      progress: 1.0,
      failed_stage: null,
      failed_stage_number: null,
      error: null,
      result_url: "/api/projects/CINEMA_TEST_001/result",
      profile: "movie",
    });

    render(<GeneratePage />);

    await waitFor(() => {
      expect(screen.getAllByText("Your cinema is ready").length).toBeGreaterThan(0);
    });

    const videoEl = document.querySelector("video");
    expect(videoEl).toBeInTheDocument();
    expect(videoEl?.getAttribute("src")).toBe(
      "http://localhost:8000/api/projects/CINEMA_TEST_001/result"
    );

    expect(screen.getByText("Download Video")).toBeInTheDocument();
    expect(screen.getByText("Create Another")).toBeInTheDocument();
    expect(screen.getByText("Delete project media")).toBeInTheDocument();
  });

  it("opens delete confirmation dialog when Delete is clicked", async () => {
    (getProjectStatus as jest.Mock).mockResolvedValue({
      project_id: "CINEMA_TEST_001",
      status: "completed",
      prompt: "A boy.",
      current_stage: null,
      current_stage_number: null,
      total_stages: 9,
      completed_stages: ["Render"],
      progress: 1.0,
      failed_stage: null,
      failed_stage_number: null,
      error: null,
      result_url: "/api/projects/CINEMA_TEST_001/result",
      profile: "movie",
    });

    render(<GeneratePage />);
    await waitFor(() =>
      expect(screen.getByText("Delete project media")).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText("Delete project media"));

    expect(
      await screen.findByText(/permanently deletes generated media/)
    ).toBeInTheDocument();
    expect(
      screen.getByText("Permanently delete")
    ).toBeInTheDocument();
  });

  it("calls deleteProjectMedia with confirm=true when confirmed", async () => {
    (getProjectStatus as jest.Mock).mockResolvedValue({
      project_id: "CINEMA_TEST_001",
      status: "completed",
      prompt: "A boy.",
      current_stage: null,
      current_stage_number: null,
      total_stages: 9,
      completed_stages: ["Render"],
      progress: 1.0,
      failed_stage: null,
      failed_stage_number: null,
      error: null,
      result_url: "/api/projects/CINEMA_TEST_001/result",
      profile: "movie",
    });
    (deleteProjectMedia as jest.Mock).mockResolvedValue({
      project_id: "CINEMA_TEST_001",
      deleted: 4,
      errors: [],
      prefix: "cinemaos/projects/CINEMA_TEST_001/",
    });

    render(<GeneratePage />);
    await waitFor(() =>
      expect(screen.getByText("Delete project media")).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText("Delete project media"));
    fireEvent.click(await screen.findByText("Permanently delete"));

    await waitFor(() => {
      expect(deleteProjectMedia).toHaveBeenCalledWith({
        project_id: "CINEMA_TEST_001",
        confirm: true,
      });
    });
  });

  it("shows failed state with backend error and current stage", async () => {
    (getProjectStatus as jest.Mock).mockResolvedValue({
      project_id: "CINEMA_TEST_001",
      status: "failed",
      prompt: "A boy.",
      current_stage: null,
      current_stage_number: null,
      total_stages: 9,
      completed_stages: ["Story", "Characters"],
      progress: 0.2,
      failed_stage: "SFX",
      failed_stage_number: 8,
      error: {
        stage: "SFX",
        stage_number: 8,
        reason: "Audio generation failed: quota exceeded",
      },
      result_url: null,
      profile: "movie",
    });

    render(<GeneratePage />);

    await waitFor(() => {
      expect(screen.getAllByText("Generation stopped").length).toBeGreaterThan(0);
    });

    expect(
      screen.getByText("Audio generation failed: quota exceeded")
    ).toBeInTheDocument();
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
      total_stages: 9,
      completed_stages: ["Story"],
      progress: 0.1,
      failed_stage: "SFX",
      failed_stage_number: 8,
      error: { stage: "SFX", stage_number: 8, reason: "Failed" },
      result_url: null,
      profile: "movie",
    });
    (resumeProject as jest.Mock).mockResolvedValue({
      project_id: "CINEMA_TEST_001",
      status: "running",
      current_stage: "SFX",
      current_stage_number: 8,
      total_stages: 9,
      completed_stages: ["Story"],
      progress: 0.1,
      failed_stage: null,
      failed_stage_number: null,
      error: null,
      result_url: null,
      profile: "movie",
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
