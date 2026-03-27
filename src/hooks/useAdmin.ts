import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface AdminProfile {
  _id: string;
  email: string;
  name: string;
  phone: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  photo?: string | null;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
}

export function useAdminProfile(id: string) {
  return useQuery<AdminProfile>({
    queryKey: ['admin', id],
    queryFn: async () => {
      const { data } = await api.get(`/admins/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useUpdateAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; email?: string; phone?: string }) => {
      const { data } = await api.put(`/admins/${id}`, updates);
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['admin', variables.id] });
    },
  });
}

export function useUploadAdminPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append('photo', file);
      const { data } = await api.put(`/admins/${id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['admin', variables.id] });
    },
  });
}

export function useChangeAdminPassword() {
  return useMutation({
    mutationFn: async ({ id, currentPassword, newPassword }: { id: string; currentPassword: string; newPassword: string }) => {
      const { data } = await api.put(`/admins/${id}/password`, { currentPassword, newPassword });
      return data;
    },
  });
}
