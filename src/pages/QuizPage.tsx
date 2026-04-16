import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { VocabWord } from "../features/vocabs/type";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useVocabLists, useVocabWords } from "../features/vocabs/hooks/useVocabs";
import { generateDistractors, isAiAvailable, type WordWithDistractors } from "../utils/aiQuizDistractors";
import { saveDraft, loadDraft, deleteDraft, saveHistory } from "../features/quiz/services/quizService";
import { useQuizHistory } from "../features/quiz/hooks/useQuizHistory";
import type { QuizDraft } from "../features/quiz/types";
import QuizHistoryPanel from "../features/quiz/components/QuizHistoryPanel";
import styles from "./QuizPage.module.css";

const OPTION_LABELS = ["A", "B", "C", "D"] as const;
const MIN_WORDS = 2; // minimum words needed to run quiz

/* ─── Types ─────────────────────────────────────────────── */
type AnswerState = "idle" | "correct" | "wrong";
type PageState = "setup" | "generating" | "quiz" | "result";

interface QuizQuestion {
    vocab: VocabWord;
    options: string[];
    correctIndex: number;
}

/* ─── Utilities ─────────────────────────────────────────── */
function shuffle<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5);
}

function buildQuestions(withDistractors: WordWithDistractors[]): QuizQuestion[] {
    return shuffle(withDistractors).map(({ vocab, distractors }) => {
        const options = shuffle([vocab.meaning, ...distractors]);
        return { vocab, options, correctIndex: options.indexOf(vocab.meaning) };
    });
}

function deserializeQuestions(draft: QuizDraft): QuizQuestion[] {
    return draft.questions.map((q) => ({
        vocab: { id: "", word: q.word, meaning: q.meaning },
        options: q.options,
        correctIndex: q.correctIndex,
    }));
}

/* ─── Icons ─────────────────────────────────────────────── */
const CheckIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const CrossIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const TrophyIcon = () => (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4a2 2 0 0 1-2-2V5h4" /><path d="M18 9h2a2 2 0 0 0 2-2V5h-4" />
        <path d="M6 9a6 6 0 0 0 12 0V3H6v6z" /><path d="M12 15v3" /><path d="M8 21h8" />
        <path d="M12 18a3 3 0 0 0 3-3H9a3 3 0 0 0 3 3z" />
    </svg>
);

const BookmarkIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
);

/* ─── List chip ─────────────────────────────────────────── */
const ListChip = ({ name, count, active, onClick }: {
    name: string; count: number; active: boolean; onClick: () => void;
}) => (
    <button className={`${styles.chip} ${active ? styles.chipActive : ""}`} onClick={onClick}>
        <span className={styles.chipName}>{name}</span>
        <span className={styles.chipCount}>{count}</span>
    </button>
);

/* ─── Resume Prompt ─────────────────────────────────────── */
const ResumePrompt = ({ draft, onResume, onRestart }: {
    draft: QuizDraft; onResume: () => void; onRestart: () => void;
}) => {
    const answered = draft.currentIndex;
    const total = draft.total;
    const percent = total > 0 ? Math.round((draft.score / answered || 0) * 100) : 0;

    return (
        <div className={styles.resumeCard}>
            <div className={styles.resumeIcon}><BookmarkIcon /></div>
            <div className={styles.resumeInfo}>
                <p className={styles.resumeTitle}>Tiếp tục bài chưa hoàn thành?</p>
                <p className={styles.resumeSub}>
                    Câu {answered + 1}/{total} · Đúng: {draft.score}
                    {answered > 0 && ` · ${percent}%`}
                </p>
            </div>
            <div className={styles.resumeActions}>
                <button className={styles.btnPrimarySmall} onClick={onResume}>
                    ▶ Tiếp tục
                </button>
                <button className={styles.btnOutlineSmall} onClick={onRestart}>
                    🔁 Làm lại
                </button>
            </div>
        </div>
    );
};

/* ─── Result screen ─────────────────────────────────────── */
const ResultScreen = ({ score, total, onRestart, onChangeList }: {
    score: number; total: number; onRestart: () => void; onChangeList: () => void;
}) => {
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
            <div className={styles.resultTrophy}><TrophyIcon /></div>
            <p className={styles.resultEmoji}>{emoji}</p>
            <h2 className={styles.resultTitle}>Kết quả bài kiểm tra</h2>

            <div className={styles.scoreCircle}>
                <span className={styles.scoreNumber}>{score}</span>
                <span className={styles.scoreTotal}>/{total}</span>
            </div>

            <div className={styles.scoreRingWrap}>
                <svg viewBox="0 0 120 120" className={styles.scoreRingSvg}>
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#e8e8f0" strokeWidth="10" />
                    <circle cx="60" cy="60" r="50" fill="none"
                        stroke="url(#ringGrad)" strokeWidth="10" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 50}`}
                        strokeDashoffset={`${2 * Math.PI * 50 * (1 - percent / 100)}`}
                        transform="rotate(-90 60 60)"
                        style={{ transition: "stroke-dashoffset 1s ease" }}
                    />
                    <defs>
                        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#6b9b6f" />
                            <stop offset="100%" stopColor="#3f6645" />
                        </linearGradient>
                    </defs>
                    <text x="60" y="55" textAnchor="middle" fill="#1a2e1c"
                        fontSize="22" fontWeight="800" fontFamily="Inter,sans-serif">
                        {percent}%
                    </text>
                    <text x="60" y="72" textAnchor="middle" fill="#b0c8b3"
                        fontSize="10" fontFamily="Inter,sans-serif">
                        độ chính xác
                    </text>
                </svg>
            </div>

            <p className={styles.resultMessage}>{text}</p>

            <div className={styles.resultActions}>
                <button className={styles.btnPrimary} onClick={onRestart}>
                    🔁 Làm lại bài kiểm tra
                </button>
                <button className={styles.btnOutline} onClick={onChangeList}>
                    ← Xem lịch sử / Chọn bộ từ khác
                </button>
            </div>
        </div>
    );
};

/* ─── Main Page ─────────────────────────────────────────── */
const QuizPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    /* ── Data ── */
    const { lists, loading: listsLoading } = useVocabLists(user?.uid);
    const [selectedListId, setSelectedListId] = useState<string | null>(null);
    const { words, loading: wordsLoading } = useVocabWords(user?.uid, selectedListId ?? undefined);

    // Auto-select first list
    useEffect(() => {
        if (lists.length > 0 && !selectedListId) setSelectedListId(lists[0].id);
    }, [lists, selectedListId]);

    /* ── Quiz state ── */
    const [pageState, setPageState] = useState<PageState>("setup");
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [answerState, setAnswerState] = useState<AnswerState>("idle");
    const [score, setScore] = useState(0);

    /* ── Draft state ── */
    const [draft, setDraft] = useState<QuizDraft | null>(null);
    const [draftLoading, setDraftLoading] = useState(false);
    const startedAtRef = useRef<number>(0);

    /* ── History ── */
    const { history, loading: historyLoading, refetch: refetchHistory } =
        useQuizHistory(user?.uid, selectedListId);

    const selectedList = lists.find((l) => l.id === selectedListId);
    const currentQuestion = questions[currentIndex];
    const isAnswered = answerState !== "idle";
    const progress = questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;

    /* ── Load draft when list changes ── */
    useEffect(() => {
        if (!user?.uid || !selectedListId) {
            setDraft(null);
            return;
        }
        setDraftLoading(true);
        loadDraft(user.uid, selectedListId)
            .then(setDraft)
            .catch(console.error)
            .finally(() => setDraftLoading(false));
    }, [user?.uid, selectedListId]);

    /* ── Start quiz (fresh) ── */
    const startQuiz = useCallback(async (pool: VocabWord[]) => {
        setPageState("generating");
        startedAtRef.current = Date.now();
        const withDistractors = await generateDistractors(pool);
        const qs = buildQuestions(withDistractors);
        setQuestions(qs);
        setCurrentIndex(0);
        setSelectedIndex(null);
        setAnswerState("idle");
        setScore(0);
        setPageState("quiz");
    }, []);

    const handleStart = () => {
        if (words.length >= MIN_WORDS) {
            // Xóa draft cũ khi bắt đầu fresh
            if (user?.uid && selectedListId && draft) {
                deleteDraft(user.uid, selectedListId).catch(console.error);
                setDraft(null);
            }
            startQuiz(words);
        }
    };

    /* ── Resume quiz từ draft ── */
    const handleResume = () => {
        if (!draft) return;
        const resumed = deserializeQuestions(draft);
        setQuestions(resumed);
        setCurrentIndex(draft.currentIndex);
        setScore(draft.score);
        setSelectedIndex(null);
        setAnswerState("idle");
        startedAtRef.current = Date.now(); // track duration của phiên này
        setDraft(null);
        setPageState("quiz");
    };

    /* ── Restart (xóa draft + bắt đầu lại) ── */
    const handleRestart = () => {
        if (user?.uid && selectedListId) {
            deleteDraft(user.uid, selectedListId).catch(console.error);
        }
        setDraft(null);
        startQuiz(words);
    };

    const handleChangeList = () => {
        setPageState("setup");
        setQuestions([]);
        refetchHistory(); // refresh history khi quay lại setup
    };

    /* ── Answer ── */
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
        if (!currentQuestion) return;
        const nextIndex = currentIndex + 1;

        if (nextIndex >= questions.length) {
            // ── Quiz hoàn thành ──
            setPageState("result");

            if (user?.uid && selectedListId) {
                const duration = Date.now() - startedAtRef.current;
                const finalScore = answerState === "correct" ? score : score;
                const percent = Math.round((finalScore / questions.length) * 100);

                saveHistory(user.uid, {
                    listId: selectedListId,
                    listName: selectedList?.name ?? "",
                    score: finalScore,
                    total: questions.length,
                    percent,
                    duration,
                }).catch(console.error);

                deleteDraft(user.uid, selectedListId).catch(console.error);
            }
        } else {
            // ── Chuyển câu tiếp theo + save draft ──
            setCurrentIndex(nextIndex);
            setSelectedIndex(null);
            setAnswerState("idle");

            if (user?.uid && selectedListId) {
                const currentScore = answerState === "correct" ? score + 1 : score;
                // Note: score state hasn't updated yet for correct answers (setScore is async)
                // We compute currentScore manually based on answerState
                const actualScore = answerState === "correct"
                    ? score  // score was already incremented by setScore(s => s+1) in handleSelect
                    : score;

                // Actually score reflects the value BEFORE the latest setScore(s=>s+1)
                // handleSelect → setScore(s=>s+1) → re-render → nextIndex button click → handleNext
                // At this point, score IS the updated value (since it's a new render)
                const draftPayload: QuizDraft = {
                    listId: selectedListId,
                    listName: selectedList?.name ?? "",
                    score: actualScore,
                    currentIndex: nextIndex,
                    total: questions.length,
                    questions: questions.map((q) => ({
                        word: q.vocab.word,
                        meaning: q.vocab.meaning,
                        options: q.options,
                        correctIndex: q.correctIndex,
                    })),
                    startedAt: startedAtRef.current,
                };
                saveDraft(user.uid, draftPayload).catch(console.error);
            }
        }
    };

    /* ── Keyboard ── */
    useEffect(() => {
        if (pageState !== "quiz") return;
        const handleKey = (e: KeyboardEvent) => {
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
    }, [pageState, isAnswered, currentQuestion, score]);

    const getOptionClass = (i: number): string => {
        if (!isAnswered)
            return selectedIndex === i ? `${styles.option} ${styles.optionSelected}` : styles.option;
        if (i === currentQuestion.correctIndex) return `${styles.option} ${styles.optionCorrect}`;
        if (i === selectedIndex && i !== currentQuestion.correctIndex) return `${styles.option} ${styles.optionWrong}`;
        return `${styles.option} ${styles.optionDim}`;
    };

    /* ══════════════════════════════════════ RENDER ══ */

    /* ── Loading lists ── */
    if (listsLoading) return (
        <main className={styles.page}>
            <div className={styles.centerState}>
                <div className={styles.spinner} />
                <p>Đang tải...</p>
            </div>
        </main>
    );

    /* ── No lists ── */
    if (!listsLoading && lists.length === 0) return (
        <main className={styles.page}>
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📚</div>
                <h1 className={styles.emptyTitle}>Chưa có bộ từ nào</h1>
                <p className={styles.emptyText}>Tạo bộ từ vựng trước để bắt đầu kiểm tra.</p>
                <button className={styles.btnPrimary} onClick={() => navigate("/vocabs")}>
                    📝 Tạo bộ từ vựng
                </button>
            </div>
        </main>
    );

    /* ── Result ── */
    if (pageState === "result") return (
        <main className={styles.page}>
            <ResultScreen
                score={score}
                total={questions.length}
                onRestart={handleRestart}
                onChangeList={handleChangeList}
            />
        </main>
    );

    /* ── AI Generating ── */
    if (pageState === "generating") return (
        <main className={styles.page}>
            <div className={styles.generatingWrap}>
                <div className={styles.generatingRing}>
                    <div className={styles.generatingSpinner} />
                    <span className={styles.generatingEmoji}>🤖</span>
                </div>
                <h2 className={styles.generatingTitle}>AI đang tạo câu hỏi...</h2>
                <p className={styles.generatingHint}>
                    {isAiAvailable()
                        ? "Gemini đang tạo các đáp án nhiễu thông minh cho bộ từ này."
                        : "Đang xây dựng câu hỏi từ bộ từ..."}
                </p>
            </div>
        </main>
    );

    /* ── Setup / List select ── */
    if (pageState === "setup") return (
        <main className={styles.page}>
            <div className={styles.setupWrap}>
                <div className={styles.setupHeader}>
                    <p className={styles.sectionLabel}>✏️ Kiểm tra từ vựng</p>
                    <h1 className={styles.setupTitle}>Chọn bộ từ để kiểm tra</h1>
                    {isAiAvailable() && (
                        <div className={styles.aiTag}>
                            🤖 AI sẽ tạo đáp án nhiễu thông minh
                        </div>
                    )}
                </div>

                <div className={styles.chipRow}>
                    {lists.map((l) => (
                        <ListChip
                            key={l.id}
                            name={l.name}
                            count={l.wordCount ?? 0}
                            active={l.id === selectedListId}
                            onClick={() => { setSelectedListId(l.id); setPageState("setup"); }}
                        />
                    ))}
                </div>

                {/* Resume prompt — hiện khi có draft */}
                {!draftLoading && draft && (
                    <ResumePrompt
                        draft={draft}
                        onResume={handleResume}
                        onRestart={handleRestart}
                    />
                )}
                {draftLoading && (
                    <div className={styles.draftSkeleton} />
                )}

                {/* Selected list info */}
                {selectedList && (
                    <div className={styles.listPreview}>
                        <div className={styles.listPreviewInfo}>
                            <span className={styles.listPreviewName}>{selectedList.name}</span>
                            <span className={styles.listPreviewCount}>
                                {wordsLoading ? "..." : words.length} từ vựng
                            </span>
                        </div>

                        {!wordsLoading && words.length < MIN_WORDS && (
                            <p className={styles.listPreviewWarning}>
                                ⚠️ Cần ít nhất {MIN_WORDS} từ để tạo bài kiểm tra.
                                <button
                                    className={styles.linkBtn}
                                    onClick={() => navigate(`/vocab/${selectedListId}`)}
                                >
                                    Thêm từ →
                                </button>
                            </p>
                        )}
                    </div>
                )}

                {/* History panel */}
                <QuizHistoryPanel history={history} loading={historyLoading} />

                <button
                    className={styles.startBtn}
                    onClick={handleStart}
                    disabled={wordsLoading || words.length < MIN_WORDS}
                >
                    {wordsLoading
                        ? <><span className={styles.spinnerInline} /> Đang tải...</>
                        : `🚀 Bắt đầu kiểm tra${draft ? " mới" : ""} (${words.length} câu)`
                    }
                </button>
            </div>
        </main>
    );

    /* ── Quiz ── */
    if (!currentQuestion) return null;

    return (
        <main className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerMeta}>
                    <span className={styles.sectionLabel}>✏️ {selectedList?.name}</span>
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
                <p className={styles.questionLabel}>Chọn nghĩa đúng của từ:</p>
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

            {/* Feedback */}
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