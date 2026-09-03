import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CreatePage from "@/app/page";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

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

  it("renders the hero and creative mode selector", () => {
    render(<CreatePage />);
    expect(screen.getByText(/What do you want to create/)).toBeInTheDocument();
    expect(
      screen.getByText(/Describe your story. Choose a creative mode/)
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Generation profile")).toBeInTheDocument();
    expect(screen.getByText("Generate Cinema")).toBeInTheDocument();
  });

  it("renders all six generation profiles", () => {
    render(<CreatePage />);
    expect(screen.getByRole("radio", { name: /Movie/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /YouTube/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Reel/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Anime/ })).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Educational/ })
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Low cost/ })).toBeInTheDocument();
  });

  it("defaults to the movie profile", () => {
    render(<CreatePage />);
    const movie = screen.getByRole("radio", { name: /Movie/ });
    expect(movie).toHaveAttribute("aria-checked", "true");
  });

  it("shows dynamic hints when profile changes", () => {
    render(<CreatePage />);
    const reel = screen.getByRole("radio", { name: /Reel/ });
    fireEvent.click(reel);
    expect(reel).toHaveAttribute("aria-checked", "true");
    // Aspect ratio chip + highlight both mention 9:16 for Reel
    expect(screen.getAllByText(/9:16/).length).toBeGreaterThan(0);
    expect(screen.getByText(/designed for short-form/)).toBeInTheDocument();
  });

  it("shows duration dynamically based on scene count", () => {
    render(<CreatePage />);
    expect(screen.getByText(/2 scenes · ~16s/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "5" }));
    expect(screen.getByText(/5 scenes · ~40s/)).toBeInTheDocument();
  });

  it("validates empty prompt before submitting", async () => {
    render(<CreatePage />);
    fireEvent.click(screen.getByText("Generate Cinema"));
    expect(
      await screen.findByText(/Please describe the story/)
    ).toBeInTheDocument();
    expect(createProject).not.toHaveBeenCalled();
  });

  it("calls createProject with profile and stores project_id on success", async () => {
    (createProject as jest.Mock).mockResolvedValue({
      project_id: "CINEMA_20260827_TEST",
      status: "running",
      message: "Generation started.",
      profile: "reel",
    });

    render(<CreatePage />);
    const textarea = screen.getByPlaceholderText(/A lone astronaut/);
    fireEvent.change(textarea, {
      target: { value: "A boy in a forest." },
    });
    fireEvent.click(screen.getByRole("radio", { name: /Reel/ }));
    fireEvent.click(screen.getByText("Generate Cinema"));

    await waitFor(() => {
      expect(createProject).toHaveBeenCalledWith({
        prompt: "A boy in a forest.",
        scenes: 2,
        profile: "reel",
      });
    });
    expect(mockPush).toHaveBeenCalledWith(
      "/generate?project_id=CINEMA_20260827_TEST"
    );

    const stored = JSON.parse(
      localStorage.getItem("cinemaos_active_project") || "{}"
    );
    expect(stored.projectId).toBe("CINEMA_20260827_TEST");
    expect(stored.profile).toBe("reel");
  });

  it("shows backend error message on failure", async () => {
    (createProject as jest.Mock).mockRejectedValue(
      new ApiError("Cannot reach the CinemaOS backend.", 500)
    );

    render(<CreatePage />);
    const textarea = screen.getByPlaceholderText(/A lone astronaut/);
    fireEvent.change(textarea, {
      target: { value: "A boy in a forest." },
    });
    fireEvent.click(screen.getByText("Generate Cinema"));

    expect(
      await screen.findByText(/Cannot reach the CinemaOS backend/)
    ).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
