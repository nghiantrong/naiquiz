import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
} from "../services/authService";
import styles from "./LoginPage.module.css";

type Mode = "login" | "register";

/* ─── Google Icon ────────────────────────────────────────── */
const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.6 32.9 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.4 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.2 0-9.6-3.1-11.3-7.5l-6.6 4.8C9.6 39.5 16.3 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.4l6.2 5.2C41.5 35 44 30 44 24c0-1.3-.1-2.7-.4-3.9z" />
    </svg>
);

const EyeIcon = ({ open }: { open: boolean }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {open ? (
            <>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
            </>
        ) : (
            <>
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
            </>
        )}
    </svg>
);

/* ─── Main component ─────────────────────────────────────── */
const LoginPage = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState<Mode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearError = () => setError(null);

    const getErrorMessage = (code: string): string => {
        const messages: Record<string, string> = {
            "auth/user-not-found":      "Không tìm thấy tài khoản với email này.",
            "auth/wrong-password":      "Mật khẩu không chính xác.",
            "auth/email-already-in-use":"Email này đã được sử dụng.",
            "auth/weak-password":       "Mật khẩu phải có ít nhất 6 ký tự.",
            "auth/invalid-email":       "Địa chỉ email không hợp lệ.",
            "auth/too-many-requests":   "Quá nhiều lần thử. Vui lòng thử lại sau.",
            "auth/popup-closed-by-user":"Đã hủy đăng nhập. Vui lòng thử lại.",
        };
        return messages[code] ?? "Đã xảy ra lỗi. Vui lòng thử lại.";
    };

    const handleEmailAuth = async (e: FormEvent) => {
        e.preventDefault();
        clearError();
        setLoading(true);
        try {
            if (mode === "login") {
                await loginWithEmail(email, password);
            } else {
                await registerWithEmail(email, password);
            }
            navigate("/");
        } catch (err: unknown) {
            const code = (err as { code?: string }).code ?? "";
            setError(getErrorMessage(code));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        clearError();
        setLoading(true);
        try {
            await loginWithGoogle();
            navigate("/");
        } catch (err: unknown) {
            const code = (err as { code?: string }).code ?? "";
            setError(getErrorMessage(code));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            {/* Background blobs */}
            <div className={styles.blobTop} aria-hidden="true" />
            <div className={styles.blobBottom} aria-hidden="true" />

            <div className={styles.card}>
                {/* Logo */}
                <div className={styles.logoWrap}>
                    <svg width="40" height="40" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                        <rect width="32" height="32" rx="10" fill="url(#loginLogoGrad)" />
                        <path d="M8 22 L16 10 L24 22" stroke="white" strokeWidth="2.5"
                            strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        <circle cx="16" cy="22" r="2.5" fill="white" />
                        <defs>
                            <linearGradient id="loginLogoGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#4255ff" />
                                <stop offset="1" stopColor="#7c3aed" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <span className={styles.logoText}>NaiQuiz</span>
                </div>

                <h1 className={styles.title}>
                    {mode === "login" ? "Chào mừng trở lại!" : "Tạo tài khoản mới"}
                </h1>
                <p className={styles.subtitle}>
                    {mode === "login"
                        ? "Đăng nhập để tiếp tục học từ vựng."
                        : "Bắt đầu hành trình học từ vựng của bạn."}
                </p>

                {/* Google button */}
                <button
                    className={styles.googleBtn}
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    type="button"
                >
                    <GoogleIcon />
                    Tiếp tục với Google
                </button>

                {/* Divider */}
                <div className={styles.divider}>
                    <span className={styles.dividerLine} />
                    <span className={styles.dividerText}>hoặc</span>
                    <span className={styles.dividerLine} />
                </div>

                {/* Email / Password form */}
                <form className={styles.form} onSubmit={handleEmailAuth} noValidate>
                    <div className={styles.field}>
                        <label htmlFor="email" className={styles.label}>Email</label>
                        <input
                            id="email"
                            type="email"
                            className={styles.input}
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="password" className={styles.label}>Mật khẩu</label>
                        <div className={styles.passwordWrap}>
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                className={styles.input}
                                placeholder={mode === "register" ? "Ít nhất 6 ký tự" : "••••••••"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete={mode === "login" ? "current-password" : "new-password"}
                            />
                            <button
                                type="button"
                                className={styles.eyeBtn}
                                onClick={() => setShowPassword((v) => !v)}
                                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                            >
                                <EyeIcon open={showPassword} />
                            </button>
                        </div>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className={styles.errorBox} role="alert">
                            ⚠️ {error}
                        </div>
                    )}

                    <button
                        id="submit-btn"
                        type="submit"
                        className={styles.submitBtn}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className={styles.spinner} aria-hidden="true" />
                        ) : (
                            mode === "login" ? "Đăng nhập" : "Tạo tài khoản"
                        )}
                    </button>
                </form>

                {/* Mode switch */}
                <p className={styles.switchText}>
                    {mode === "login" ? "Chưa có tài khoản?" : "Đã có tài khoản?"}
                    {" "}
                    <button
                        type="button"
                        className={styles.switchBtn}
                        onClick={() => { setMode(mode === "login" ? "register" : "login"); clearError(); }}
                    >
                        {mode === "login" ? "Đăng ký ngay" : "Đăng nhập"}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
