import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Flashcard from "../features/vocabs/components/Flashcard";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useVocabLists, useVocabWords } from "../features/vocabs/hooks/useVocabs";
import styles from "./HomePage.module.css";

/* ─── List selector chip ─────────────────────────────────── */
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

/* ─── Main Page ──────────────────────────────────────────── */
const HomePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    /* ── Fetch lists ── */
    const { lists, loading: listsLoading } = useVocabLists(user?.uid);

    /* ── Selected list ── */
    const [selectedListId, setSelectedListId] = useState<string | null>(null);

    // Auto-select the first list once loaded
    useEffect(() => {
        if (lists.length > 0 && !selectedListId) {
            setSelectedListId(lists[0].id);
        }
    }, [lists, selectedListId]);

    /* ── Fetch words for selected list ── */
    const { words, loading: wordsLoading } = useVocabWords(user?.uid, selectedListId ?? undefined);

    /* ── Flashcard state ── */
    const [current, setCurrent] = useState(0);
    const [completed, setCompleted] = useState(false);

    // Reset card position when list changes
    useEffect(() => {
        setCurrent(0);
        setCompleted(false);
    }, [selectedListId]);

    const handleNext = () => {
        if (current + 1 >= words.length) setCompleted(true);
        else setCurrent((c) => c + 1);
    };

    const handlePrev = () => {
        if (completed) setCompleted(false);
        else setCurrent((c) => Math.max(0, c - 1));
    };

    const handleRestart = () => {
        setCurrent(0);
        setCompleted(false);
    };

    const getDotClass = (i: number) => {
        if (i === current) return `${styles.dot} ${styles.dotActive}`;
        if (i < current)  return `${styles.dot} ${styles.dotPassed}`;
        return `${styles.dot} ${styles.dotUpcoming}`;
    };

    const selectedList = lists.find((l) => l.id === selectedListId);

    /* ── Render ── */
    return (
        <main className={styles.page}>

            {/* ── No lists empty state ── */}
            {!listsLoading && lists.length === 0 && (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📚</div>
                    <h1 className={styles.emptyTitle}>Chưa có bộ từ vựng nào</h1>
                    <p className={styles.emptyText}>
                        Tạo bộ từ vựng đầu tiên của bạn để bắt đầu học!
                    </p>
                    <button
                        className={styles.btnPrimary}
                        onClick={() => navigate("/vocabs")}
                    >
                        📝 Tạo bộ từ vựng
                    </button>
                </div>
            )}

            {/* ── Loading lists ── */}
            {listsLoading && (
                <div className={styles.centerState}>
                    <div className={styles.spinner} />
                    <p>Đang tải...</p>
                </div>
            )}

            {/* ── Main content ── */}
            {!listsLoading && lists.length > 0 && (
                <>
                    {/* Header */}
                    <div className={styles.header}>
                        <div className={styles.headerTop}>
                            <div>
                                <p className={styles.sectionLabel}>📚 Học từ vựng</p>
                                <h1 className={styles.title}>
                                    {selectedList?.name ?? "Chọn bộ từ"}
                                </h1>
                            </div>
                            <div className={styles.cardCount}>
                                <span>🃏</span>
                                {wordsLoading ? "..." : words.length} thẻ
                            </div>
                        </div>

                        {/* List selector */}
                        <div className={styles.chipRow}>
                            {lists.map((l) => (
                                <ListChip
                                    key={l.id}
                                    name={l.name}
                                    count={l.wordCount ?? 0}
                                    active={l.id === selectedListId}
                                    onClick={() => setSelectedListId(l.id)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Loading words */}
                    {wordsLoading && (
                        <div className={styles.centerState}>
                            <div className={styles.spinner} />
                        </div>
                    )}

                    {/* No words in list */}
                    {!wordsLoading && words.length === 0 && (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>✏️</div>
                            <h2 className={styles.emptyTitle}>Bộ từ này chưa có từ nào</h2>
                            <p className={styles.emptyText}>Thêm từ vựng vào bộ từ để bắt đầu học.</p>
                            <button
                                className={styles.btnPrimary}
                                onClick={() => navigate(`/vocab/${selectedListId}`)}
                            >
                                + Thêm từ vựng
                            </button>
                        </div>
                    )}

                    {/* Flashcard area */}
                    {!wordsLoading && words.length > 0 && (
                        <>
                            {completed ? (
                                <div className={styles.completion}>
                                    <div className={styles.completionEmoji}>🎉</div>
                                    <h2 className={styles.completionTitle}>Bạn đã hoàn thành!</h2>
                                    <p className={styles.completionText}>
                                        Bạn đã xem qua tất cả{" "}
                                        <strong className={styles.completionHighlight}>
                                            {words.length} thẻ
                                        </strong>.
                                        <br />Hãy tiếp tục luyện tập để nhớ lâu hơn!
                                    </p>
                                    <div className={styles.completionActions}>
                                        <button className={styles.btnPrimary} onClick={handleRestart}>
                                            🔁 Học lại từ đầu
                                        </button>
                                        <button className={styles.btnOutline} onClick={handlePrev}>
                                            ← Quay lại thẻ cuối
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <Flashcard
                                    data={words[current]}
                                    current={current + 1}
                                    total={words.length}
                                    onNext={handleNext}
                                    onPrev={handlePrev}
                                />
                            )}

                            {/* Dot indicators */}
                            {!completed && (
                                <div className={styles.dots}>
                                    {words.map((_, i) => (
                                        <button
                                            key={i}
                                            className={getDotClass(i)}
                                            onClick={() => { setCurrent(i); setCompleted(false); }}
                                            aria-label={`Đi đến thẻ ${i + 1}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </main>
    );
};

export default HomePage;