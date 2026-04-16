import { GoogleGenerativeAI } from "@google/generative-ai";
import type { VocabWord } from "../features/vocabs/type";

import { getFallbackModels } from "./aiModelConfig";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

export function isAiAvailable(): boolean {
    return !!API_KEY && API_KEY !== "your_gemini_api_key_here";
}

/* ─── Types ──────────────────────────────────────────────── */
export interface WordWithDistractors {
    vocab: VocabWord;
    /** 3 AI-generated wrong answers, same language as the real meaning */
    distractors: [string, string, string];
}

/* ─── Prompt ─────────────────────────────────────────────── */
const buildPrompt = (words: VocabWord[]) => {
    const list = words
        .map((w, i) => `${i + 1}. Word: "${w.word}" | Correct meaning: "${w.meaning}"`)
        .join("\n");

    return `You are a quiz generator for a vocabulary learning app.
For each vocabulary word below, generate exactly 3 WRONG but plausible-looking answer choices.

Rules for the distractors:
- Must be WRONG (not synonyms or paraphrases of the correct meaning)
- Must be in the SAME LANGUAGE as the correct meaning
- Must be convincingly similar in style/length to fool a learner
- Target common confusions: near-antonyms, related-but-different concepts, same domain but wrong meaning
- Each distractor should be unique and not repeat words from the correct meaning

Words to process:
${list}

Respond ONLY with a raw JSON array (no markdown, no explanation):
[
  {"id": "word_id", "distractors": ["wrong1", "wrong2", "wrong3"]},
  ...
]

Use the exact word text as the id (the part after "Word: ").`;
};

/* ─── Parse response ─────────────────────────────────────── */
function parseResponse(
    raw: string,
    words: VocabWord[]
): Map<string, [string, string, string]> {
    const cleaned = raw
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();

    const match = cleaned.match(/\[[\s\S]*\]/);
    if (!match) return new Map();

    const parsed: { id: string; distractors: string[] }[] = JSON.parse(match[0]);
    const result = new Map<string, [string, string, string]>();

    for (const item of parsed) {
        if (!item.id || !Array.isArray(item.distractors) || item.distractors.length < 3) continue;
        // Match by word text
        const vocab = words.find((w) => w.word === item.id);
        if (vocab) {
            result.set(vocab.id, [
                item.distractors[0],
                item.distractors[1],
                item.distractors[2],
            ]);
        }
    }
    return result;
}

/* ─── Fallback: random pool distractors ─────────────────── */
function shuffle<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5);
}

function buildFallbackDistractors(
    vocab: VocabWord,
    pool: VocabWord[]
): [string, string, string] {
    const others = shuffle(pool.filter((v) => v.id !== vocab.id)).slice(0, 3);
    // Pad with generic fillers if pool is too small
    const fillers = ["Không xác định", "Không liên quan", "Nghĩa khác"];
    while (others.length < 3) others.push({ id: "", word: "", meaning: fillers[others.length] });
    return [others[0].meaning, others[1].meaning, others[2].meaning];
}

/* ─── Main export ────────────────────────────────────────── */
export async function generateDistractors(
    words: VocabWord[]
): Promise<WordWithDistractors[]> {
    if (!isAiAvailable() || words.length < 2) {
        // Fallback: use pool words as distractors
        return words.map((vocab) => ({
            vocab,
            distractors: buildFallbackDistractors(vocab, words),
        }));
    }

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const modelsToTry = getFallbackModels();
        const prompt = buildPrompt(words);
        let raw = "";

        for (const modelName of modelsToTry) {
            try {
                console.log(`[QuizAI] Trying model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const response = await model.generateContent(prompt);
                raw = response.response.text();
                break; // Success!
            } catch (err) {
                console.warn(`[QuizAI] Model ${modelName} failed:`, err);
            }
        }

        if (!raw) {
            throw new Error("All AI models failed.");
        }

        const distractorMap = parseResponse(raw, words);

        return words.map((vocab) => ({
            vocab,
            distractors: distractorMap.get(vocab.id) ?? buildFallbackDistractors(vocab, words),
        }));
    } catch (err) {
        console.warn("[QuizAI] Distractor generation failed, using fallback:", err);
        // Graceful fallback — quiz still works without AI
        return words.map((vocab) => ({
            vocab,
            distractors: buildFallbackDistractors(vocab, words),
        }));
    }
}
