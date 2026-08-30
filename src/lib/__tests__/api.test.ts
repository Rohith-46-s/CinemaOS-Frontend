import {
  createProject,
  getProjectStatus,
  getProject,
  resumeProject,
  getResultUrl,
  ApiError,
  API_BASE_URL,
} from "@/lib/api";

describe("API base URL", () => {
  it("uses NEXT_PUBLIC_API_BASE_URL when set", () => {
    // The env var is set in .env.local to http://localhost:8000
    expect(API_BASE_URL).toBe("http://localhost:8000");
  });

  it("getResultUrl builds a URL from the configured base", () => {
    const url = getResultUrl("CINEMA_TEST_001");
    expect(url).toBe("http://localhost:8000/api/projects/CINEMA_TEST_001/result");
  });
});

describe("createProject", () => {
  it("sends prompt and scenes to the backend", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        project_id: "CINEMA_20260827_TEST",
        status: "running",
        message: "Generation started.",
      }),
    });
    global.fetch = mockFetch;

    const result = await createProject({
      prompt: "A boy in a forest.",
      scenes: 2,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/projects",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "A boy in a forest.", scenes: 2 }),
      })
    );
    expect(result.project_id).toBe("CINEMA_20260827_TEST");
  });
});

describe("getProjectStatus", () => {
  it("fetches status for a project", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        project_id: "CINEMA_TEST",
        status: "running",
        current_stage: "Video",
        current_stage_number: 7,
        total_stages: 10,
        completed_stages: ["Story", "Characters"],
        progress: 0.6,
        failed_stage: null,
        failed_stage_number: null,
        error: null,
        result_url: null,
      }),
    });
    global.fetch = mockFetch;

    const result = await getProjectStatus("CINEMA_TEST");
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/projects/CINEMA_TEST/status"
    );
    expect(result.status).toBe("running");
    expect(result.current_stage).toBe("Video");
    expect(result.progress).toBe(0.6);
  });
});

describe("getProject", () => {
  it("fetches project state", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        project_id: "CINEMA_TEST",
        status: "completed",
        stages: [],
      }),
    });
    global.fetch = mockFetch;

    await getProject("CINEMA_TEST");
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/projects/CINEMA_TEST"
    );
  });
});

describe("resumeProject", () => {
  it("POSTs to the resume endpoint", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        project_id: "CINEMA_TEST",
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
      }),
    });
    global.fetch = mockFetch;

    const result = await resumeProject("CINEMA_TEST");
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/projects/CINEMA_TEST/resume",
      expect.objectContaining({ method: "POST" })
    );
    expect(result.status).toBe("running");
  });
});

describe("error handling", () => {
  it("throws ApiError with detail on 4xx", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ detail: "Project not found: NOPE" }),
    });
    global.fetch = mockFetch;

    await expect(getProjectStatus("NOPE")).rejects.toThrow(ApiError);
    try {
      await getProjectStatus("NOPE");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(404);
      expect((err as ApiError).message).toBe("Project not found: NOPE");
    }
  });

  it("throws ApiError with status on 5xx", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });
    global.fetch = mockFetch;

    await expect(getProjectStatus("X")).rejects.toThrow(ApiError);
    try {
      await getProjectStatus("X");
    } catch (err) {
      expect((err as ApiError).status).toBe(500);
    }
  });
});
