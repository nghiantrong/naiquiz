import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    query,
    orderBy,
    increment,
    writeBatch,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type {
    VocabList,
    VocabWord,
    CreateVocabListInput,
    CreateVocabWordInput,
} from "../type";

/* ─── Collection path helpers ────────────────────────────── */
const listsRef = (userId: string) =>
    collection(db, "users", userId, "vocabLists");

const listDocRef = (userId: string, listId: string) =>
    doc(db, "users", userId, "vocabLists", listId);

const wordsRef = (userId: string, listId: string) =>
    collection(db, "users", userId, "vocabLists", listId, "words");

const wordDocRef = (userId: string, listId: string, wordId: string) =>
    doc(db, "users", userId, "vocabLists", listId, "words", wordId);

/* ═══════════════════════════════════════════════════════════
   VOCAB LIST CRUD
═══════════════════════════════════════════════════════════ */

/** Lấy tất cả danh sách từ vựng của user */
export const getVocabLists = async (userId: string): Promise<VocabList[]> => {
    const q = query(listsRef(userId), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as VocabList));
};

/** Lấy 1 danh sách theo id */
export const getVocabList = async (
    userId: string,
    listId: string
): Promise<VocabList | null> => {
    const snapshot = await getDoc(listDocRef(userId, listId));
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as VocabList;
};

/** Tạo danh sách mới */
export const createVocabList = async (
    userId: string,
    input: CreateVocabListInput
): Promise<string> => {
    const ref = await addDoc(listsRef(userId), {
        name: input.name,
        description: input.description ?? "",
        wordCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref.id;
};

/** Cập nhật tên / mô tả danh sách */
export const updateVocabList = async (
    userId: string,
    listId: string,
    data: Partial<CreateVocabListInput>
): Promise<void> => {
    await updateDoc(listDocRef(userId, listId), {
        ...data,
        updatedAt: serverTimestamp(),
    });
};

/** Xóa danh sách (và tất cả từ vựng bên trong) */
export const deleteVocabList = async (
    userId: string,
    listId: string
): Promise<void> => {
    // Xóa toàn bộ words trước
    const wordsSnapshot = await getDocs(wordsRef(userId, listId));
    const deletions = wordsSnapshot.docs.map((w) => deleteDoc(w.ref));
    await Promise.all(deletions);

    // Xóa list document
    await deleteDoc(listDocRef(userId, listId));
};

/* ═══════════════════════════════════════════════════════════
   VOCAB WORD CRUD
═══════════════════════════════════════════════════════════ */

/** Lấy tất cả từ trong một danh sách */
export const getWords = async (
    userId: string,
    listId: string
): Promise<VocabWord[]> => {
    const q = query(wordsRef(userId, listId), orderBy("createdAt", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as VocabWord));
};

/** Thêm 1 từ vào danh sách */
export const addWord = async (
    userId: string,
    listId: string,
    input: CreateVocabWordInput
): Promise<string> => {
    const ref = await addDoc(wordsRef(userId, listId), {
        word: input.word.trim(),
        meaning: input.meaning.trim(),
        createdAt: serverTimestamp(),
    });

    // Tăng wordCount trên list document
    await updateDoc(listDocRef(userId, listId), {
        wordCount: increment(1),
        updatedAt: serverTimestamp(),
    });

    return ref.id;
};

/** Cập nhật 1 từ */
export const updateWord = async (
    userId: string,
    listId: string,
    wordId: string,
    data: Partial<CreateVocabWordInput>
): Promise<void> => {
    await updateDoc(wordDocRef(userId, listId, wordId), {
        ...data,
        updatedAt: serverTimestamp(),
    });
};

/** Xóa 1 từ */
export const deleteWord = async (
    userId: string,
    listId: string,
    wordId: string
): Promise<void> => {
    await deleteDoc(wordDocRef(userId, listId, wordId));

    // Giảm wordCount trên list document
    await updateDoc(listDocRef(userId, listId), {
        wordCount: increment(-1),
        updatedAt: serverTimestamp(),
    });
};

/** Thêm nhiều từ cùng lúc (batch import) — tối đa 500 từ/lần */
export const batchAddWords = async (
    userId: string,
    listId: string,
    inputs: CreateVocabWordInput[]
): Promise<void> => {
    if (inputs.length === 0) return;

    // Firestore batch tối đa 500 operations — chunk nếu cần
    const CHUNK_SIZE = 490; // dành 10 slot cho update listDoc
    const chunks: CreateVocabWordInput[][] = [];
    for (let i = 0; i < inputs.length; i += CHUNK_SIZE) {
        chunks.push(inputs.slice(i, i + CHUNK_SIZE));
    }

    for (const chunk of chunks) {
        const batch = writeBatch(db);

        chunk.forEach((input) => {
            const newDocRef = doc(wordsRef(userId, listId));
            batch.set(newDocRef, {
                word: input.word.trim(),
                meaning: input.meaning.trim(),
                createdAt: serverTimestamp(),
            });
        });

        // Update wordCount một lần cho cả chunk
        batch.update(listDocRef(userId, listId), {
            wordCount: increment(chunk.length),
            updatedAt: serverTimestamp(),
        });

        await batch.commit();
    }
};
