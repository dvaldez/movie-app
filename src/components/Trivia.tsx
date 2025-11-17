import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import './Trivia.css';

interface Question {
  question: string;
  options: string[];
  answer: string;
  mediaUrl?: string;       // URL to a short clip or still image
}

interface GenreTopic {
  label: string;
  value: string;
}

const genreTopics: GenreTopic[] = [
  { label: 'Action 🎬', value: 'action films' },
  { label: 'Comedy 😂', value: 'comedy films' },
  { label: 'Sci-Fi 🚀', value: 'science fiction films' },
  { label: 'Drama 🎭', value: 'dramatic films' },
  { label: 'Oscar Winners 🏆', value: 'oscar winning films' },
  { label: 'New Releases ✨', value: 'latest blockbuster releases' },
  { label: 'Blockbusters 💥', value: 'highest grossing blockbusters' },
  { label: "80s Classics 📼", value: "classic films from the 1980s" },
  { label: 'Animated 🐭', value: 'animated films' },
  { label: 'Disney 🏰', value: 'disney films' },  // ← NEW CATEGORY
];

type State = 'intro' | 'select' | 'loading' | 'playing' | 'finished';

export const Trivia: React.FC = () => {
  const [state, setState] = useState<State>('intro');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [error, setError] = useState<string | null>(null);
  const [fact, setFact] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<GenreTopic | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);

  // --- AUDIO REFS ---
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const correctSoundRef = useRef<HTMLAudioElement | null>(null);
  const wrongSoundRef = useRef<HTMLAudioElement | null>(null);

  // Floating text state
  const [floaters, setFloaters] = useState<
    { id: number; points: number; x: number; y: number }[]
  >([]);

  const funFacts = [
    "💡 The first animated feature was 'Snow White' (1937).",
    "💡 'Psycho' (1960) was the first to show a flushing toilet.",
    "💡 That cat in 'The Godfather' opening scene was a real stray.",
    "💡 James Caan almost played Han Solo in 'Star Wars'.",
    "💡 'Jurassic Park' broke new ground with VFX shots.",
  ];

  // Initialize audio on mount
  useEffect(() => {
    bgMusicRef.current = new Audio('/sounds/trivia-theme.mp3');
    bgMusicRef.current.loop = true;
    bgMusicRef.current.volume = 0.25;

    correctSoundRef.current = new Audio('/sounds/correct.mp3');
    correctSoundRef.current.volume = 0.6;

    wrongSoundRef.current = new Audio('/sounds/wrong.mp3');
    wrongSoundRef.current.volume = 0.6;

    return () => {
      bgMusicRef.current?.pause();
      bgMusicRef.current = null;
      correctSoundRef.current = null;
      wrongSoundRef.current = null;
    };
  }, []);

  // Play/pause background music on state change
  useEffect(() => {
    if (state === 'playing') {
      bgMusicRef.current?.play();
    } else {
      bgMusicRef.current?.pause();
      if (bgMusicRef.current) bgMusicRef.current.currentTime = 0;
    }
  }, [state]);

  // Rotate a fun fact on intro
  useEffect(() => {
    if (state === 'intro') {
      setFact(funFacts[Math.floor(Math.random() * funFacts.length)]);
    }
  }, [state]);

  // Confetti on correct
  const launchConfetti = () => {
    const end = Date.now() + 1500;
    (function frame() {
      confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0 } });
      confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  };

  // Countdown timer
  useEffect(() => {
    if (state === 'playing' && !selectedAnswer && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    } else if (state === 'playing' && timeLeft <= 0 && !selectedAnswer) {
      handleAnswer(''); // auto-submit empty if time runs out
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state, timeLeft, selectedAnswer]);

  // Fetch questions from backend (expecting mediaUrl in response)
  const chooseTopic = (topic: GenreTopic) => {
    setSelectedTopic(topic);
    setState('loading');
    setError(null);

    fetch('/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Expect backend to return [{ question, options, answer, mediaUrl }, ...]
      body: JSON.stringify({ topic: topic.value, n_questions: 5 }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`${res.status}: ${txt}`);
        }
        return res.json() as Promise<Question[]>;
      })
      .then((qs) => {
        setQuestions(qs);
        setCurrentIndex(0);
        setScore(0);
        setSelectedAnswer(null);
        setTimeLeft(20);
        startTimeRef.current = Date.now();
        setState('playing');
      })
      .catch((e) => {
        console.error(e);
        setError(e.message);
        setState('intro');
      });
  };

  // Handle answer & create floating text
  const handleAnswer = (opt: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSelectedAnswer(opt);

    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const correct = questions[currentIndex].answer;
    const pts = correct === opt ? 10 + (elapsed < 5 ? 5 : 0) : -5;
    setScore((s) => s + pts);

    if (opt === correct) {
      correctSoundRef.current?.play();
      launchConfetti();
    } else {
      wrongSoundRef.current?.play();
    }

    // Compute coordinates relative to .trivia container
    const scoreEl = document.querySelector('.trivia-header span:first-child');
    const containerEl = document.querySelector('.trivia');
    if (scoreEl && containerEl) {
      const scoreRect = scoreEl.getBoundingClientRect();
      const containerRect = containerEl.getBoundingClientRect();
      const centerX = scoreRect.left + scoreRect.width / 2 - containerRect.left;
      const centerY = scoreRect.top - containerRect.top;
      setFloaters((arr) => [
        ...arr,
        { id: Date.now(), points: pts, x: centerX, y: centerY },
      ]);
    }
  };

  // Next or finish
  const nextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setTimeLeft(20);
      startTimeRef.current = Date.now();
    } else {
      setState('finished');
    }
  };

  // Play again
  const playAgain = () => {
    setState('intro');
    setError(null);
  };

  // Derive theme class
  const themeClass = selectedTopic
    ? 'theme-' + selectedTopic.value.toLowerCase().replace(/[^a-z0-9]/g, '')
    : 'theme-default';

  // Helper: determine if mediaUrl is video or image (by extension)
  const isVideo = (url: string) => {
    return url.match(/\.(mp4|webm|ogg)(\?.*)?$/i) !== null;
  };

  return (
    <div className={`trivia ${themeClass}`}>
      {/* Floating text elements */}
      {floaters.map((f) => (
        <div
          key={f.id}
          className={`floating-points ${f.points < 0 ? 'negative' : ''}`}
          style={{ left: `${f.x}px`, top: `${f.y}px` }}
          onAnimationEnd={() =>
            setFloaters((arr) => arr.filter((x) => x.id !== f.id))
          }
        >
          {f.points > 0 ? `+${f.points}` : f.points}
        </div>
      ))}

      {state === 'intro' && (
        <div className="trivia-intro">
          <h1>🎥 Movie Trivia Challenge</h1>
          <p className="trivia-fact">{fact}</p>
          {error && <p className="error">{error}</p>}
          <button className="trivia-start" onClick={() => setState('select')}>
            Start Trivia
          </button>
        </div>
      )}

      {state === 'select' && (
        <div className="trivia-select">
          <h2>Choose a Category</h2>
          <div className="trivia-categories">
            {genreTopics.map((cat) => (
              <button
                key={cat.value}
                className="trivia-category"
                onClick={() => chooseTopic(cat)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {state === 'loading' && <p className="loading">Generating questions…</p>}

      {state === 'playing' && questions.length > 0 && (
        <>
          <div className="trivia-header">
            <span>💰 Score: {score}</span>
            <span>⏱️ Time: {timeLeft}s</span>
            <span>❓ Q {currentIndex + 1}/{questions.length}</span>
          </div>

          <div className="timer-bar">
            <div
              className="timer-fill"
              style={{ width: `${(timeLeft / 20) * 100}%` }}
            />
          </div>

          <div className="trivia-progress">
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${((currentIndex + 1) / questions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* If mediaUrl exists, render Video or Image */}
          {questions[currentIndex].mediaUrl && (
            <div className="trivia-media">
              {isVideo(questions[currentIndex].mediaUrl!) ? (
                <video
                  src={questions[currentIndex].mediaUrl}
                  className="media-element"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={questions[currentIndex].mediaUrl}
                  className="media-element"
                  alt="Trivia clue"
                />
              )}
            </div>
          )}

          <div className="trivia-question-container">
            <div className="trivia-question-text">
              {questions[currentIndex].question}
            </div>
          </div>

          <div className="trivia-options">
            {questions[currentIndex].options.map((opt) => {
              let cls = '';
              if (selectedAnswer) {
                cls =
                  opt === questions[currentIndex].answer
                    ? 'correct'
                    : opt === selectedAnswer
                    ? 'incorrect'
                    : '';
              }
              return (
                <button
                  key={opt}
                  className={`trivia-option ${cls}`}
                  onClick={() => !selectedAnswer && handleAnswer(opt)}
                  disabled={!!selectedAnswer}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {selectedAnswer && (
            <button className="trivia-next" onClick={nextQuestion}>
              {currentIndex + 1 < questions.length ? 'Next Question' : 'Finish'}
            </button>
          )}
        </>
      )}

      {state === 'finished' && (
        <div className="trivia-finish">
          <h2>All Done!</h2>
          <p>Your final score: {score}</p>
          <button className="trivia-start" onClick={playAgain}>
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

export default Trivia;
