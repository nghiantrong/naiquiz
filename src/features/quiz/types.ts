import type { Timestamp } from "firebase/firestore";

/** Câu hỏi đã được serialize để lưu Firestore (không chứa VocabWord object) */
export interface SerializedQuestion {
    word: string;
    meaning: string;
    options: string[];
    correctIndex: number;
}

/** Draft quiz đang làm dở — lưu tại users/{uid}/quizDrafts/{listId} */
export interface QuizDraft {
    listId: string;
    listName: string;
    score: number;
    currentIndex: number;    // index của câu hỏi tiếp theo (chưa trả lời)
    total: number;
    questions: SerializedQuestion[];
    startedAt: number;       // Date.now() khi bắt đầu phiên này
}

/** Kết quả 1 lần làm quiz — lưu tại users/{uid}/quizHistory/{listId}/entries/{autoId} */
export interface QuizHistoryEntry {
    id: string;
    listId: string;
    listName: string;
    score: number;
    total: number;
    percent: number;
    finishedAt: Timestamp;
    duration: number;        // milliseconds
}

export type CreateHistoryInput = Omit<QuizHistoryEntry, "id" | "finishedAt">;
