import type { Timestamp } from "firebase/firestore";
import type { QuizHistoryEntry } from "../../quiz/types";
import styles from "./QuizHistoryPanel.module.css";

/* ─── Helpers ────────────────────────────────────────────── */
function formatRelativeTime(ts: Timestamp): string {
    const diff = Date.now() - ts.toMillis();
    const m = Math.floor(diff / 60_000);
    const h = Math.floor(diff / 3_600_000);
    const d = Math.floor(diff / 86_400_000);
    if (m < 1) return "Vừa xong";
    if (m < 60) return `${m} phút trước`;
    if (h < 24) return `${h} giờ trước`;
    if (d < 30) return `${d} ngày trước`;
    return `${Math.floor(d / 30)} tháng trước`;
}

function formatDuration(ms: number): string {
    const s = Math.round(ms / 1000);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${rem}s`;
}

function getScoreEmoji(percent: number): string {
    if (percent === 100) return "🏆";
    if (percent >= 70) return "🎉";
    if (percent >= 40) return "📚";
    return "💪";
}

/* ─── Component ──────────────────────────────────────────── */
interface Props {
    history: QuizHistoryEntry[];
    loading: boolean;
}

const QuizHistoryPanel = ({ history, loading }: Props) => {
    if (loading) return (
        <div className={styles.panel}>
            <p className={styles.panelLabel}>📋 Lịch sử</p>
            <div className={styles.skeletonRow} />
            <div className={styles.skeletonRow} style={{ width: "85%" }} />
        </div>
    );

    if (history.length === 0) return null;

    return (
        <div className={styles.panel}>
            <p className={styles.panelLabel}>📋 Lịch sử ({history.length} lần)</p>
            <div className={styles.list}>
                {history.map((entry) => (
                    <div key={entry.id} className={styles.row}>
                        <span className={styles.rowEmoji}>
                            {getScoreEmoji(entry.percent)}
                        </span>
                        <div className={styles.rowInfo}>
                            <span className={styles.rowScore}>
                                {entry.score}/{entry.total} câu đúng
                            </span>
                            <span className={styles.rowTime}>
                                {formatDuration(entry.duration)}
                            </span>
                        </div>
                        <div className={styles.rowRight}>
                            <span
                                className={styles.rowPercent}
                                style={{
                                    color: entry.percent >= 70
                                        ? "#3f6645"
                                        : entry.percent >= 40
                                            ? "#b45309"
                                            : "#dc2626",
                                }}
                            >
                                {entry.percent}%
                            </span>
                            <span className={styles.rowDate}>
                                {formatRelativeTime(entry.finishedAt)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default QuizHistoryPanel;
