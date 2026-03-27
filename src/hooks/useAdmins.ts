import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Admin {
  _id: string;
  email: string;
  name: string;
  phone: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

export function useAdmins() {
  return useQuery<Admin[]>({
    queryKey: ['admins'],
    queryFn: async () => {
      const { data } = await api.get('/admins');
      return data;
    },
  });
}
