import { useState, useEffect, useCallback } from "react";
import type { VocabWord } from "../type";
import styles from "./Flashcard.module.css";

interface FlashcardProps {
    data: VocabWord;
    current?: number;
    total?: number;
    onNext?: () => void;
    onPrev?: () => void;
}

const ChevronLeft = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

const ChevronRight = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

const RefreshIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5">
        <polyline points="1 4 1 10 7 10" />
        <path d="M3.51 15a9 9 0 1 0 .49-3.68" />
    </svg>
);

const Flashcard = ({
    data,
    current = 1,
    total = 1,
    onNext,
    onPrev,
}: FlashcardProps) => {
    const [flipped, setFlipped] = useState(false);
    const [animating, setAnimating] = useState(false);

    // Reset flip when card changes
    useEffect(() => {
        setFlipped(false);
    }, [data.id]);

    const handleFlip = useCallback(() => {
        if (animating) return;
        setAnimating(true);
        setFlipped((prev) => !prev);
        setTimeout(() => setAnimating(false), 560);
    }, [animating]);

    // Keyboard shortcuts: Space = flip, ← → = navigate
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                e.preventDefault();
                handleFlip();
            }
            if (e.code === "ArrowRight") onNext?.();
            if (e.code === "ArrowLeft") onPrev?.();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [handleFlip, onNext, onPrev]);

    const progress = (current / total) * 100;
    const cardInnerClass = [styles.cardInner, flipped ? styles.flipped : ""].join(" ");

    return (
        <div className={styles.wrapper}>
            {/* Progress bar */}
            <div className={styles.progressRow}>
                <span className={styles.progressLabel}>{current} / {total}</span>
                <div className={styles.progressTrack}>
                    <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                </div>
            </div>

            {/* Card scene */}
            <div className={styles.scene} onClick={handleFlip}>
                <div className={cardInnerClass}>

                    {/* Front face — Term */}
                    <div className={`${styles.face} ${styles.front}`}>
                        <span className={styles.faceLabel}>Thuật ngữ</span>

                        <button
                            className={styles.starBtn}
                            onClick={(e) => e.stopPropagation()}
                            title="Đánh dấu"
                        >
                            ☆
                        </button>

                        <p className={styles.term}>{data.word}</p>

                        <div className={styles.flipHint}>
                            <RefreshIcon />
                            Nhấn Space để lật
                        </div>
                    </div>

                    {/* Back face — Definition */}
                    <div className={`${styles.face} ${styles.back}`}>
                        <span className={styles.faceLabel}>Định nghĩa</span>
                        <p className={styles.definition}>{data.meaning}</p>
                    </div>
                </div>
            </div>

            {/* Navigation controls */}
            <div className={styles.controls}>
                <button
                    className={styles.navBtn}
                    onClick={onPrev}
                    disabled={current <= 1}
                    title="Thẻ trước (←)"
                >
                    <ChevronLeft />
                </button>

                <button className={styles.flipBtn} onClick={handleFlip}>
                    <RefreshIcon />
                    {flipped ? "Xem mặt trước" : "Lật thẻ"}
                </button>

                <button
                    className={styles.navBtn}
                    onClick={onNext}
                    disabled={current >= total}
                    title="Thẻ tiếp (→)"
                >
                    <ChevronRight />
                </button>
            </div>

            {/* Keyboard hint */}
            <p className={styles.keyboardHint}>← → để chuyển thẻ &nbsp;·&nbsp; Space để lật</p>
        </div>
    );
};

export default Flashcard;