import {
  createProject,
  getProjectStatus,
  getProject,
  resumeProject,
  getResultUrl,
  deleteProjectMedia,
  ApiError,
  API_BASE_URL,
} from "@/lib/api";

describe("API base URL", () => {
  it("uses NEXT_PUBLIC_API_BASE_URL when set", () => {
    expect(API_BASE_URL).toBe("http://localhost:8000");
  });

  it("getResultUrl builds a URL from the configured base", () => {
    const url = getResultUrl("CINEMA_TEST_001");
    expect(url).toBe("http://localhost:8000/api/projects/CINEMA_TEST_001/result");
  });
});

describe("createProject", () => {
  it("sends prompt, scenes, and profile to the backend", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        project_id: "CINEMA_20260827_TEST",
        status: "running",
        message: "Generation started.",
        profile: "reel",
      }),
    });
    global.fetch = mockFetch;

    const result = await createProject({
      prompt: "A boy in a forest.",
      scenes: 2,
      profile: "reel",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/projects",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "A boy in a forest.",
          scenes: 2,
          profile: "reel",
        }),
      })
    );
    expect(result.project_id).toBe("CINEMA_20260827_TEST");
    expect(result.profile).toBe("reel");
  });

  it("does not include profile key when not provided (backend defaults to movie)", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        project_id: "CINEMA_X",
        status: "running",
        message: "Generation started.",
        profile: "movie",
      }),
    });
    global.fetch = mockFetch;

    await createProject({ prompt: "Hi", scenes: 2 });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.profile).toBeUndefined();
    // The backend's default is "movie" — the frontend just omits the key
    // so the backend can default to movie (or any future default).
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
        current_stage_number: 6,
        total_stages: 9,
        completed_stages: ["Story", "Characters"],
        progress: 0.6,
        failed_stage: null,
        failed_stage_number: null,
        error: null,
        result_url: null,
        profile: "movie",
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
    expect(result.profile).toBe("movie");
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
        current_stage_number: 8,
        total_stages: 9,
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

describe("deleteProjectMedia", () => {
  it("POSTs to /delete with confirm=true in the body", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        project_id: "CINEMA_TEST",
        deleted: 4,
        errors: [],
        prefix: "cinemaos/projects/CINEMA_TEST/",
      }),
    });
    global.fetch = mockFetch;

    const result = await deleteProjectMedia({
      project_id: "CINEMA_TEST",
      confirm: true,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/projects/CINEMA_TEST/delete",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: "CINEMA_TEST",
          confirm: true,
        }),
      })
    );
    expect(result.deleted).toBe(4);
    expect(result.prefix).toBe("cinemaos/projects/CINEMA_TEST/");
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
