import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface ReclamationUser {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  cinImageUrl?: string;
  licenseImageUrl?: string;
  facture?: number;
  nbr_fois_allocation?: number;
  blacklist?: boolean;
  status?: string;
}

export interface ReclamationCar {
  _id: string;
  marque: string;
  matricule: string;
  photo?: string;
  location?: string;
}

export interface ReclamationBooking {
  _id: string;
  carId: string;
  startDate: string;
  endDate: string;
  status: string;
  payment?: {
    amount?: number;
    currency?: string;
    status?: string;
  };
  car?: ReclamationCar | null;
}

export interface Reclamation {
  _id: string;
  userId: string;
  carId?: string;
  message: string;
  image?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
  assignedAdminId?: string;
  bookingId?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  // Enriched fields from GET endpoints
  user?: ReclamationUser | null;
  car?: ReclamationCar | null;
}

export interface ReclamationDetail extends Reclamation {
  userBookings?: ReclamationBooking[];
  userReclamationCount?: number;
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
  return useQuery<ReclamationDetail>({
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

export function useUpdateReclamationNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, adminNote }: { id: string; adminNote: string }) => {
      const { data } = await api.put(`/reclamations/${id}/note`, { adminNote });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reclamations'] }),
  });
}

export function useDeleteReclamation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/reclamations/${id}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reclamations'] }),
  });
}
