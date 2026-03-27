import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { v4 as uuidv4 } from 'uuid';

export interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  channel: 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';
  status: 'QUEUED' | 'PROCESSING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  retryCount: number;
  scheduledAt?: string;
  sentAt?: string;
  readAt?: string;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
}

export function useUserNotifications(userId: string) {
  return useQuery<Notification[]>({
    queryKey: ['notifications', 'user', userId],
    queryFn: async () => {
      const { data } = await api.get(`/notifications/user/${userId}`);
      return data;
    },
    enabled: !!userId,
  });
}

export function useSendNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notification: {
      userId: string;
      type: string;
      title: string;
      body: string;
      channel?: string;
    }) => {
      const { data } = await api.post('/notifications/send', notification, {
        headers: { 'X-Idempotency-Key': uuidv4() },
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useProcessQueue() {
  return useMutation({
    mutationFn: async (batchSize: number = 10) => {
      const { data } = await api.post('/notifications/process', { batchSize });
      return data;
    },
  });
}
