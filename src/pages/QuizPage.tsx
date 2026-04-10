import { useState, useEffect, useCallback } from "react";
import type { VocabWord } from "../features/vocabs/type";
import styles from "./QuizPage.module.css";

/* ─── Mock data (sau này thay bằng API / store) ─────────── */
const VOCAB_POOL: VocabWord[] = [
    { id: "1", word: "Ephemeral", meaning: "Tồn tại trong thời gian ngắn; phù du" },
    { id: "2", word: "Benevolent", meaning: "Nhân từ; tốt bụng; hào phóng" },
    { id: "3", word: "Serendipity", meaning: "May mắn tình cờ; sự tình cờ thú vị" },
    { id: "4", word: "Melancholy", meaning: "Buồn bã; u sầu sâu sắc" },
    { id: "5", word: "Eloquent", meaning: "Hùng hồn; diễn đạt trôi chảy và thuyết phục" },
    { id: "6", word: "Ambiguous", meaning: "Mơ hồ; có thể hiểu theo nhiều nghĩa" },
    { id: "7", word: "Resilient", meaning: "Kiên cường; có khả năng phục hồi nhanh" },
    { id: "8", word: "Meticulous", meaning: "Tỉ mỉ; cẩn thận đến từng chi tiết nhỏ" },
    { id: "9", word: "Tenacious", meaning: "Kiên trì; bền bỉ không bỏ cuộc" },
    { id: "10", word: "Profound", meaning: "Sâu sắc; có ý nghĩa lớn lao" },
];

const OPTION_LABELS = ["A", "B", "C", "D"] as const;

/* ─── Types ─────────────────────────────────────────────── */
type AnswerState = "idle" | "correct" | "wrong";

interface QuizQuestion {
    vocab: VocabWord;
    options: string[];       // 4 meanings, shuffled
    correctIndex: number;    // index of correct answer in options
}

/* ─── Utilities ─────────────────────────────────────────── */
function shuffle<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5);
}

function buildQuestions(pool: VocabWord[]): QuizQuestion[] {
    return shuffle(pool).map((vocab) => {
        const distractors = pool
            .filter((v) => v.id !== vocab.id)
            .map((v) => v.meaning);
        const picked = shuffle(distractors).slice(0, 3);
        const options = shuffle([vocab.meaning, ...picked]);
        return {
            vocab,
            options,
            correctIndex: options.indexOf(vocab.meaning),
        };
    });
}

/* ─── Icon components ────────────────────────────────────── */
const CheckIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const CrossIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const TrophyIcon = () => (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4a2 2 0 0 1-2-2V5h4" />
        <path d="M18 9h2a2 2 0 0 0 2-2V5h-4" />
        <path d="M6 9a6 6 0 0 0 12 0V3H6v6z" />
        <path d="M12 15v3" />
        <path d="M8 21h8" />
        <path d="M12 18a3 3 0 0 0 3-3H9a3 3 0 0 0 3 3z" />
    </svg>
);

/* ─── Result screen ──────────────────────────────────────── */
interface ResultScreenProps {
    score: number;
    total: number;
    onRestart: () => void;
}

const ResultScreen = ({ score, total, onRestart }: ResultScreenProps) => {
    const percent = Math.round((score / total) * 100);
    const getMessage = () => {
        if (percent === 100) return { emoji: "🏆", text: "Xuất sắc! Bạn trả lời đúng tất cả!" };
        if (percent >= 70) return { emoji: "🎉", text: "Rất tốt! Tiếp tục luyện tập nhé!" };
        if (percent >= 40) return { emoji: "📚", text: "Cố lên! Ôn thêm để cải thiện nhé!" };
        return { emoji: "💪", text: "Đừng nản! Hãy thử lại từ đầu!" };
    };
    const { emoji, text } = getMessage();

    return (
        <div className={styles.resultCard}>
            <div className={styles.resultTrophy}>
                <TrophyIcon />
            </div>
            <p className={styles.resultEmoji}>{emoji}</p>
            <h2 className={styles.resultTitle}>Kết quả bài kiểm tra</h2>

            <div className={styles.scoreCircle}>
                <span className={styles.scoreNumber}>{score}</span>
                <span className={styles.scoreTotal}>/{total}</span>
            </div>

            {/* Score ring */}
            <div className={styles.scoreRingWrap}>
                <svg viewBox="0 0 120 120" className={styles.scoreRingSvg}>
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#e8e8f0" strokeWidth="10" />
                    <circle
                        cx="60" cy="60" r="50" fill="none"
                        stroke="url(#ringGrad)" strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 50}`}
                        strokeDashoffset={`${2 * Math.PI * 50 * (1 - percent / 100)}`}
                        transform="rotate(-90 60 60)"
                        style={{ transition: "stroke-dashoffset 1s ease" }}
                    />
                    <defs>
                        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#4255ff" />
                            <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                    </defs>
                    <text x="60" y="55" textAnchor="middle" fill="#1a1a2e"
                        fontSize="22" fontWeight="800" fontFamily="Inter,sans-serif">
                        {percent}%
                    </text>
                    <text x="60" y="72" textAnchor="middle" fill="#b0b0c8"
                        fontSize="10" fontFamily="Inter,sans-serif">
                        độ chính xác
                    </text>
                </svg>
            </div>

            <p className={styles.resultMessage}>{text}</p>

            <button className={styles.btnPrimary} onClick={onRestart}>
                🔁 Làm lại bài kiểm tra
            </button>
        </div>
    );
};

/* ─── Main Page ──────────────────────────────────────────── */
const QuizPage = () => {
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [answerState, setAnswerState] = useState<AnswerState>("idle");
    const [score, setScore] = useState(0);
    const [finished, setFinished] = useState(false);

    const initQuiz = useCallback(() => {
        setQuestions(buildQuestions(VOCAB_POOL));
        setCurrentIndex(0);
        setSelectedIndex(null);
        setAnswerState("idle");
        setScore(0);
        setFinished(false);
    }, []);

    useEffect(() => {
        initQuiz();
    }, [initQuiz]);

    const currentQuestion = questions[currentIndex];
    const isAnswered = answerState !== "idle";
    const progress = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0;

    const handleSelect = (optionIndex: number) => {
        if (isAnswered || !currentQuestion) return;

        setSelectedIndex(optionIndex);
        if (optionIndex === currentQuestion.correctIndex) {
            setAnswerState("correct");
            setScore((s) => s + 1);
        } else {
            setAnswerState("wrong");
        }
    };

    const handleNext = () => {
        if (currentIndex + 1 >= questions.length) {
            setFinished(true);
        } else {
            setCurrentIndex((i) => i + 1);
            setSelectedIndex(null);
            setAnswerState("idle");
        }
    };

    // Keyboard: 1-4 to select, Enter to go next
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (finished) return;
            if (!isAnswered) {
                const map: Record<string, number> = { "1": 0, "2": 1, "3": 2, "4": 3 };
                if (map[e.key] !== undefined) handleSelect(map[e.key]);
            } else if (e.code === "Enter" || e.code === "Space") {
                e.preventDefault();
                handleNext();
            }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [isAnswered, finished, currentQuestion]);

    const getOptionClass = (i: number): string => {
        if (!isAnswered) {
            return selectedIndex === i ? `${styles.option} ${styles.optionSelected}` : styles.option;
        }
        if (i === currentQuestion.correctIndex) return `${styles.option} ${styles.optionCorrect}`;
        if (i === selectedIndex && i !== currentQuestion.correctIndex) return `${styles.option} ${styles.optionWrong}`;
        return `${styles.option} ${styles.optionDim}`;
    };

    if (finished) {
        return (
            <main className={styles.page}>
                <ResultScreen score={score} total={questions.length} onRestart={initQuiz} />
            </main>
        );
    }

    if (questions.length === 0 || !currentQuestion) return null;

    return (
        <main className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerMeta}>
                    <span className={styles.sectionLabel}>✏️ Kiểm tra</span>
                    <span className={styles.questionCounter}>
                        Câu {currentIndex + 1} / {questions.length}
                    </span>
                </div>

                {/* Score badge */}
                <div className={styles.scoreBadge}>
                    <span className={styles.scoreBadgeCorrect}>✓ {score}</span>
                    <span className={styles.scoreBadgeWrong}>✗ {currentIndex - score}</span>
                </div>
            </div>

            {/* Progress bar */}
            <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>

            {/* Question card */}
            <div className={styles.questionCard}>
                <p className={styles.questionLabel}>Từ nào có nghĩa sau đây?</p>
                <h2 className={styles.questionWord}>{currentQuestion.vocab.word}</h2>
            </div>

            {/* Options */}
            <div className={styles.options}>
                {currentQuestion.options.map((option, i) => (
                    <button
                        key={i}
                        className={getOptionClass(i)}
                        onClick={() => handleSelect(i)}
                        disabled={isAnswered}
                    >
                        <span className={styles.optionLabel}>{OPTION_LABELS[i]}</span>
                        <span className={styles.optionText}>{option}</span>
                        {isAnswered && i === currentQuestion.correctIndex && (
                            <span className={styles.optionIcon}><CheckIcon /></span>
                        )}
                        {isAnswered && i === selectedIndex && i !== currentQuestion.correctIndex && (
                            <span className={styles.optionIcon}><CrossIcon /></span>
                        )}
                    </button>
                ))}
            </div>

            {/* Feedback + Next button */}
            {isAnswered && (
                <div className={`${styles.feedback} ${answerState === "correct" ? styles.feedbackCorrect : styles.feedbackWrong}`}>
                    <div className={styles.feedbackContent}>
                        <span className={styles.feedbackIcon}>
                            {answerState === "correct" ? "🎉" : "😅"}
                        </span>
                        <div>
                            <p className={styles.feedbackTitle}>
                                {answerState === "correct" ? "Chính xác!" : "Chưa đúng rồi!"}
                            </p>
                            {answerState === "wrong" && (
                                <p className={styles.feedbackSub}>
                                    Đáp án đúng: <strong>{currentQuestion.options[currentQuestion.correctIndex]}</strong>
                                </p>
                            )}
                        </div>
                    </div>
                    <button className={styles.nextBtn} onClick={handleNext}>
                        {currentIndex + 1 >= questions.length ? "Xem kết quả →" : "Tiếp theo →"}
                    </button>
                </div>
            )}

            {/* Keyboard hint */}
            {!isAnswered && (
                <p className={styles.keyboardHint}>Nhấn 1–4 để chọn · Enter để tiếp</p>
            )}
        </main>
    );
};

export default QuizPage;