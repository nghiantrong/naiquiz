import { Outlet, NavLink } from "react-router-dom";
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
                            to="/quiz"
                            className={({ isActive }) =>
                                isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                            }
                        >
                            ✏️ Kiểm tra
                        </NavLink>
                    </div>

                    {/* Avatar placeholder */}
                    <div className={styles.avatar}>N</div>
                </div>
            </nav>

            <main className={styles.content}>
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;