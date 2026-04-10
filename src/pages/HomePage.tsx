import { useState } from "react";
import Flashcard from "../features/vocabs/components/Flashcard";
import type { VocabWord } from "../features/vocabs/type";
import styles from "./HomePage.module.css";

const MOCK_VOCABS: VocabWord[] = [
    { id: "1", word: "Ephemeral",   meaning: "Tồn tại trong thời gian ngắn; phù du" },
    { id: "2", word: "Benevolent",  meaning: "Nhân từ; tốt bụng; hào phóng" },
    { id: "3", word: "Serendipity", meaning: "May mắn tình cờ; sự tình cờ thú vị" },
    { id: "4", word: "Melancholy",  meaning: "Buồn bã; u sầu sâu sắc" },
    { id: "5", word: "Eloquent",    meaning: "Hùng hồn; diễn đạt trôi chảy và thuyết phục" },
    { id: "6", word: "Ambiguous",   meaning: "Mơ hồ; có thể hiểu theo nhiều nghĩa" },
    { id: "7", word: "Resilient",   meaning: "Kiên cường; có khả năng phục hồi nhanh" },
];

const TABS = ["Thẻ ghi nhớ", "Học", "Viết", "Kiểm tra"] as const;

const HomePage = () => {
    const [current, setCurrent] = useState(0);
    const [completed, setCompleted] = useState(false);

    const handleNext = () => {
        if (current + 1 >= MOCK_VOCABS.length) {
            setCompleted(true);
        } else {
            setCurrent((c) => c + 1);
        }
    };

    const handlePrev = () => {
        if (completed) {
            setCompleted(false);
        } else {
            setCurrent((c) => Math.max(0, c - 1));
        }
    };

    const handleRestart = () => {
        setCurrent(0);
        setCompleted(false);
    };

    const getDotClass = (index: number) => {
        if (index === current) return `${styles.dot} ${styles.dotActive}`;
        if (index < current)  return `${styles.dot} ${styles.dotPassed}`;
        return `${styles.dot} ${styles.dotUpcoming}`;
    };

    return (
        <main className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <div>
                        <p className={styles.sectionLabel}>📚 Học từ vựng</p>
                        <h1 className={styles.title}>Từ vựng tiếng Anh nâng cao</h1>
                    </div>
                    <div className={styles.cardCount}>
                        <span>🃏</span>
                        {MOCK_VOCABS.length} thẻ
                    </div>
                </div>

                {/* Mode tabs */}
                <div className={styles.tabs}>
                    {TABS.map((tab, i) => (
                        <button
                            key={tab}
                            className={i === 0 ? `${styles.tab} ${styles.activeTab}` : styles.tab}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Card area */}
            {completed ? (
                <div className={styles.completion}>
                    <div className={styles.completionEmoji}>🎉</div>

                    <h2 className={styles.completionTitle}>Bạn đã hoàn thành!</h2>

                    <p className={styles.completionText}>
                        Bạn đã xem qua tất cả{" "}
                        <strong className={styles.completionHighlight}>
                            {MOCK_VOCABS.length} thẻ
                        </strong>
                        .<br />
                        Hãy tiếp tục luyện tập để nhớ lâu hơn!
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
                    data={MOCK_VOCABS[current]}
                    current={current + 1}
                    total={MOCK_VOCABS.length}
                    onNext={handleNext}
                    onPrev={handlePrev}
                />
            )}

            {/* Dot indicators */}
            {!completed && (
                <div className={styles.dots}>
                    {MOCK_VOCABS.map((_, i) => (
                        <button
                            key={i}
                            className={getDotClass(i)}
                            onClick={() => setCurrent(i)}
                            aria-label={`Đi đến thẻ ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </main>
    );
};

export default HomePage;