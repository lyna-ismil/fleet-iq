import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface BookingCar {
  _id: string;
  marque: string;
  matricule: string;
  photo?: string;
  location?: string;
}

export interface BookingUser {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
}

export interface Booking {
  _id: string;
  userId: string;
  carId: string;
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  pickupLocation?: string;
  dropoffLocation?: string;
  payment: {
    amount?: number;
    currency?: string;
    status?: 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';
  };
  contractUrl?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
  // Enriched fields
  user?: BookingUser | null;
  car?: BookingCar | null;
}

export function useBookings() {
  return useQuery<Booking[]>({
    queryKey: ['bookings'],
    queryFn: async () => {
      const { data } = await api.get('/bookings');
      return data;
    },
  });
}

export function useBooking(id: string) {
  return useQuery<Booking>({
    queryKey: ['bookings', id],
    queryFn: async () => {
      const { data } = await api.get(`/bookings/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useUserBookings(userId: string) {
  return useQuery<Booking[]>({
    queryKey: ['bookings', 'user', userId],
    queryFn: async () => {
      const { data } = await api.get(`/bookings/user/${userId}`);
      return data;
    },
    enabled: !!userId,
  });
}

export function useCarBookings(carId: string) {
  return useQuery<Booking[]>({
    queryKey: ['bookings', 'car', carId],
    queryFn: async () => {
      const { data } = await api.get(`/bookings/car/${carId}`);
      return data;
    },
    enabled: !!carId,
  });
}

export function useConfirmBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.put(`/bookings/${id}/confirm`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.put(`/bookings/${id}/cancel`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });
}

export function useUpdateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Booking> & { id: string }) => {
      const { data } = await api.put(`/bookings/${id}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });
}

export function useDeleteBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/bookings/${id}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });
}
