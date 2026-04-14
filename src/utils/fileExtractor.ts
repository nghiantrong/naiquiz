/**
 * Client-side file text extractor.
 * Supports: .pdf, .docx, .doc (text only), .txt
 */

export type SupportedFileType = "pdf" | "docx" | "txt" | "unsupported";

export function getFileType(file: File): SupportedFileType {
    const name = file.name.toLowerCase();
    if (name.endsWith(".pdf"))  return "pdf";
    if (name.endsWith(".docx")) return "docx";
    if (name.endsWith(".txt") || name.endsWith(".text")) return "txt";
    return "unsupported";
}

export const ACCEPTED_EXTENSIONS = ".pdf,.docx,.txt";
export const ACCEPTED_MIME_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
];

/* ─── PDF extraction ─────────────────────────────────────── */
async function extractPdf(file: File): Promise<string> {
    const pdfjsLib = await import("pdfjs-dist");

    // Use CDN worker — avoids Vite bundling complexity
    pdfjsLib.GlobalWorkerOptions.workerSrc =
        `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const pageTexts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = content.items
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((item: any) => ("str" in item ? item.str : ""))
            .join(" ");
        pageTexts.push(text);
    }

    return pageTexts.join("\n");
}

/* ─── DOCX extraction ────────────────────────────────────── */
async function extractDocx(file: File): Promise<string> {
    const mammoth = await import("mammoth");
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
}

/* ─── TXT extraction ─────────────────────────────────────── */
async function extractTxt(file: File): Promise<string> {
    return await file.text();
}

/* ─── Public API ─────────────────────────────────────────── */
export async function extractTextFromFile(file: File): Promise<string> {
    const type = getFileType(file);
    switch (type) {
        case "pdf":  return extractPdf(file);
        case "docx": return extractDocx(file);
        case "txt":  return extractTxt(file);
        default:
            throw new Error(
                `Định dạng không được hỗ trợ: ${file.name.split(".").pop()?.toUpperCase()}. ` +
                "Vui lòng dùng PDF, DOCX, hoặc TXT."
            );
    }
}
