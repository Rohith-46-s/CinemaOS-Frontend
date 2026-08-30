import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CreatePage from "@/app/page";

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock API module
jest.mock("@/lib/api", () => ({
  createProject: jest.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

import { createProject, ApiError } from "@/lib/api";

describe("CreatePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("renders the CinemaOS header and subtitle", () => {
    render(<CreatePage />);
    expect(screen.getByText("CINEMAOS")).toBeInTheDocument();
    expect(screen.getByText("Turn your imagination into cinema.")).toBeInTheDocument();
  });

  it("renders the prompt textarea and scene selector", () => {
    render(<CreatePage />);
    expect(screen.getByPlaceholderText("Describe the story you want to create...")).toBeInTheDocument();
    expect(screen.getByText("Generate Cinema")).toBeInTheDocument();
  });

  it("shows duration dynamically based on scene count", () => {
    render(<CreatePage />);
    // Default 2 scenes = 16 seconds
    expect(screen.getByText(/2 scenes · ~16 seconds total/)).toBeInTheDocument();

    // Select 5 scenes
    fireEvent.click(screen.getByText("5"));
    expect(screen.getByText(/5 scenes · ~40 seconds total/)).toBeInTheDocument();
  });

  it("validates empty prompt before submitting", async () => {
    render(<CreatePage />);
    fireEvent.click(screen.getByText("Generate Cinema"));
    expect(await screen.findByText(/Please describe the story/)).toBeInTheDocument();
    expect(createProject).not.toHaveBeenCalled();
  });

  it("calls createProject and stores project_id on success", async () => {
    (createProject as jest.Mock).mockResolvedValue({
      project_id: "CINEMA_20260827_TEST",
      status: "running",
      message: "Generation started.",
    });

    render(<CreatePage />);
    const textarea = screen.getByPlaceholderText("Describe the story you want to create...");
    fireEvent.change(textarea, { target: { value: "A boy in a forest." } });
    fireEvent.click(screen.getByText("Generate Cinema"));

    await waitFor(() => {
      expect(createProject).toHaveBeenCalledWith({ prompt: "A boy in a forest.", scenes: 2 });
    });
    expect(mockPush).toHaveBeenCalledWith("/generate?project_id=CINEMA_20260827_TEST");

    // Verify localStorage was set
    const stored = JSON.parse(localStorage.getItem("cinemaos_active_project") || "{}");
    expect(stored.projectId).toBe("CINEMA_20260827_TEST");
  });

  it("shows backend error message on failure", async () => {
    (createProject as jest.Mock).mockRejectedValue(
      new ApiError("Cannot reach the CinemaOS backend.", 500)
    );

    render(<CreatePage />);
    const textarea = screen.getByPlaceholderText("Describe the story you want to create...");
    fireEvent.change(textarea, { target: { value: "A boy in a forest." } });
    fireEvent.click(screen.getByText("Generate Cinema"));

    expect(await screen.findByText(/Cannot reach the CinemaOS backend/)).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
