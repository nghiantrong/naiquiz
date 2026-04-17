import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Flashcard from "../features/vocabs/components/Flashcard";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useVocabLists, useVocabWords } from "../features/vocabs/hooks/useVocabs";
import type { VocabWord } from "../features/vocabs/type";
import {
    saveFlashcardProgress,
    loadFlashcardProgress,
    deleteFlashcardProgress,
    type StudyProgress,
} from "../features/flashcard/services/flashcardService";
import styles from "./HomePage.module.css";

/* ─── List chip ──────────────────────────────────────────── */
const ListChip = ({
    name, count, active, onClick,
}: { name: string; count: number; active: boolean; onClick: () => void }) => (
    <button
        className={`${styles.chip} ${active ? styles.chipActive : ""}`}
        onClick={onClick}
    >
        <span className={styles.chipName}>{name}</span>
        <span className={styles.chipCount}>{count}</span>
    </button>
);

/* ─── Completion screen ──────────────────────────────────── */
const CompletionScreen = ({
    totalWords, knownCount, notKnownCount, round,
    onRestart, onRetryNotKnown, onSelectOther,
}: {
    totalWords: number; knownCount: number; notKnownCount: number; round: number;
    onRestart: () => void; onRetryNotKnown: () => void; onSelectOther: () => void;
}) => {
    const isAllKnown = notKnownCount === 0;
    const percent = Math.round((knownCount / (knownCount + notKnownCount || 1)) * 100);

    return (
        <div className={styles.completion}>
            <div className={styles.completionEmoji}>{isAllKnown ? "🏆" : "🎯"}</div>
            <h2 className={styles.completionTitle}>
                {isAllKnown ? "Tuyệt vời! Bạn nhớ hết rồi!" : `Vòng ${round} hoàn thành!`}
            </h2>

            <div className={styles.completionStats}>
                <div className={`${styles.statItem} ${styles.statKnow}`}>
                    <span className={styles.statNum}>{knownCount}</span>
                    <span className={styles.statLabel}>Đã nhớ ✓</span>
                </div>
                {notKnownCount > 0 && (
                    <div className={`${styles.statItem} ${styles.statSkip}`}>
                        <span className={styles.statNum}>{notKnownCount}</span>
                        <span className={styles.statLabel}>Ôn lại ✗</span>
                    </div>
                )}
                <div className={`${styles.statItem} ${styles.statPercent}`}>
                    <span className={styles.statNum}>{percent}%</span>
                    <span className={styles.statLabel}>Độ chính xác</span>
                </div>
            </div>

            <p className={styles.completionText}>
                {isAllKnown
                    ? `Bạn đã nhớ tất cả ${totalWords} từ vựng! Tiếp tục duy trì nhé.`
                    : `Còn ${notKnownCount} từ cần ôn lại. Tiếp tục luyện tập nhé!`}
            </p>

            <div className={styles.completionActions}>
                {!isAllKnown && (
                    <button className={styles.btnPrimary} onClick={onRetryNotKnown}>
                        🔁 Ôn lại {notKnownCount} từ chưa nhớ
                    </button>
                )}
                <button className={isAllKnown ? styles.btnPrimary : styles.btnOutline} onClick={onRestart}>
                    ↺ Học lại từ đầu ({totalWords} từ)
                </button>
                <button className={styles.btnGhost} onClick={onSelectOther}>
                    Chọn bộ từ khác
                </button>
            </div>
        </div>
    );
};

/* ─── Main Page ──────────────────────────────────────────── */
const HomePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const { lists, loading: listsLoading } = useVocabLists(user?.uid);
    const [selectedListId, setSelectedListId] = useState<string | null>(null);

    const { words, loading: wordsLoading } = useVocabWords(user?.uid, selectedListId ?? undefined);

    /* ── Progress from Firestore ── */
    const [savedProgress, setSavedProgress] = useState<StudyProgress | null>(null);
    const [progressLoading, setProgressLoading] = useState(false);

    /* ── Study state ── */
    const [roundWords, setRoundWords] = useState<VocabWord[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [notKnownIds, setNotKnownIds] = useState<Set<string>>(new Set());
    const [knownCount, setKnownCount] = useState(0);
    const [round, setRound] = useState(1);
    const [phase, setPhase] = useState<"select" | "study" | "complete">("select");

    /* ── Debounce timer for Firestore saves ── */
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* ── Load progress when a list is selected ── */
    const handleSelectList = useCallback((listId: string) => {
        setSelectedListId(listId);
        setPhase("select");
        setRoundWords([]);
        setCurrentIndex(0);
        setNotKnownIds(new Set());
        setKnownCount(0);
        setRound(1);
        setSavedProgress(null);

        if (!user?.uid) return;
        setProgressLoading(true);
        loadFlashcardProgress(user.uid, listId)
            .then(setSavedProgress)
            .catch(console.error)
            .finally(() => setProgressLoading(false));
    }, [user?.uid]);

    /* ── Debounced Firestore save ── */
    const scheduleSave = useCallback((progress: StudyProgress) => {
        if (!user?.uid || !selectedListId) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            saveFlashcardProgress(user.uid!, progress).catch(console.error);
        }, 600);
    }, [user?.uid, selectedListId]);

    /* ── Clear Firestore progress (end of session) ── */
    const clearProgress = useCallback(() => {
        if (!user?.uid || !selectedListId) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        deleteFlashcardProgress(user.uid, selectedListId).catch(console.error);
        setSavedProgress(null);
    }, [user?.uid, selectedListId]);

    const selectedList = lists.find(l => l.id === selectedListId);

    /* ── Start / Resume study ── */
    const startStudy = useCallback((pool: VocabWord[], resume?: StudyProgress) => {
        if (resume) {
            const resumeWords = pool.filter(w => resume.roundWords.includes(w.id));
            const notKnown = new Set(resume.notKnownIds);
            setRoundWords(resumeWords);
            setCurrentIndex(resume.currentIndex);
            setNotKnownIds(notKnown);
            // known so far = answered before currentIndex minus those in notKnown
            setKnownCount(Math.max(0, resume.currentIndex - notKnown.size));
            setRound(resume.round);
        } else {
            setRoundWords([...pool]);
            setCurrentIndex(0);
            setNotKnownIds(new Set());
            setKnownCount(0);
            setRound(1);
        }
        setPhase("study");
    }, []);

    /* ── Swipe right = "know" ── */
    const handleKnow = useCallback(() => {
        setKnownCount(c => c + 1);
        const nextIndex = currentIndex + 1;

        if (nextIndex >= roundWords.length) {
            // ── End of round ──
            setPhase("complete");
            if (notKnownIds.size === 0) {
                // ất cả đã nhớ → xóa tiến trình
                clearProgress();
            } else {
                // Vẫn còn từ chưa nhớ → lưu tiến trình retry cho lần sau
                if (user?.uid && selectedListId) {
                    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
                    saveFlashcardProgress(user.uid, {
                        listId: selectedListId,
                        listName: selectedList?.name ?? "",
                        currentIndex: 0,
                        notKnownIds: [],
                        roundWords: [...notKnownIds],  // vòng tiếp theo ôn lại những từ này
                        round: round + 1,
                    }).catch(console.error);
                }
            }
        } else {
            setCurrentIndex(nextIndex);
            scheduleSave({
                listId: selectedListId!,
                listName: selectedList?.name ?? "",
                currentIndex: nextIndex,
                notKnownIds: [...notKnownIds],
                roundWords: roundWords.map(w => w.id),
                round,
            });
        }
    }, [currentIndex, roundWords, notKnownIds, round, selectedListId, selectedList, clearProgress, scheduleSave, user?.uid]);

    /* ── Swipe left = "skip/not known" ── */
    const handleSkip = useCallback(() => {
        const newNotKnown = new Set([...notKnownIds, roundWords[currentIndex].id]);
        setNotKnownIds(newNotKnown);
        const nextIndex = currentIndex + 1;

        if (nextIndex >= roundWords.length) {
            // ── End of round, always has not-known words (at least the current one) ──
            setPhase("complete");
            if (user?.uid && selectedListId) {
                if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
                saveFlashcardProgress(user.uid, {
                    listId: selectedListId,
                    listName: selectedList?.name ?? "",
                    currentIndex: 0,
                    notKnownIds: [],
                    roundWords: [...newNotKnown],  // vòng tiếp theo ôn lại những từ này
                    round: round + 1,
                }).catch(console.error);
            }
        } else {
            setCurrentIndex(nextIndex);
            scheduleSave({
                listId: selectedListId!,
                listName: selectedList?.name ?? "",
                currentIndex: nextIndex,
                notKnownIds: [...newNotKnown],
                roundWords: roundWords.map(w => w.id),
                round,
            });
        }
    }, [notKnownIds, currentIndex, roundWords, round, selectedListId, selectedList, scheduleSave, user?.uid]);

    /* ── Restart from scratch ── */
    const handleRestart = useCallback(() => {
        clearProgress();   // xóa tiến trình cũ trước khi bắt đầu lại
        startStudy(words);
    }, [words, startStudy, clearProgress]);

    /* ── Retry not-known words ── */
    const handleRetryNotKnown = useCallback(() => {
        const notKnownWords = words.filter(w => notKnownIds.has(w.id));
        const newRound = round + 1;
        setNotKnownIds(new Set());
        setKnownCount(0);
        setRound(newRound);
        setRoundWords(notKnownWords);
        setCurrentIndex(0);
        setPhase("study");
    }, [words, notKnownIds, round]);

    const handleSelectOther = () => {
        setPhase("select");
        setSelectedListId(null);
    };

    const currentWord = roundWords[currentIndex];

    /* ── Render ── */
    return (
        <main className={styles.page}>

            {/* Loading lists */}
            {listsLoading && (
                <div className={styles.centerState}>
                    <div className={styles.spinner} />
                    <p>Đang tải...</p>
                </div>
            )}

            {/* No lists */}
            {!listsLoading && lists.length === 0 && (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📚</div>
                    <h1 className={styles.emptyTitle}>Chưa có bộ từ vựng nào</h1>
                    <p className={styles.emptyText}>Tạo bộ từ vựng đầu tiên để bắt đầu học!</p>
                    <button className={styles.btnPrimary} onClick={() => navigate("/vocabs")}>
                        📝 Tạo bộ từ vựng
                    </button>
                </div>
            )}

            {!listsLoading && lists.length > 0 && (
                <>
                    {/* Header */}
                    <div className={styles.header}>
                        <div className={styles.headerTop}>
                            <div>
                                <p className={styles.sectionLabel}>📚 Học từ vựng</p>
                                <h1 className={styles.title}>
                                    {selectedList?.name ?? "Chọn bộ từ để học"}
                                </h1>
                            </div>
                            {selectedList && phase === "study" && (
                                <div className={styles.roundBadge}>
                                    Vòng {round} · {roundWords.length} thẻ
                                </div>
                            )}
                        </div>

                        {/* List chips */}
                        <div className={styles.chipRow}>
                            {lists.map(l => (
                                <ListChip
                                    key={l.id}
                                    name={l.name}
                                    count={l.wordCount ?? 0}
                                    active={l.id === selectedListId}
                                    onClick={() => handleSelectList(l.id)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* No list selected */}
                    {!selectedListId && (
                        <div className={styles.selectPrompt}>
                            <div className={styles.selectPromptIcon}>👆</div>
                            <p className={styles.selectPromptText}>Chọn một bộ từ ở trên để bắt đầu học</p>
                        </div>
                    )}

                    {/* Loading words or progress */}
                    {selectedListId && (wordsLoading || progressLoading) && (
                        <div className={styles.centerState}>
                            <div className={styles.spinner} />
                        </div>
                    )}

                    {/* No words in list */}
                    {selectedListId && !wordsLoading && !progressLoading && words.length === 0 && (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>✏️</div>
                            <h2 className={styles.emptyTitle}>Bộ từ này chưa có từ nào</h2>
                            <p className={styles.emptyText}>Thêm từ vựng để bắt đầu học.</p>
                            <button className={styles.btnPrimary} onClick={() => navigate(`/vocab/${selectedListId}`)}>
                                + Thêm từ vựng
                            </button>
                        </div>
                    )}

                    {/* ── START SCREEN ── */}
                    {selectedListId && !wordsLoading && !progressLoading && words.length > 0 && phase === "select" && (
                        <div className={styles.startScreen}>
                            <div className={styles.startIcon}>🃏</div>
                            <h2 className={styles.startTitle}>{selectedList?.name}</h2>
                            <p className={styles.startSub}>{words.length} thẻ ghi nhớ</p>

                            {/* Resume card — shown if a saved session exists in Firestore */}
                            {savedProgress && (
                                <div className={styles.resumeCard}>
                                    <div className={styles.resumeInfo}>
                                        <span className={styles.resumeIcon}>🔖</span>
                                        <div>
                                            <p className={styles.resumeTitle}>Tiếp tục phiên học?</p>
                                            <p className={styles.resumeSub}>
                                                Vòng {savedProgress.round} · Thẻ {savedProgress.currentIndex + 1}/{savedProgress.roundWords.length}
                                                {savedProgress.notKnownIds.length > 0 && ` · ${savedProgress.notKnownIds.length} chưa nhớ`}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        className={styles.btnPrimary}
                                        onClick={() => startStudy(words, savedProgress)}
                                    >
                                        ▶ Tiếp tục
                                    </button>
                                </div>
                            )}

                            <div className={styles.startActions}>
                                <button
                                    className={savedProgress ? styles.btnOutline : styles.btnPrimary}
                                    onClick={() => {
                                        clearProgress();
                                        startStudy(words);
                                    }}
                                >
                                    {savedProgress ? "↺ Bắt đầu lại từ đầu" : "🚀 Bắt đầu học"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STUDY PHASE ── */}
                    {selectedListId && !wordsLoading && phase === "study" && currentWord && (
                        <>
                            {/* Known/skip counter */}
                            {(knownCount > 0 || notKnownIds.size > 0) && (
                                <div className={styles.studyMeta}>
                                    {knownCount > 0 && <span className={styles.metaKnown}>✓ {knownCount} nhớ</span>}
                                    {notKnownIds.size > 0 && <span className={styles.metaSkip}>✗ {notKnownIds.size} ôn lại</span>}
                                </div>
                            )}

                            <Flashcard
                                data={currentWord}
                                current={currentIndex + 1}
                                total={roundWords.length}
                                swipeMode
                                onKnow={handleKnow}
                                onSkip={handleSkip}
                            />

                            {/* Dot indicators (max 30 to avoid clutter) */}
                            {roundWords.length <= 30 && (
                                <div className={styles.dots}>
                                    {roundWords.map((w, i) => {
                                        let cls = styles.dotUpcoming;
                                        if (i === currentIndex) cls = styles.dotActive;
                                        else if (i < currentIndex) {
                                            cls = notKnownIds.has(w.id) ? styles.dotSkip : styles.dotKnown;
                                        }
                                        return <span key={w.id} className={`${styles.dot} ${cls}`} title={w.word} />;
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    {/* ── COMPLETE PHASE ── */}
                    {selectedListId && !wordsLoading && phase === "complete" && (
                        <CompletionScreen
                            totalWords={words.length}
                            knownCount={knownCount}
                            notKnownCount={notKnownIds.size}
                            round={round}
                            onRestart={handleRestart}
                            onRetryNotKnown={handleRetryNotKnown}
                            onSelectOther={handleSelectOther}
                        />
                    )}
                </>
            )}
        </main>
    );
};

export default HomePage;