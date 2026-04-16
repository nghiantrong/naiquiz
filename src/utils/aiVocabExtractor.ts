import { GoogleGenerativeAI } from "@google/generative-ai";
import type { CreateVocabWordInput } from "../features/vocabs/type";
import { getFileType, extractTextFromFile } from "./fileExtractor";

import { getFallbackModels } from "./aiModelConfig";

/* ─── Init ───────────────────────────────────────────────── */
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

export function isGeminiConfigured(): boolean {
    return !!API_KEY && API_KEY !== "your_gemini_api_key_here";
}

/* ─── Prompt ─────────────────────────────────────────────── */
const SYSTEM_PROMPT = `You are a vocabulary extraction assistant. \
Analyze the provided content and extract ALL vocabulary words/terms along with their definitions or translations. \
The content may be a PDF, document, or plain text in any language or format.

Rules:
- Extract EVERY vocabulary pair you can find
- "word" = the term, keyword, phrase, or heading being defined
- "meaning" = the definition, translation, or explanation of that term
- Include both English and non-English vocabulary
- Ignore page numbers, headers, footers, and unrelated text
- Return ONLY a raw JSON array, no markdown, no code blocks, no explanation

Format:
[{"word": "term here", "meaning": "definition/translation here"}, ...]

If no vocabulary pairs are found, return an empty array: []`;

/* ─── File → Base64 ──────────────────────────────────────── */
async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            resolve(dataUrl.split(",")[1]); // strip "data:...;base64,"
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/* ─── Parse Gemini response ──────────────────────────────── */
function parseGeminiResponse(raw: string): CreateVocabWordInput[] {
    // Strip any markdown code fences if present
    const cleaned = raw
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();

    // Extract JSON array
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (!match) return [];

    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return [];

    return parsed
        .filter((item): item is { word: string; meaning: string } =>
            item &&
            typeof item.word === "string" &&
            typeof item.meaning === "string" &&
            item.word.trim() !== "" &&
            item.meaning.trim() !== ""
        )
        .map((item) => ({
            word: item.word.trim(),
            meaning: item.meaning.trim(),
        }));
}

/* ─── Main export ────────────────────────────────────────── */
export async function aiExtractVocab(file: File): Promise<CreateVocabWordInput[]> {
    if (!isGeminiConfigured()) {
        throw new Error("Chưa cấu hình Gemini API key. Vui lòng thêm VITE_GEMINI_API_KEY vào file .env");
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const fileType = getFileType(file);
    let pdfBase64: string | undefined;
    let textContent: string | undefined;

    // Load file content once
    if (fileType === "pdf") {
        pdfBase64 = await fileToBase64(file);
    } else {
        textContent = await extractTextFromFile(file);
        if (!textContent.trim()) throw new Error("File trống hoặc không thể đọc nội dung.");
    }

    const modelsToTry = getFallbackModels();
    let result;

    for (const modelName of modelsToTry) {
        try {
            console.log(`[VocabAI] Trying model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });

            if (fileType === "pdf") {
                result = await model.generateContent([
                    { inlineData: { data: pdfBase64!, mimeType: "application/pdf" } },
                    SYSTEM_PROMPT,
                ]);
            } else {
                result = await model.generateContent([textContent!, SYSTEM_PROMPT]);
            }
            break; // Success
        } catch (err) {
            console.warn(`[VocabAI] Model ${modelName} failed:`, err);
        }
    }

    if (!result) {
        throw new Error("Tất cả AI models đều đang quá tải hoặc tạm thời không khả dụng. Vui lòng thử lại sau.");
    }

    const responseText = result.response.text();
    const words = parseGeminiResponse(responseText);

    if (words.length === 0) {
        throw new Error(
            "AI không tìm thấy cặp từ vựng nào. " +
            "Hãy thử với file có nội dung từ vựng rõ ràng hơn."
        );
    }

    return words;
}
