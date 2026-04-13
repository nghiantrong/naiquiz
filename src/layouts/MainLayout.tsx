import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";
import { logout } from "../features/auth/services/authService";
import styles from "./MainLayout.module.css";

const LogoIcon = () => (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="url(#logoGrad)" />
        <path d="M8 22 L16 10 L24 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="16" cy="22" r="2.5" fill="white" />
        <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4255ff" />
                <stop offset="1" stopColor="#7c3aed" />
            </linearGradient>
        </defs>
    </svg>
);

const MainLayout = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const avatarLetter = user?.displayName?.[0] ?? user?.email?.[0]?.toUpperCase() ?? "U";
    return (
        <div className={styles.layout}>
            <nav className={styles.navbar}>
                <div className={styles.navInner}>
                    {/* Logo */}
                    <div className={styles.logo}>
                        <LogoIcon />
                        <span className={styles.logoText}>NaiQuiz</span>
                    </div>

                    {/* Nav links */}
                    <div className={styles.navLinks}>
                        <NavLink
                            to="/"
                            end
                            className={({ isActive }) =>
                                isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                            }
                        >
                            🃏 Thẻ ghi nhớ
                        </NavLink>
                        <NavLink
                            to="/vocabs"
                            className={({ isActive }) =>
                                isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                            }
                        >
                            📖 Từ vựng
                        </NavLink>
                        <NavLink
                            to="/quiz"
                            className={({ isActive }) =>
                                isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                            }
                        >
                            ✏️ Kiểm tra
                        </NavLink>
                    </div>

                    {/* User avatar + logout */}
                    <div className={styles.userMenu}>
                        <div className={styles.avatar} title={user?.email ?? ""}>
                            {avatarLetter}
                        </div>
                        <button
                            className={styles.logoutBtn}
                            onClick={handleLogout}
                            title="Đăng xuất"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2.5"
                                strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </nav>

            <main className={styles.content}>
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;