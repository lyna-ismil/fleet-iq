import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface HistoryBooking {
  _id: string;
  carId: string;
  startDate: string;
  endDate: string;
  status: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  payment?: {
    amount?: number;
    currency?: string;
    status?: string;
  };
  car?: {
    _id: string;
    marque: string;
    matricule: string;
    photo?: string;
    location?: string;
  } | null;
}

export interface UserHistory {
  user: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
    cinImageUrl?: string;
    licenseImageUrl?: string;
    facture?: number;
    nbr_fois_allocation?: number;
    blacklist?: boolean;
    status?: string;
    createdAt?: string;
  };
  bookings: HistoryBooking[];
  reclamationCount: number;
  rentalCount: number;
}

export function useUserHistory(userId: string) {
  return useQuery<UserHistory>({
    queryKey: ['users', userId, 'history'],
    queryFn: async () => {
      const { data } = await api.get(`/users/${userId}/history`);
      return data;
    },
    enabled: !!userId,
  });
}
