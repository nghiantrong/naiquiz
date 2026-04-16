import { useState, useEffect } from "react";
import { getHistory } from "../services/quizService";
import type { QuizHistoryEntry } from "../types";

/**
 * Fetch lịch sử quiz của 1 bộ từ.
 * Tự re-fetch khi listId thay đổi.
 */
export function useQuizHistory(uid: string | undefined, listId: string | null) {
    const [history, setHistory] = useState<QuizHistoryEntry[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!uid || !listId) {
            setHistory([]);
            return;
        }
        setLoading(true);
        getHistory(uid, listId)
            .then(setHistory)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [uid, listId]);

    const refetch = () => {
        if (!uid || !listId) return;
        getHistory(uid, listId).then(setHistory).catch(console.error);
    };

    return { history, loading, refetch };
}
