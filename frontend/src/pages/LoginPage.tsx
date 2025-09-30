import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { t } from "../utils/i18n";

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("supervisor@example.com");
  const [password, setPassword] = useState("Supervisor123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err?.message ?? t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 420, margin: "6rem auto" }}>
      <h2>{t("auth.login")}</h2>
      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          {t("auth.email")}
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          {t("auth.password")}
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>
        {error && <div style={{ color: "#dc2626" }}>{error}</div>}
        <button className="button" type="submit" disabled={loading}>
          {loading ? t("common.loading") : t("auth.login")}
        </button>
      </form>
      <p style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#4b5563" }}>
        Demo kullanıcıları: supervisor@example.com / Supervisor123!, teacher@example.com / Teacher123!, student@example.com /
        Student123!
      </p>
    </div>
  );
};
