import { ReactNode, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NotificationsPanel from './NotificationsPanel';

interface Props {
  children: ReactNode;
}

export default function Layout({ children }: Props) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Yoklama Takip</h1>
            <p className="text-sm text-slate-500">{t('layout.welcome', { name: user.name })}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="rounded bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-red-600"
          >
            {t('layout.logout')}
          </button>
        </div>
      </header>
      <main className="mx-auto flex max-w-6xl gap-6 px-6 py-6">
        <div className="flex-1">{children}</div>
        <aside className="w-80">
          <NotificationsPanel />
        </aside>
      </main>
    </div>
  );
}
