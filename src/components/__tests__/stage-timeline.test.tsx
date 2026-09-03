import { render, screen } from "@testing-library/react";
import { StageTimeline } from "@/components/stage-timeline";
import { PIPELINE_STAGES } from "@/lib/types";

describe("StageTimeline", () => {
  it("renders the 9 active backend stages (Environment Assets excluded)", () => {
    render(
      <StageTimeline
        completedStages={[]}
        currentStage={null}
        failedStage={null}
      />
    );

    for (const stage of PIPELINE_STAGES) {
      expect(screen.getByText(stage.name)).toBeInTheDocument();
    }
    expect(screen.queryByText("Environment Assets")).not.toBeInTheDocument();
    expect(PIPELINE_STAGES).toHaveLength(9);
  });

  it("shows the current stage prominently", () => {
    render(
      <StageTimeline
        completedStages={["Story", "Characters", "Script"]}
        currentStage="Video"
        failedStage={null}
      />
    );
    expect(screen.getByText("Video")).toBeInTheDocument();
  });

  it("shows the failed stage", () => {
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
