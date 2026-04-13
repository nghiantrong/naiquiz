import type { CreateVocabWordInput } from "../features/vocabs/type";

/**
 * Parse pasted vocabulary text into word-meaning pairs.
 *
 * Supported formats:
 *
 * 1. Line-pair format (Quizlet copy-paste):
 *    word
 *    meaning
 *    (blank lines between pairs are ignored)
 *
 * 2. Tab-separated format (Quizlet export / spreadsheet):
 *    word\tmeaning
 *
 * 3. Dash/colon separated:
 *    word - meaning
 *    word : meaning
 */
export function parseVocabText(raw: string): CreateVocabWordInput[] {
    const trimmed = raw.trim();
    if (!trimmed) return [];

    // Detect tab-separated format
    const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
    const hasTabSeparator = lines.some((l) => l.includes("\t"));
    const hasDashSeparator = lines.every((l) => /^.+\s[-:]\s.+$/.test(l));

    if (hasTabSeparator) {
        return parseTabSeparated(lines);
    }

    if (hasDashSeparator) {
        return parseDashSeparated(lines);
    }

    // Default: line-pair format (word on line N, meaning on line N+1)
    return parseLinePairs(lines);
}

/** word\tmeaning */
function parseTabSeparated(lines: string[]): CreateVocabWordInput[] {
    return lines.flatMap((line) => {
        const parts = line.split("\t").map((p) => p.trim());
        if (parts.length >= 2 && parts[0] && parts[1]) {
            return [{ word: parts[0], meaning: parts[1] }];
        }
        return [];
    });
}

/** word - meaning  or  word : meaning */
function parseDashSeparated(lines: string[]): CreateVocabWordInput[] {
    return lines.flatMap((line) => {
        const match = line.match(/^(.+?)\s[-:]\s(.+)$/);
        if (match) {
            return [{ word: match[1].trim(), meaning: match[2].trim() }];
        }
        return [];
    });
}

/**
 * Line-pair format — blank lines are used as delimiters,
 * odd lines = word, even lines = meaning.
 */
function parseLinePairs(lines: string[]): CreateVocabWordInput[] {
    const results: CreateVocabWordInput[] = [];
    for (let i = 0; i + 1 < lines.length; i += 2) {
        const word = lines[i].trim();
        const meaning = lines[i + 1].trim();
        if (word && meaning) {
            results.push({ word, meaning });
        }
    }
    return results;
}
