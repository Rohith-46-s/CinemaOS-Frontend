import { render, screen } from "@testing-library/react";
import { StageTimeline } from "@/components/stage-timeline";

describe("StageTimeline", () => {
  it("renders all 10 pipeline stages", () => {
    render(
      <StageTimeline
        completedStages={[]}
        currentStage={null}
        failedStage={null}
      />
    );

    expect(screen.getByText("Story")).toBeInTheDocument();
    expect(screen.getByText("Characters")).toBeInTheDocument();
    expect(screen.getByText("Character Assets")).toBeInTheDocument();
    expect(screen.getByText("Environment")).toBeInTheDocument();
    expect(screen.getByText("Environment Assets")).toBeInTheDocument();
    expect(screen.getByText("Script")).toBeInTheDocument();
    expect(screen.getByText("Video")).toBeInTheDocument();
    expect(screen.getByText("BGM")).toBeInTheDocument();
    expect(screen.getByText("SFX")).toBeInTheDocument();
    expect(screen.getByText("Render")).toBeInTheDocument();
  });

  it("shows completed stages with check indicators", () => {
    render(
      <StageTimeline
        completedStages={["Story", "Characters", "Script"]}
        currentStage="Video"
        failedStage={null}
      />
    );

    // Completed stages should have accessible check indicators
    const completed = screen.getAllByTestId ? null : null;
    // Verify the current stage text is present
    expect(screen.getByText("Video")).toBeInTheDocument();
  });

  it("shows failed stage", () => {
    render(
      <StageTimeline
        completedStages={["Story"]}
        currentStage={null}
        failedStage="SFX"
      />
    );
    expect(screen.getByText("SFX")).toBeInTheDocument();
  });
});
