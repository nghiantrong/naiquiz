import { useState, useEffect, useCallback, useRef } from "react";
import type { VocabWord } from "../type";
import styles from "./Flashcard.module.css";

export type SwipeDirection = "left" | "right";

interface FlashcardProps {
    data: VocabWord;
    current?: number;
    total?: number;
    /** Called when user swipes/clicks right (knows this word) */
    onKnow?: () => void;
    /** Called when user swipes/clicks left (doesn't know) */
    onSkip?: () => void;
    /** Legacy nav callbacks (still used for simple prev/next mode) */
    onNext?: () => void;
    onPrev?: () => void;
    /** If true, show know/skip buttons instead of prev/next */
    swipeMode?: boolean;
    showHint?: boolean;
}

/* ─── Icons ─────────────────────────────────────────────── */
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

const CheckIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const XIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

/* ─── Swipe thresholds ───────────────────────────────────── */
const SWIPE_THRESHOLD = 80;   // px to trigger swipe
const SWIPE_VISUAL_MAX = 140; // cap for visual drag offset
const TILT_MAX = 15;          // degrees max tilt

const Flashcard = ({
    data,
    current = 1,
    total = 1,
    onKnow,
    onSkip,
    onNext,
    onPrev,
    swipeMode = false,
    showHint = true,
}: FlashcardProps) => {
    const [flipped, setFlipped] = useState(false);
    const [animating, setAnimating] = useState(false);

    // Swipe drag state
    const [dragX, setDragX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartX = useRef<number | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    // Exit animation state
    const [exitDir, setExitDir] = useState<SwipeDirection | null>(null);

    // Reset when card changes
    useEffect(() => {
        setFlipped(false);
        setDragX(0);
        setExitDir(null);
        setIsDragging(false);
    }, [data.id]);

    const handleFlip = useCallback(() => {
        if (animating || isDragging) return;
        setAnimating(true);
        setFlipped((prev) => !prev);
        setTimeout(() => setAnimating(false), 560);
    }, [animating, isDragging]);

    /* ─── Trigger swipe result ── */
    const triggerSwipe = useCallback((dir: SwipeDirection) => {
        if (exitDir) return; // already animating out
        setExitDir(dir);
        setTimeout(() => {
            setDragX(0);
            setExitDir(null);
            if (dir === "right") onKnow?.();
            else onSkip?.();
        }, 320);
    }, [exitDir, onKnow, onSkip]);

    /* ─── Mouse drag ── */
    const onMouseDown = (e: React.MouseEvent) => {
        if (!swipeMode) return;
        dragStartX.current = e.clientX;
        setIsDragging(true);
    };

    const onMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || dragStartX.current === null) return;
        const delta = e.clientX - dragStartX.current;
        const capped = Math.sign(delta) * Math.min(Math.abs(delta), SWIPE_VISUAL_MAX);
        setDragX(capped);
    }, [isDragging]);

    const onMouseUp = useCallback(() => {
        if (!isDragging) return;
        setIsDragging(false);
        if (Math.abs(dragX) >= SWIPE_THRESHOLD) {
            triggerSwipe(dragX > 0 ? "right" : "left");
        } else {
            setDragX(0);
        }
        dragStartX.current = null;
    }, [isDragging, dragX, triggerSwipe]);

    /* ─── Touch drag ── */
    const onTouchStart = (e: React.TouchEvent) => {
        if (!swipeMode) return;
        dragStartX.current = e.touches[0].clientX;
        setIsDragging(true);
    };

    const onTouchMove = useCallback((e: TouchEvent) => {
        if (!isDragging || dragStartX.current === null) return;
        const delta = e.touches[0].clientX - dragStartX.current;
        const capped = Math.sign(delta) * Math.min(Math.abs(delta), SWIPE_VISUAL_MAX);
        setDragX(capped);
    }, [isDragging]);

    const onTouchEnd = useCallback(() => {
        if (!isDragging) return;
        setIsDragging(false);
        if (Math.abs(dragX) >= SWIPE_THRESHOLD) {
            triggerSwipe(dragX > 0 ? "right" : "left");
        } else {
            setDragX(0);
        }
        dragStartX.current = null;
    }, [isDragging, dragX, triggerSwipe]);

    useEffect(() => {
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
        window.addEventListener("touchmove", onTouchMove);
        window.addEventListener("touchend", onTouchEnd);
        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
            window.removeEventListener("touchmove", onTouchMove);
            window.removeEventListener("touchend", onTouchEnd);
        };
    }, [onMouseMove, onMouseUp, onTouchMove, onTouchEnd]);

    /* ─── Keyboard shortcuts ── */
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                e.preventDefault();
                handleFlip();
            }
            if (swipeMode) {
                if (e.code === "ArrowRight") triggerSwipe("right");
                if (e.code === "ArrowLeft") triggerSwipe("left");
            } else {
                if (e.code === "ArrowRight") onNext?.();
                if (e.code === "ArrowLeft") onPrev?.();
            }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [handleFlip, onNext, onPrev, swipeMode, triggerSwipe]);

    /* ─── Computed card transform ── */
    const activeDrag = exitDir ? (exitDir === "right" ? SWIPE_VISUAL_MAX * 3 : -SWIPE_VISUAL_MAX * 3) : dragX;
    const tilt = (activeDrag / SWIPE_VISUAL_MAX) * TILT_MAX;
    const opacity = exitDir ? 0 : 1;

    const cardStyle: React.CSSProperties = swipeMode ? {
        transform: `translateX(${activeDrag}px) rotate(${tilt}deg)`,
        opacity,
        transition: exitDir || !isDragging ? "transform 0.32s cubic-bezier(0.25,1,0.5,1), opacity 0.3s" : "none",
        cursor: isDragging ? "grabbing" : "grab",
    } : {};

    const progress = (current / total) * 100;
    const cardInnerClass = [styles.cardInner, flipped ? styles.flipped : ""].join(" ");

    /* ─── Swipe indicator overlay ── */
    const swipeIndicator = swipeMode && Math.abs(dragX) > 20;
    const knowStrength = Math.min(1, dragX / SWIPE_THRESHOLD);
    const skipStrength = Math.min(1, -dragX / SWIPE_THRESHOLD);

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
            <div
                className={`${styles.scene} ${swipeMode ? styles.sceneSwipe : ""}`}
                ref={cardRef}
                style={cardStyle}
                onClick={!isDragging && Math.abs(dragX) < 5 ? handleFlip : undefined}
                onMouseDown={onMouseDown}
                onTouchStart={onTouchStart}
            >
                <div className={cardInnerClass}>

                    {/* Know indicator */}
                    {swipeIndicator && dragX > 20 && (
                        <div
                            className={`${styles.swipeLabel} ${styles.swipeLabelKnow}`}
                            style={{ opacity: knowStrength }}
                        >
                            ✓ Đã nhớ!
                        </div>
                    )}

                    {/* Skip indicator */}
                    {swipeIndicator && dragX < -20 && (
                        <div
                            className={`${styles.swipeLabel} ${styles.swipeLabelSkip}`}
                            style={{ opacity: skipStrength }}
                        >
                            ✗ Ôn lại
                        </div>
                    )}

                    {/* Front face — Term */}
                    <div className={`${styles.face} ${styles.front}`}>
                        <span className={styles.faceLabel}>Thuật ngữ</span>
                        <p className={styles.term}>{data.word}</p>
                        <div className={styles.flipHint}>
                            <RefreshIcon />
                            Nhấn để lật
                        </div>
                    </div>

                    {/* Back face — Definition */}
                    <div className={`${styles.face} ${styles.back}`}>
                        <span className={styles.faceLabel}>Định nghĩa</span>
                        <p className={styles.definition}>{data.meaning}</p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            {swipeMode ? (
                <div className={styles.swipeControls}>
                    <button
                        className={`${styles.swipeBtn} ${styles.swipeBtnSkip}`}
                        onClick={() => triggerSwipe("left")}
                        title="Chưa nhớ (←)"
                    >
                        <XIcon />
                        <span>Ôn lại</span>
                    </button>

                    <button className={styles.flipBtn} onClick={handleFlip}>
                        <RefreshIcon />
                        {flipped ? "Xem mặt trước" : "Lật thẻ"}
                    </button>

                    <button
                        className={`${styles.swipeBtn} ${styles.swipeBtnKnow}`}
                        onClick={() => triggerSwipe("right")}
                        title="Đã nhớ (→)"
                    >
                        <CheckIcon />
                        <span>Đã nhớ</span>
                    </button>
                </div>
            ) : (
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
            )}

            {/* Keyboard hint */}
            {showHint && (
                <p className={styles.keyboardHint}>
                    {swipeMode
                        ? "← Ôn lại · Space lật · → Đã nhớ"
                        : "← → để chuyển thẻ · Space để lật"}
                </p>
            )}
        </div>
    );
};

export default Flashcard;