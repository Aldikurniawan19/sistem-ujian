import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { ExamTimer } from "@/features/exam-session/components/exam-timer";

describe("ExamTimer", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should count down and trigger onExpire exactly once at 00:00", () => {
    vi.useFakeTimers();
    const onExpire = vi.fn();

    render(<ExamTimer initialRemainingSeconds={2} onExpire={onExpire} />);

    expect(screen.getByText("00:02")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText("00:01")).toBeInTheDocument();
    expect(onExpire).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText("00:00")).toBeInTheDocument();
    expect(onExpire).toHaveBeenCalledTimes(1);
  });
});
