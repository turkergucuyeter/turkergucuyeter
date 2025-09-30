import { create } from 'zustand';
import { Notification } from '../types/api';
import api from '../lib/api';

interface NotificationState {
  notifications: Notification[];
  fetchNotifications: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  fetchNotifications: async () => {
    const response = await api.get('/notifications');
    set({ notifications: response.data.data });
  },
}));
