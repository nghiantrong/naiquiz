import { useState, useEffect, useCallback } from "react";
import type { VocabList, VocabWord, CreateVocabListInput, CreateVocabWordInput } from "../type";
import {
    getVocabLists,
    createVocabList,
    updateVocabList,
    deleteVocabList,
    getWords,
    addWord,
    updateWord,
    deleteWord,
    batchAddWords,
} from "../services/vocabService";

/* ─── useVocabLists ──────────────────────────────────────── */

interface UseVocabListsReturn {
    lists: VocabList[];
    loading: boolean;
    error: string | null;
    createList: (input: CreateVocabListInput) => Promise<string>;
    editList: (listId: string, data: Partial<CreateVocabListInput>) => Promise<void>;
    removeList: (listId: string) => Promise<void>;
    refresh: () => Promise<void>;
}

export const useVocabLists = (userId: string | undefined): UseVocabListsReturn => {
    const [lists, setLists] = useState<VocabList[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLists = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await getVocabLists(userId);
            setLists(data);
        } catch (e) {
            setError("Không thể tải danh sách. Vui lòng thử lại.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchLists();
    }, [fetchLists]);

    const createList = async (input: CreateVocabListInput): Promise<string> => {
        if (!userId) throw new Error("Unauthenticated");
        const id = await createVocabList(userId, input);
        await fetchLists();
        return id;
    };

    const editList = async (listId: string, data: Partial<CreateVocabListInput>): Promise<void> => {
        if (!userId) throw new Error("Unauthenticated");
        await updateVocabList(userId, listId, data);
        await fetchLists();
    };

    const removeList = async (listId: string): Promise<void> => {
        if (!userId) throw new Error("Unauthenticated");
        await deleteVocabList(userId, listId);
        setLists((prev) => prev.filter((l) => l.id !== listId));
    };

    return { lists, loading, error, createList, editList, removeList, refresh: fetchLists };
};

/* ─── useVocabWords ──────────────────────────────────────── */

interface UseVocabWordsReturn {
    words: VocabWord[];
    loading: boolean;
    error: string | null;
    addNewWord: (input: CreateVocabWordInput) => Promise<void>;
    editWord: (wordId: string, data: Partial<CreateVocabWordInput>) => Promise<void>;
    removeWord: (wordId: string) => Promise<void>;
    batchImport: (inputs: CreateVocabWordInput[]) => Promise<void>;
    refresh: () => Promise<void>;
}

export const useVocabWords = (
    userId: string | undefined,
    listId: string | undefined
): UseVocabWordsReturn => {
    const [words, setWords] = useState<VocabWord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchWords = useCallback(async () => {
        if (!userId || !listId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await getWords(userId, listId);
            setWords(data);
        } catch (e) {
            setError("Không thể tải từ vựng. Vui lòng thử lại.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [userId, listId]);

    useEffect(() => {
        fetchWords();
    }, [fetchWords]);

    const addNewWord = async (input: CreateVocabWordInput): Promise<void> => {
        if (!userId || !listId) throw new Error("Unauthenticated");
        await addWord(userId, listId, input);
        await fetchWords();
    };

    const editWord = async (wordId: string, data: Partial<CreateVocabWordInput>): Promise<void> => {
        if (!userId || !listId) throw new Error("Unauthenticated");
        await updateWord(userId, listId, wordId, data);
        await fetchWords();
    };

    const removeWord = async (wordId: string): Promise<void> => {
        if (!userId || !listId) throw new Error("Unauthenticated");
        await deleteWord(userId, listId, wordId);
        setWords((prev) => prev.filter((w) => w.id !== wordId));
    };

    const batchImport = async (inputs: CreateVocabWordInput[]): Promise<void> => {
        if (!userId || !listId) throw new Error("Unauthenticated");
        await batchAddWords(userId, listId, inputs);
        await fetchWords();
    };

    return { words, loading, error, addNewWord, editWord, removeWord, batchImport, refresh: fetchWords };
};
