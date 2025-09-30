import { useEffect } from 'react';
import { useNotificationStore } from '../store/notifications';
import { useTranslation } from 'react-i18next';

export default function NotificationsPanel() {
  const { notifications, fetchNotifications } = useNotificationStore();
  const { t } = useTranslation();

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  if (!notifications.length) {
    return (
      <div className="rounded-lg bg-white p-4 shadow">
        <h2 className="text-lg font-semibold text-slate-700">Bildirimler</h2>
        <p className="mt-2 text-sm text-slate-500">{t('notifications.empty')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <div key={notification.id} className="rounded-lg bg-white p-4 shadow">
          <h3 className="text-sm font-semibold text-slate-700">{notification.title}</h3>
          <p className="mt-1 text-sm text-slate-500">{notification.body}</p>
          <p className="mt-2 text-xs text-slate-400">
            {new Date(notification.createdAt).toLocaleString('tr-TR')}
          </p>
        </div>
      ))}
    </div>
  );
}
