import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/auth';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { login } = useAuthStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Giriş başarısız. Bilgileri kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold text-slate-800">{t('auth.login.title')}</h1>
        <label className="mt-4 block text-sm text-slate-600" htmlFor="email">
          {t('auth.login.email')}
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full rounded border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:outline-none"
          required
        />
        <label className="mt-4 block text-sm text-slate-600" htmlFor="password">
          {t('auth.login.password')}
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 w-full rounded border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:outline-none"
          required
        />
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded bg-indigo-600 px-4 py-2 font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? '...' : t('auth.login.submit')}
        </button>
      </form>
    </div>
  );
}
