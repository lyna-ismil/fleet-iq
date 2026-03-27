import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface User {
  _id: string;
  email: string;
  fullName: string;
  phone: string;
  cinImageUrl: string;
  licenseImageUrl: string;
  facture: number;
  nbr_fois_allocation: number;
  blacklist: boolean;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
}

export function useUsers() {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
  });
}

export function useUser(id: string) {
  return useQuery<User>({
    queryKey: ['users', id],
    queryFn: async () => {
      const { data } = await api.get(`/users/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...userData }: Partial<User> & { id: string }) => {
      const { data } = await api.put(`/users/${id}`, userData);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/users/${id}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userData: { fullName: string; email: string; phone: string; password: string }) => {
      const { data } = await api.post('/users', userData);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}
