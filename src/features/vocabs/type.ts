import type { Timestamp } from "firebase/firestore";

export interface VocabWord {
    id: string;
    word: string;
    meaning: string;
    createdAt?: Timestamp;
}

export interface VocabList {
    id: string;
    name: string;
    description?: string;
    wordCount: number;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

/** Dùng khi tạo mới — không có id và timestamps (Firestore tự tạo) */
export type CreateVocabListInput = Pick<VocabList, "name" | "description">;
export type CreateVocabWordInput = Pick<VocabWord, "word" | "meaning">;