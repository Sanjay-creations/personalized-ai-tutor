"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  CheckCircle2,
  Gamepad2,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";

const questions = [
  {
    question: "Which statement best describes a variable in programming?",
    options: [
      "A named place used to store a value",
      "A command that always prints text",
      "A type of computer monitor",
      "A programming error",
    ],
    answer: 0,
  },
  {
    question: "Which of these is commonly used to repeat a block of code?",
    options: ["Loop", "Comment", "Variable", "File"],
    answer: 0,
  },
  {
    question: "What does an algorithm represent?",
    options: [
      "A step-by-step method for solving a problem",
      "A computer screen",
      "A keyboard shortcut",
      "A type of database only",
    ],
    answer: 0,
  },
];

export default function ConceptPuzzlePage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);
  const [savingResult, setSavingResult] = useState(false);

  const question = questions[currentQuestion];

  function chooseAnswer(index: number) {
    if (answered) return;

    setSelectedAnswer(index);
    setAnswered(true);

    if (index === question.answer) {
      setScore((previousScore) => previousScore + 1);
    }
  }

  async function nextQuestion() {
    const next = currentQuestion + 1;

    if (next >= questions.length) {
      // Include the current answer because React state updates are asynchronous.
      const currentAnswerIsCorrect =
        selectedAnswer === question.answer ? 1 : 0;

      const finalScore = score + currentAnswerIsCorrect;
      const finalAccuracy = Math.round(
        (finalScore / questions.length) * 100
      );
      const finalXp = finalScore * 25;

      setSavingResult(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase.from("game_results").insert({
          user_id: user.id,
          game_name: "Concept Puzzle",
          subject: "Programming",
          topic: "Programming Concepts",
          difficulty: "Medium",
          score: finalScore,
          correct_answers: finalScore,
          incorrect_answers: questions.length - finalScore,
          accuracy: finalAccuracy,
          xp_earned: finalXp,
        });

        if (error) {
          console.error("Could not save game result:", error);
        }
      }

      setSavingResult(false);
      setFinished(true);
      return;
    }

    setCurrentQuestion(next);
    setSelectedAnswer(null);
    setAnswered(false);
  }

  function restartGame() {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setAnswered(false);
    setFinished(false);
    setSavingResult(false);
  }

  const finalAccuracy = Math.round((score / questions.length) * 100);
  const xpEarned = score * 25;

  return (
    <main className="game-page">
      <header className="game-header">
        <a href="/school-student/games" className="back-button">
          <ArrowLeft size={17} />
          Back to Games
        </a>

        <div className="dashboard-brand">
          <div className="dashboard-logo">
            <Gamepad2 size={21} />
          </div>
          <span>EDUQUEST</span>
        </div>

        <div className="game-header-badge">
          <Sparkles size={15} />
          CONCEPT PUZZLE
        </div>
      </header>

      <section className="game-container">
        {!finished ? (
          <>
            <div className="game-top-row">
              <div>
                <p className="dashboard-label">CONCEPT PUZZLE</p>
                <h1>Think. Solve. Learn.</h1>
              </div>

              <div className="question-count">
                Question {currentQuestion + 1} / {questions.length}
              </div>
            </div>

            <div className="game-progress">
              <div
                className="game-progress-value"
                style={{
                  width: `${
                    ((currentQuestion + 1) / questions.length) * 100
                  }%`,
                }}
              />
            </div>

            <div className="question-card">
              <div className="question-icon">
                <Gamepad2 size={28} />
              </div>

              <h2>{question.question}</h2>

              <div className="answer-list">
                {question.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrect = index === question.answer;

                  let className = "answer-option";

                  if (answered && isCorrect) {
                    className += " correct";
                  } else if (answered && isSelected && !isCorrect) {
                    className += " incorrect";
                  } else if (isSelected) {
                    className += " selected";
                  }

                  return (
                    <button
                      key={option}
                      className={className}
                      onClick={() => chooseAnswer(index)}
                      disabled={answered}
                    >
                      <span className="answer-letter">
                        {String.fromCharCode(65 + index)}
                      </span>

                      <span>{option}</span>

                      {answered && isCorrect && (
                        <CheckCircle2 size={18} />
                      )}

                      {answered && isSelected && !isCorrect && (
                        <XCircle size={18} />
                      )}
                    </button>
                  );
                })}
              </div>

              {answered && (
                <div
                  className={
                    selectedAnswer === question.answer
                      ? "answer-feedback correct-feedback"
                      : "answer-feedback incorrect-feedback"
                  }
                >
                  {selectedAnswer === question.answer
                    ? "Correct! Great work."
                    : `Not quite. The correct answer is "${question.options[question.answer]}".`}
                </div>
              )}

              {answered && (
                <button
                  className="primary-button next-button"
                  onClick={nextQuestion}
                  disabled={savingResult}
                >
                  {savingResult
                    ? "Saving Result..."
                    : currentQuestion === questions.length - 1
                      ? "Finish Game"
                      : "Next Question"}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="game-result">
            <div className="result-icon">
              <Trophy size={42} />
            </div>

            <p className="dashboard-label">GAME COMPLETE</p>

            <h1>
              You completed the
              <span> Concept Puzzle!</span>
            </h1>

            <div className="result-stats">
              <div>
                <strong>
                  {score}/{questions.length}
                </strong>
                <span>Correct</span>
              </div>

              <div>
                <strong>{finalAccuracy}%</strong>
                <span>Accuracy</span>
              </div>

              <div>
                <strong>+{xpEarned}</strong>
                <span>XP Earned</span>
              </div>
            </div>

            <div className="result-actions">
              <button
                className="primary-button"
                onClick={restartGame}
              >
                Play Again
              </button>

              <a
                href="/school-student/games"
                className="secondary-button"
              >
                Choose Another Game
              </a>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}