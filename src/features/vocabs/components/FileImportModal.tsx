import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from "react";
import { getFileType, ACCEPTED_EXTENSIONS } from "../../../utils/fileExtractor";
import { aiExtractVocab, isGeminiConfigured } from "../../../utils/aiVocabExtractor";
import type { CreateVocabWordInput } from "../../vocabs/type";
import styles from "./FileImportModal.module.css";

/* ─── Icons ──────────────────────────────────────────────── */
const UploadCloudIcon = () => (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 16 12 12 8 16" />
        <line x1="12" y1="12" x2="12" y2="21" />
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
);

const XIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const TrashIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
);

/* ─── Types ──────────────────────────────────────────────── */
type Step = "upload" | "analyzing" | "review" | "error";

interface FileImportModalProps {
    onConfirm: (words: CreateVocabWordInput[]) => Promise<void>;
    onClose: () => void;
}

interface EditableWord extends CreateVocabWordInput {
    _key: number;
}

/* ─── Component ──────────────────────────────────────────── */
const FileImportModal = ({ onConfirm, onClose }: FileImportModalProps) => {
    const [step, setStep] = useState<Step>("upload");
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [words, setWords] = useState<EditableWord[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const keyCounter = useRef(0);

    const nextKey = () => ++keyCounter.current;

    /* ── File handling ── */
    const processFile = useCallback(async (f: File) => {
        const type = getFileType(f);
        if (type === "unsupported") {
            setErrorMsg(`Định dạng .${f.name.split(".").pop()} chưa được hỗ trợ. Dùng PDF, DOCX, hoặc TXT.`);
            setStep("error");
            return;
        }
        setFile(f);
        setStep("analyzing");
        try {
            const extracted = await aiExtractVocab(f);
            setWords(extracted.map((w) => ({ ...w, _key: nextKey() })));
            setStep("review");
        } catch (e) {
            setErrorMsg(e instanceof Error ? e.message : "Không thể phân tích file.");
            setStep("error");
        }
    }, []);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) processFile(f);
    };

    const handleDrop = useCallback((e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) processFile(f);
    }, [processFile]);

    /* ── Edit helpers ── */
    const updateWord = (key: number, field: "word" | "meaning", value: string) => {
        setWords((prev) => prev.map((w) => w._key === key ? { ...w, [field]: value } : w));
    };

    const removeWord = (key: number) => {
        setWords((prev) => prev.filter((w) => w._key !== key));
    };

    const addWord = () => {
        setWords((prev) => [...prev, { word: "", meaning: "", _key: nextKey() }]);
    };

    /* ── Submit ── */
    const handleConfirm = async () => {
        const valid = words.filter((w) => w.word.trim() && w.meaning.trim());
        if (valid.length === 0) return;
        setSubmitting(true);
        try {
            await onConfirm(valid.map(({ word, meaning }) => ({ word, meaning })));
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    const handleReset = () => {
        setStep("upload");
        setFile(null);
        setWords([]);
        setErrorMsg("");
        if (inputRef.current) inputRef.current.value = "";
    };

    const formatSize = (bytes: number) =>
        bytes < 1024 * 1024
            ? `${(bytes / 1024).toFixed(1)} KB`
            : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

    const validCount = words.filter((w) => w.word.trim() && w.meaning.trim()).length;
    const fileTypeLabel = file ? getFileType(file).toUpperCase() : "";

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

                {/* ── Header ── */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.headerIcon}>🤖</div>
                        <div>
                            <h2 className={styles.title}>AI Import từ file</h2>
                            <p className={styles.subtitle}>Gemini AI · PDF · DOCX · TXT</p>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}><XIcon /></button>
                </div>

                {/* Gemini not configured warning */}
                {!isGeminiConfigured() && (
                    <div className={styles.warningBar}>
                        ⚠️ Chưa có Gemini API key.{" "}
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                            Lấy key miễn phí tại đây ↗
                        </a>
                        {" "}rồi thêm vào file <code>.env</code>: <code>VITE_GEMINI_API_KEY=...</code>
                    </div>
                )}

                {/* ══ STEP: Upload ══ */}
                {step === "upload" && (
                    <div
                        className={`${styles.dropzone} ${isDragging ? styles.dropzoneDragging : ""}`}
                        onDrop={handleDrop}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onClick={() => inputRef.current?.click()}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            accept={ACCEPTED_EXTENSIONS}
                            className={styles.fileInput}
                            onChange={handleFileChange}
                        />
                        <div className={styles.dropzoneIcon}>
                            <UploadCloudIcon />
                        </div>
                        <p className={styles.dropzoneTitle}>
                            {isDragging ? "Thả file vào đây!" : "Kéo & thả file vào đây"}
                        </p>
                        <p className={styles.dropzoneSub}>hoặc click để chọn file</p>
                        <div className={styles.fileTypeBadges}>
                            {["PDF", "DOCX", "TXT"].map((t) => (
                                <span key={t} className={styles.badge}>{t}</span>
                            ))}
                        </div>
                        <p className={styles.aiNote}>✨ AI sẽ tự động nhận diện từ vựng và định nghĩa</p>
                    </div>
                )}

                {/* ══ STEP: Analyzing ══ */}
                {step === "analyzing" && (
                    <div className={styles.analyzingWrap}>
                        <div className={styles.analyzingRing}>
                            <div className={styles.analyzingSpinner} />
                            <span className={styles.analyzingEmoji}>🤖</span>
                        </div>
                        <p className={styles.analyzingTitle}>AI đang phân tích file...</p>
                        {file && (
                            <div className={styles.analyzingFile}>
                                <span className={styles.fileBadge}>{fileTypeLabel}</span>
                                <span>{file.name}</span>
                                <span className={styles.fileSize}>{formatSize(file.size)}</span>
                            </div>
                        )}
                        <p className={styles.analyzingHint}>
                            Gemini 2.0 Flash đang đọc nội dung và tìm cặp từ vựng...
                        </p>
                    </div>
                )}

                {/* ══ STEP: Error ══ */}
                {step === "error" && (
                    <div className={styles.errorWrap}>
                        <div className={styles.errorIcon}>⚠️</div>
                        <p className={styles.errorTitle}>Không thể phân tích file</p>
                        <p className={styles.errorMsg}>{errorMsg}</p>
                        <button className={styles.btnOutline} onClick={handleReset}>
                            Thử lại
                        </button>
                    </div>
                )}

                {/* ══ STEP: Review ══ */}
                {step === "review" && (
                    <>
                        {/* File info bar */}
                        <div className={styles.fileBar}>
                            <span className={styles.fileBadge}>{fileTypeLabel}</span>
                            <span className={styles.fileName}>{file?.name}</span>
                            <span className={styles.fileSize}>{file ? formatSize(file.size) : ""}</span>
                            <span className={styles.aiTag}>✨ AI extracted</span>
                            <button className={styles.changeFileBtn} onClick={handleReset}>
                                Đổi file
                            </button>
                        </div>

                        {/* Word list */}
                        <div className={styles.reviewWrap}>
                            <div className={styles.reviewHeader}>
                                <span className={styles.reviewCount}>
                                    {validCount} từ vựng
                                    {words.length !== validCount && (
                                        <span className={styles.reviewCountSub}>
                                            {" "}({words.length - validCount} chưa điền đủ)
                                        </span>
                                    )}
                                </span>
                                <button className={styles.addRowBtn} onClick={addWord}>
                                    + Thêm hàng
                                </button>
                            </div>

                            <div className={styles.wordTable}>
                                <div className={styles.tableHead}>
                                    <span></span>
                                    <span>Từ vựng</span>
                                    <span>Định nghĩa / Dịch nghĩa</span>
                                    <span></span>
                                </div>
                                <div className={styles.tableBody}>
                                    {words.map((w, i) => (
                                        <div key={w._key} className={`${styles.tableRow} ${
                                            !w.word.trim() || !w.meaning.trim() ? styles.tableRowInvalid : ""
                                        }`}>
                                            <span className={styles.rowIdx}>{i + 1}</span>
                                            <input
                                                className={styles.cellInput}
                                                value={w.word}
                                                onChange={(e) => updateWord(w._key, "word", e.target.value)}
                                                placeholder="Từ vựng..."
                                            />
                                            <input
                                                className={styles.cellInput}
                                                value={w.meaning}
                                                onChange={(e) => updateWord(w._key, "meaning", e.target.value)}
                                                placeholder="Định nghĩa..."
                                            />
                                            <button
                                                className={styles.deleteRowBtn}
                                                onClick={() => removeWord(w._key)}
                                                title="Xoá"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className={styles.actions}>
                            <button className={styles.btnOutline} onClick={onClose}>Huỷ</button>
                            <button
                                className={styles.btnPrimary}
                                onClick={handleConfirm}
                                disabled={submitting || validCount === 0}
                            >
                                {submitting
                                    ? <span className={styles.spinner} />
                                    : `Thêm ${validCount} từ vào danh sách →`
                                }
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FileImportModal;
