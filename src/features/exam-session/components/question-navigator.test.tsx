import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuestionNavigator } from "@/features/exam-session/components/question-navigator";

const SAMPLE_ITEMS = [
  { questionId: "q1", orderNumber: 1, isAnswered: true, isFlagged: false },
  { questionId: "q2", orderNumber: 2, isAnswered: true, isFlagged: true },
  { questionId: "q3", orderNumber: 3, isAnswered: false, isFlagged: true },
  { questionId: "q4", orderNumber: 4, isAnswered: false, isFlagged: false },
];

describe("QuestionNavigator", () => {
  it("should filter questions by Kosong and Ragu and invoke onSelectIndex", async () => {
    const user = userEvent.setup();
    const onSelectIndex = vi.fn();

    render(
      <QuestionNavigator
        items={SAMPLE_ITEMS}
        currentIndex={0}
        onSelectIndex={onSelectIndex}
      />
    );

    expect(screen.getByRole("button", { name: /Soal nomor 1/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Soal nomor 4/i })).toBeInTheDocument();

    // Filter to Ragu (items 2 and 3)
    await user.click(screen.getByRole("button", { name: "Ragu" }));
    expect(screen.queryByRole("button", { name: /Soal nomor 1/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Soal nomor 2/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Soal nomor 3/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Soal nomor 3/i }));
    expect(onSelectIndex).toHaveBeenCalledWith(2);
  });
});
