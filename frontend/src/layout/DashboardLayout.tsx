import { ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

const DashboardLayout = ({ children, title, subtitle }: DashboardLayoutProps) => {
  const { user, clearAuth } = useAuthStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  useNotifications();

  const handleLogout = async () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">{title ?? 'Yoklama Sistemi'}</h1>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">{t('dashboard.welcome', { name: user?.name })}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm rounded-md border border-slate-200 hover:bg-slate-100"
            >
              {t('auth.logout')}
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">{children}</main>
    </div>
  );
};

export default DashboardLayout;
