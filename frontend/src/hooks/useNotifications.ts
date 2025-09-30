import { useEffect, useState } from 'react';
import api from '../services/api';

export interface Notification {
  id: number;
  title: string;
  body: string;
  channel: 'inapp' | 'webpush';
  createdAt: string;
  readAt?: string | null;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get<Notification[]>('/notifications');
      setNotifications(response.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return { notifications, loading, refresh: fetchNotifications };
};
