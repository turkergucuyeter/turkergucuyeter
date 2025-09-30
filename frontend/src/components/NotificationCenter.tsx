import { useNotifications } from '../hooks/useNotifications';
import { BellIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

const NotificationCenter = () => {
  const { notifications } = useNotifications();
  const { t } = useTranslation();

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <BellIcon className="w-5 h-5 text-indigo-500" />
        <h2 className="font-semibold text-lg">{t('notifications.title')}</h2>
      </div>
      <ul className="space-y-3">
        {notifications.map((notification) => (
          <li key={notification.id} className="border border-slate-200 rounded-lg p-3">
            <div className="flex justify-between text-sm text-slate-500">
              <span>{new Date(notification.createdAt).toLocaleString('tr-TR')}</span>
              <span className="uppercase text-xs font-semibold text-slate-400">{notification.channel}</span>
            </div>
            <p className="font-semibold text-slate-800">{notification.title}</p>
            <p className="text-slate-600">{notification.body}</p>
          </li>
        ))}
        {notifications.length === 0 && (
          <li className="text-sm text-slate-500">Henüz bildiriminiz yok.</li>
        )}
      </ul>
    </div>
  );
};

export default NotificationCenter;
