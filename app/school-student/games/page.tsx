"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Brain,
  Gamepad2,
  Trophy,
  Zap,
  Timer,
  Puzzle,
  Swords,
  Sparkles,
  Target,
} from "lucide-react";

const gameCategories = [
  {
    name: "Speed Games",
    icon: Zap,
    games: [
      "Speed Sprint",
      "Time Attack",
      "Rapid Fire",
      "Lightning Round",
      "Formula Flash",
    ],
  },
  {
    name: "Memory Games",
    icon: Brain,
    games: [
      "Memory Rush",
      "Flashcard Battle",
      "Match the Pair",
      "Memory Grid",
      "Recall Race",
    ],
  },
  {
    name: "Puzzle Games",
    icon: Puzzle,
    games: [
      "Concept Puzzle",
      "Subject Labyrinth",
      "Knowledge Escape Room",
      "Equation Builder",
      "Code Puzzle",
      "Concept Connect",
    ],
  },
  {
    name: "Competitive Games",
    icon: Swords,
    games: [
      "Rank Battles",
      "Topic War",
      "AI Rival",
      "Knowledge Duel",
      "Team Challenge",
    ],
  },
  {
    name: "AI-Adaptive Games",
    icon: Sparkles,
    games: [
      "Weakness Hunter",
      "Difficulty Climb",
      "AI Learning Quest",
      "Mistake Master",
      "Smart Revision Challenge",
    ],
  },
  {
    name: "Exam Games",
    icon: Target,
    games: [
      "Exam Quest",
      "Exam Panic Mode",
      "Mock Test Marathon",
      "Rank Climber",
      "Target Score",
      "Last Minute Revision Race",
    ],
  },
  {
    name: "Strategy Games",
    icon: Trophy,
    games: [
      "Risk or Reward",
      "Knowledge Bank",
      "Question Roulette",
      "Strategy Tower",
      "Resource Challenge",
    ],
  },
  {
    name: "Adventure Games",
    icon: Gamepad2,
    games: [
      "Learning Adventure",
      "Treasure Hunt",
      "Mystery Solver",
      "Learning Mission",
      "Knowledge Kingdom",
    ],
  },
];

export default function GamesPage() {
  const [subject, setSubject] = useState("Mathematics");
  const [topic, setTopic] = useState("Algebra");
  const [difficulty, setDifficulty] = useState("Medium");
  const [selectedGame, setSelectedGame] = useState("");
  const [started, setStarted] = useState(false);

  function startGame() {
    if (!selectedGame) {
      alert("Please choose a game first.");
      return;
    }

    setStarted(true);
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <a href="/school-student" className="back-button">
          <ArrowLeft size={17} />
          Back to Dashboard
        </a>

        <div className="dashboard-brand">
          <div className="dashboard-logo">
            <Gamepad2 size={21} />
          </div>
          <span>EDUQUEST</span>
        </div>

        <div className="student-profile">
          <div className="avatar">S</div>
          <span>Student</span>
        </div>
      </header>

      <section className="dashboard-content">
        <div className="welcome">
          <p className="dashboard-label">LEARNING GAMES</p>

          <h1>
            Learn by
            <span> playing.</span>
          </h1>

          <p>
            Choose your subject, topic, game and difficulty. You decide how
            you want to practice.
          </p>
        </div>

        <div className="game-controls">
          <div className="game-control">
            <label>Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              <option>Mathematics</option>
              <option>Science</option>
              <option>Programming</option>
              <option>English</option>
              <option>History</option>
              <option>Geography</option>
            </select>
          </div>

          <div className="game-control">
            <label>Topic</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter a topic"
            />
          </div>

          <div className="game-control">
            <label>Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
              <option>AI Adaptive</option>
            </select>
          </div>
        </div>

        <div className="selected-game-box">
          <div>
            <p>SELECTED GAME</p>
            <h2>{selectedGame || "Choose a game below"}</h2>

            {selectedGame && (
              <span>
                {subject} • {topic} • {difficulty}
              </span>
            )}
          </div>

          <button
  className="primary-button"
  onClick={() => {
    if (!selectedGame) {
      alert("Please choose a game first.");
      return;
    }

    if (selectedGame === "Concept Puzzle") {
      window.location.href = "/school-student/games/concept-puzzle";
      return;
    }

    startGame();
  }}
>
            Start Game
            <Gamepad2 size={18} />
          </button>
        </div>

        {started && (
          <div className="game-started-message">
            <Sparkles size={20} />
            <div>
              <strong>{selectedGame} is ready!</strong>
              <p>
                You selected {subject}, {topic}, and {difficulty} difficulty.
                The real game engine will run this session in the next stage.
              </p>
            </div>
          </div>
        )}

        <div className="game-library">
          {gameCategories.map((category) => {
            const Icon = category.icon;

            return (
              <section className="game-category" key={category.name}>
                <div className="game-category-heading">
                  <Icon size={20} />
                  <h2>{category.name}</h2>
                </div>

                <div className="game-list">
                  {category.games.map((game) => (
                    <button
                      key={game}
                      className={`game-option ${
                        selectedGame === game ? "selected" : ""
                      }`}
                      onClick={() => {
                        setSelectedGame(game);
                        setStarted(false);
                      }}
                    >
                      <Gamepad2 size={18} />
                      <span>{game}</span>
                      <span className="game-arrow">→</span>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}