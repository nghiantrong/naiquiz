import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";

const ProtectedRoute = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(160deg, #f0f5f0 0%, #edf8ee 50%, #f0f8f3 100%)",
            }}>
                <div style={{
                    width: 40,
                    height: 40,
                    border: "3.5px solid #e8e8f0",
                    borderTopColor: "#6b9b6f",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
