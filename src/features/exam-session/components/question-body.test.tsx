import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuestionBody } from "@/features/exam-session/components/question-body";
import type { StudentExamQuestion } from "@/types/domain";

const SAMPLE_QUESTION: StudentExamQuestion = {
  id: "q1",
  orderNumber: 1,
  type: "SINGLE_CHOICE",
  difficulty: "MEDIUM",
  stimulus: "Perpustakaan sekolah kini menjadi ruang belajar kolaboratif.",
  prompt: "Apa fungsi utama perpustakaan pada wacana tersebut?",
  imagePath: null,
  points: 20,
  options: [
    { id: "a", label: "A", text: "Gudang arsip lama" },
    { id: "b", label: "B", text: "Ruang belajar kolaboratif" },
  ],
};

describe("QuestionBody", () => {
  it("should allow selecting an option and striking through a distractor independently", async () => {
    const user = userEvent.setup();
    const onChangeAnswer = vi.fn();
    const onToggleEliminate = vi.fn();
    const onToggleSplitPane = vi.fn();

    render(
      <QuestionBody
        question={SAMPLE_QUESTION}
        answer={null}
        eliminatedOptionIds={[]}
        fontScale="md"
        splitPane={true}
        onToggleSplitPane={onToggleSplitPane}
        onChangeAnswer={onChangeAnswer}
        onToggleEliminate={onToggleEliminate}
      />
    );

    expect(screen.getByText(/Wacana \/ Stimulus/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Coret pengecoh opsi A/i }));
    expect(onToggleEliminate).toHaveBeenCalledWith("a");
    expect(onChangeAnswer).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /Ruang belajar kolaboratif/i }));
    expect(onChangeAnswer).toHaveBeenCalledWith("b");
  });
});
