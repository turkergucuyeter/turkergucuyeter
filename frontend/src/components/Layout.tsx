import { useAuth } from "../context/AuthContext";
import { t } from "../utils/i18n";
import "./layout.css";

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>{t("app.title")}</h1>
        {user && (
          <div className="user-info">
            <span>{t("dashboard.welcome", { name: user.name })}</span>
            <button onClick={logout}>{t("auth.logout")}</button>
          </div>
        )}
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
};
