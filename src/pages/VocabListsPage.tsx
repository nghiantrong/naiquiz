import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useVocabLists } from "../features/vocabs/hooks/useVocabs";
import type { VocabList, CreateVocabListInput } from "../features/vocabs/type";
import styles from "./VocabListsPage.module.css";

/* ─── Icons ──────────────────────────────────────────────── */
const PlusIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);
const TrashIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
);
const CardsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="16" height="13" rx="2" /><path d="M6 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6" />
    </svg>
);

/* ─── Create/Edit Modal ──────────────────────────────────── */
interface ListModalProps {
    initial?: VocabList | null;
    onConfirm: (data: CreateVocabListInput) => Promise<void>;
    onClose: () => void;
}

const ListModal = ({ initial, onConfirm, onClose }: ListModalProps) => {
    const [name, setName] = useState(initial?.name ?? "");
    const [description, setDescription] = useState(initial?.description ?? "");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSubmitting(true);
        try {
            await onConfirm({ name: name.trim(), description: description.trim() });
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h2 className={styles.modalTitle}>
                    {initial ? "Chỉnh sửa danh sách" : "Tạo danh sách mới"}
                </h2>
                <form onSubmit={handleSubmit} className={styles.modalForm}>
                    <div className={styles.field}>
                        <label className={styles.label}>Tên danh sách *</label>
                        <input
                            className={styles.input}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="VD: IELTS Academic Vocabulary"
                            autoFocus
                            required
                        />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>Mô tả (tuỳ chọn)</label>
                        <textarea
                            className={`${styles.input} ${styles.textarea}`}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ghi chú về danh sách này..."
                            rows={3}
                        />
                    </div>
                    <div className={styles.modalActions}>
                        <button type="button" className={styles.btnOutline} onClick={onClose}>
                            Huỷ
                        </button>
                        <button type="submit" className={styles.btnPrimary} disabled={submitting || !name.trim()}>
                            {submitting ? <span className={styles.spinner} /> : (initial ? "Lưu thay đổi" : "Tạo danh sách")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ─── Main Page ──────────────────────────────────────────── */
const VocabListsPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { lists, loading, error, createList, editList, removeList } = useVocabLists(user?.uid);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editTarget, setEditTarget] = useState<VocabList | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<VocabList | null>(null);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await removeList(deleteTarget.id);
            setDeleteTarget(null);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <main className={styles.page}>
            <div className={styles.pageInner}>
                {/* Header */}
            <div className={styles.header}>
                <div>
                    <p className={styles.sectionLabel}>📖 Từ vựng của tôi</p>
                    <h1 className={styles.title}>Danh sách từ vựng</h1>
                </div>
                <button className={styles.btnPrimary} onClick={() => setShowCreateModal(true)}>
                    <PlusIcon /> Tạo danh sách
                </button>
            </div>

            {/* States */}
            {loading && (
                <div className={styles.centerState}>
                    <div className={styles.spinner} />
                    <p>Đang tải...</p>
                </div>
            )}

            {error && !loading && (
                <div className={styles.errorBox}> ⚠️ {error}</div>
            )}

            {/* Empty state */}
            {!loading && !error && lists.length === 0 && (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📚</div>
                    <h2 className={styles.emptyTitle}>Chưa có danh sách nào</h2>
                    <p className={styles.emptyText}>Tạo danh sách đầu tiên để bắt đầu học từ vựng!</p>
                    <button className={styles.btnPrimary} onClick={() => setShowCreateModal(true)}>
                        <PlusIcon /> Tạo ngay
                    </button>
                </div>
            )}

            {/* List grid */}
            {!loading && lists.length > 0 && (
                <div className={styles.grid}>
                    {lists.map((list) => (
                        <div key={list.id} className={styles.card}>
                            <div className={styles.cardBody} onClick={() => navigate(`/vocab/${list.id}`)}>
                                <div className={styles.cardIcon}><CardsIcon /></div>
                                <div className={styles.cardInfo}>
                                    <h3 className={styles.cardName}>{list.name}</h3>
                                    {list.description && (
                                        <p className={styles.cardDesc}>{list.description}</p>
                                    )}
                                    <span className={styles.cardMeta}>{list.wordCount} từ</span>
                                </div>
                            </div>
                            <div className={styles.cardActions}>
                                <button
                                    className={styles.actionBtn}
                                    onClick={() => setEditTarget(list)}
                                    title="Chỉnh sửa"
                                >
                                    ✏️
                                </button>
                                <button
                                    className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                    onClick={() => setDeleteTarget(list)}
                                    title="Xoá"
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            </div>

            {/* Create modal */}
            {showCreateModal && (
                <ListModal
                    onConfirm={(data) => createList(data).then(() => {})}
                    onClose={() => setShowCreateModal(false)}
                />
            )}

            {/* Edit modal */}
            {editTarget && (
                <ListModal
                    initial={editTarget}
                    onConfirm={(data) => editList(editTarget.id, data)}
                    onClose={() => setEditTarget(null)}
                />
            )}

            {/* Delete confirm */}
            {deleteTarget && (
                <div className={styles.overlay} onClick={() => setDeleteTarget(null)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.modalTitle}>Xoá danh sách?</h2>
                        <p className={styles.modalText}>
                            Danh sách <strong>"{deleteTarget.name}"</strong> và toàn bộ{" "}
                            <strong>{deleteTarget.wordCount} từ</strong> bên trong sẽ bị xoá vĩnh viễn.
                        </p>
                        <div className={styles.modalActions}>
                            <button className={styles.btnOutline} onClick={() => setDeleteTarget(null)}>
                                Huỷ
                            </button>
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

export default VocabListsPage;
