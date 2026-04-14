import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useVocabWords } from "../features/vocabs/hooks/useVocabs";
import type { VocabWord, CreateVocabWordInput } from "../features/vocabs/type";
import { parseVocabText } from "../utils/parseVocabText";
import FileImportModal from "../features/vocabs/components/FileImportModal";
import styles from "./VocabDetailPage.module.css";

/* ─── Icons ──────────────────────────────────────────────── */
const PlusIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);
const TrashIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
);
const EditIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);
const BackIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

const UploadIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 16 12 12 8 16" />
        <line x1="12" y1="12" x2="12" y2="21" />
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
);

/* ─── Import Modal ───────────────────────────────────────── */
interface ImportModalProps {
    onConfirm: (words: CreateVocabWordInput[]) => Promise<void>;
    onClose: () => void;
}

const ImportModal = ({ onConfirm, onClose }: ImportModalProps) => {
    const [text, setText] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const parsed = parseVocabText(text);
    const hasInput = text.trim().length > 0;

    const handleConfirm = async () => {
        if (parsed.length === 0) return;
        setSubmitting(true);
        try {
            await onConfirm(parsed);
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={`${styles.modal} ${styles.modalWide}`} onClick={(e) => e.stopPropagation()}>
                <h2 className={styles.modalTitle}>📋 Import từ vựng</h2>
                <p className={styles.modalText}>
                    Dán văn bản vào bên dưới. Mỗi cặp từ gồm <strong>từ vựng</strong> trên 1 dòng,
                    <strong> định nghĩa</strong> trên dòng tiếp theo (dòng trống giữa các cặp sẽ bị bỏ qua).
                </p>

                <div className={styles.importLayout}>
                    {/* Input */}
                    <div className={styles.field}>
                        <label className={styles.label}>Dán văn bản vào đây</label>
                        <textarea
                            className={`${styles.input} ${styles.importTextarea}`}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder={`Look for\ntìm kiếm\n\nMeet a requirement\nđáp ứng yêu cầu\n\nFinalist\nngười cuối cùng`}
                            autoFocus
                        />
                    </div>

                    {/* Preview */}
                    <div className={styles.previewWrap}>
                        <label className={styles.label}>
                            Xem trước
                            {hasInput && (
                                <span className={`${styles.parseBadge} ${
                                    parsed.length > 0 ? styles.parseBadgeOk : styles.parseBadgeErr
                                }`}>
                                    {parsed.length > 0 ? `${parsed.length} từ` : "Không nhận diện được"}
                                </span>
                            )}
                        </label>

                        {parsed.length > 0 ? (
                            <div className={styles.previewList}>
                                {parsed.map((w, i) => (
                                    <div key={i} className={styles.previewRow}>
                                        <span className={styles.previewIndex}>{i + 1}</span>
                                        <span className={styles.previewTerm}>{w.word}</span>
                                        <span className={styles.previewMeaning}>{w.meaning}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.previewEmpty}>
                                {hasInput ? "⚠️ Không nhận diện được cặp từ nào." : "Kết quả sẽ hiện ở đây..."}
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.modalActions}>
                    <button type="button" className={styles.btnOutline} onClick={onClose}>Huỷ</button>
                    <button
                        className={styles.btnPrimary}
                        onClick={handleConfirm}
                        disabled={submitting || parsed.length === 0}
                    >
                        {submitting
                            ? <span className={styles.spinner} />
                            : `Thêm ${parsed.length > 0 ? parsed.length + " từ" : ""}`
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ─── Add / Edit Word Modal ──────────────────────────────── */
interface WordModalProps {
    initial?: VocabWord | null;
    onConfirm: (data: CreateVocabWordInput) => Promise<void>;
    onClose: () => void;
}

const WordModal = ({ initial, onConfirm, onClose }: WordModalProps) => {
    const [word, setWord] = useState(initial?.word ?? "");
    const [meaning, setMeaning] = useState(initial?.meaning ?? "");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!word.trim() || !meaning.trim()) return;
        setSubmitting(true);
        try {
            await onConfirm({ word: word.trim(), meaning: meaning.trim() });
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h2 className={styles.modalTitle}>
                    {initial ? "Chỉnh sửa từ vựng" : "Thêm từ vựng mới"}
                </h2>
                <form onSubmit={handleSubmit} className={styles.modalForm}>
                    <div className={styles.field}>
                        <label className={styles.label}>Thuật ngữ *</label>
                        <input
                            className={styles.input}
                            value={word}
                            onChange={(e) => setWord(e.target.value)}
                            placeholder="VD: Ephemeral"
                            autoFocus
                            required
                        />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>Định nghĩa *</label>
                        <textarea
                            className={`${styles.input} ${styles.textarea}`}
                            value={meaning}
                            onChange={(e) => setMeaning(e.target.value)}
                            placeholder="VD: Tồn tại trong thời gian ngắn; phù du"
                            rows={3}
                            required
                        />
                    </div>
                    <div className={styles.modalActions}>
                        <button type="button" className={styles.btnOutline} onClick={onClose}>
                            Huỷ
                        </button>
                        <button
                            type="submit"
                            className={styles.btnPrimary}
                            disabled={submitting || !word.trim() || !meaning.trim()}
                        >
                            {submitting ? <span className={styles.spinner} /> : (initial ? "Lưu" : "Thêm từ")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ─── Main Page ──────────────────────────────────────────── */
const VocabDetailPage = () => {
    const { listId } = useParams<{ listId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { words, loading, error, addNewWord, editWord, removeWord, batchImport } = useVocabWords(user?.uid, listId);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showFileImportModal, setShowFileImportModal] = useState(false);
    const [editTarget, setEditTarget] = useState<VocabWord | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<VocabWord | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [search, setSearch] = useState("");

    const filtered = words.filter(
        (w) =>
            w.word.toLowerCase().includes(search.toLowerCase()) ||
            w.meaning.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await removeWord(deleteTarget.id);
            setDeleteTarget(null);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <main className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate("/vocabs")}>
                    <BackIcon /> Danh sách
                </button>

                <div className={styles.headerMain}>
                    <div>
                        <p className={styles.sectionLabel}>📖 Từ vựng</p>
                        <h1 className={styles.title}>{words.length} từ vựng</h1>
                    </div>
                    <div className={styles.headerActions}>
                        <button
                            className={styles.btnOutline}
                            onClick={() => setShowFileImportModal(true)}
                        >
                            📂 File
                        </button>
                        <button
                            className={styles.btnOutline}
                            onClick={() => setShowImportModal(true)}
                        >
                            <UploadIcon /> Import text
                        </button>
                        <button className={styles.btnPrimary} onClick={() => setShowAddModal(true)}>
                            <PlusIcon /> Thêm từ
                        </button>
                    </div>
                </div>

                {/* Search bar */}
                <div className={styles.searchWrap}>
                    <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        className={styles.searchInput}
                        placeholder="Tìm từ vựng..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* States */}
            {loading && (
                <div className={styles.centerState}>
                    <div className={styles.spinnerDark} />
                    <p>Đang tải...</p>
                </div>
            )}

            {error && !loading && (
                <div className={styles.errorBox}>⚠️ {error}</div>
            )}

            {/* Empty state */}
            {!loading && !error && words.length === 0 && (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>✏️</div>
                    <h2 className={styles.emptyTitle}>Chưa có từ vựng nào</h2>
                    <p className={styles.emptyText}>Thêm từ đầu tiên vào danh sách này!</p>
                    <button className={styles.btnPrimary} onClick={() => setShowAddModal(true)}>
                        <PlusIcon /> Thêm từ vựng
                    </button>
                </div>
            )}

            {/* Word list */}
            {!loading && filtered.length > 0 && (
                <div className={styles.wordList}>
                    {filtered.map((w, i) => (
                        <div key={w.id} className={styles.wordRow}>
                            <span className={styles.wordIndex}>{i + 1}</span>
                            <div className={styles.wordContent}>
                                <span className={styles.wordTerm}>{w.word}</span>
                                <span className={styles.wordMeaning}>{w.meaning}</span>
                            </div>
                            <div className={styles.wordActions}>
                                <button
                                    className={styles.iconBtn}
                                    onClick={() => setEditTarget(w)}
                                    title="Chỉnh sửa"
                                >
                                    <EditIcon />
                                </button>
                                <button
                                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                    onClick={() => setDeleteTarget(w)}
                                    title="Xoá"
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* No search results */}
            {!loading && words.length > 0 && filtered.length === 0 && (
                <div className={styles.centerState}>
                    <p>Không tìm thấy từ nào khớp với "<strong>{search}</strong>"</p>
                </div>
            )}

            {/* Modals */}
            {/* File import modal */}
            {showFileImportModal && (
                <FileImportModal
                    onConfirm={batchImport}
                    onClose={() => setShowFileImportModal(false)}
                />
            )}

            {/* Import modal */}
            {showImportModal && (
                <ImportModal
                    onConfirm={batchImport}
                    onClose={() => setShowImportModal(false)}
                />
            )}

            {showAddModal && (
                <WordModal
                    onConfirm={addNewWord}
                    onClose={() => setShowAddModal(false)}
                />
            )}

            {editTarget && (
                <WordModal
                    initial={editTarget}
                    onConfirm={(data) => editWord(editTarget.id, data)}
                    onClose={() => setEditTarget(null)}
                />
            )}

            {deleteTarget && (
                <div className={styles.overlay} onClick={() => setDeleteTarget(null)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.modalTitle}>Xoá từ vựng?</h2>
                        <p className={styles.modalText}>
                            Từ <strong>"{deleteTarget.word}"</strong> sẽ bị xoá vĩnh viễn.
                        </p>
                        <div className={styles.modalActions}>
                            <button className={styles.btnOutline} onClick={() => setDeleteTarget(null)}>Huỷ</button>
                            <button className={styles.btnDanger} onClick={handleDelete} disabled={deleting}>
                                {deleting ? <span className={styles.spinner} /> : "Xoá"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default VocabDetailPage;
