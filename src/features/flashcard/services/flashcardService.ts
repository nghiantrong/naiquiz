import {
    doc,
    setDoc,
    getDoc,
    deleteDoc,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";

/* ─── Types ──────────────────────────────────────────────── */
export interface StudyProgress {
    listId: string;
    listName: string;
    currentIndex: number;
    notKnownIds: string[];   // IDs của từ chưa nhớ
    roundWords: string[];    // IDs của từ trong vòng hiện tại
    round: number;
}

/* ─── Path helper ────────────────────────────────────────── */
/** 1 doc per list — users/{uid}/flashcardProgress/{listId} */
const progressDocRef = (uid: string, listId: string) =>
    doc(db, "users", uid, "flashcardProgress", listId);

/* ─── CRUD ───────────────────────────────────────────────── */
export const saveFlashcardProgress = (
    uid: string,
    progress: StudyProgress
): Promise<void> =>
    setDoc(progressDocRef(uid, progress.listId), {
        ...progress,
        savedAt: serverTimestamp(),
    });

export const loadFlashcardProgress = async (
    uid: string,
    listId: string
): Promise<StudyProgress | null> => {
    const snap = await getDoc(progressDocRef(uid, listId));
    return snap.exists() ? (snap.data() as StudyProgress) : null;
};

export const deleteFlashcardProgress = (
    uid: string,
    listId: string
): Promise<void> =>
    deleteDoc(progressDocRef(uid, listId));
