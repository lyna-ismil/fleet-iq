import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Reclamation {
  _id: string;
  userId: string;
  message: string;
  image?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
  assignedAdminId?: string;
  bookingId?: string;
  createdAt: string;
  updatedAt: string;
}

export function useReclamations() {
  return useQuery<Reclamation[]>({
    queryKey: ['reclamations'],
    queryFn: async () => {
      const { data } = await api.get('/reclamations');
      return data;
    },
  });
}

export function useReclamation(id: string) {
  return useQuery<Reclamation>({
    queryKey: ['reclamations', id],
    queryFn: async () => {
      const { data } = await api.get(`/reclamations/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useAssignReclamation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, assignedAdminId }: { id: string; assignedAdminId: string }) => {
      const { data } = await api.put(`/reclamations/${id}/assign`, { assignedAdminId });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reclamations'] }),
  });
}

export function useResolveReclamation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'RESOLVED' | 'REJECTED' }) => {
      const { data } = await api.put(`/reclamations/${id}/resolve`, { status });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reclamations'] }),
  });
}
