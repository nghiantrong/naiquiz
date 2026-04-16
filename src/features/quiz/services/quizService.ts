import {
    doc,
    setDoc,
    getDoc,
    deleteDoc,
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    limit,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { QuizDraft, QuizHistoryEntry, CreateHistoryInput } from "../types";

/* ─── Path helpers ───────────────────────────────────────── */

/** 1 doc per list — overwrite khi save mới */
const draftDocRef = (uid: string, listId: string) =>
    doc(db, "users", uid, "quizDrafts", listId);

/** Sub‑collection: lưu tất cả kết quả của từng bộ từ */
const historyColRef = (uid: string, listId: string) =>
    collection(db, "users", uid, "quizHistory", listId, "entries");

/* ─── Draft ──────────────────────────────────────────────── */

export const saveDraft = (uid: string, draft: QuizDraft): Promise<void> =>
    setDoc(draftDocRef(uid, draft.listId), {
        ...draft,
        savedAt: serverTimestamp(),
    });

export const loadDraft = async (
    uid: string,
    listId: string
): Promise<QuizDraft | null> => {
    const snap = await getDoc(draftDocRef(uid, listId));
    return snap.exists() ? (snap.data() as QuizDraft) : null;
};

export const deleteDraft = (uid: string, listId: string): Promise<void> =>
    deleteDoc(draftDocRef(uid, listId));

/* ─── History ────────────────────────────────────────────── */

export const saveHistory = (
    uid: string,
    entry: CreateHistoryInput
): Promise<void> =>
    addDoc(historyColRef(uid, entry.listId), {
        ...entry,
        finishedAt: serverTimestamp(),
    }).then(() => undefined);

/**
 * Lấy tối đa 10 kết quả gần nhất của 1 bộ từ.
 * Không cần composite index vì đã group theo listId trong path.
 */
export const getHistory = async (
    uid: string,
    listId: string
): Promise<QuizHistoryEntry[]> => {
    const q = query(
        historyColRef(uid, listId),
        orderBy("finishedAt", "desc"),
        limit(10)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as QuizHistoryEntry));
};
