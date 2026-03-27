import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Car {
  _id: string;
  matricule: string;
  marque: string;
  location: string;
  visite_technique: string;
  date_assurance: string;
  vignette: string;
  healthStatus: 'OK' | 'WARN' | 'CRITICAL';
  lastHealthUpdate?: string;
  lastKnownLocation?: { lat: number; lng: number };
  lastKnownOdometer?: number;
  availability: {
    status: 'AVAILABLE' | 'RESERVED' | 'IN_USE';
    bookingId?: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export function useCars() {
  return useQuery<Car[]>({
    queryKey: ['cars'],
    queryFn: async () => {
      const { data } = await api.get('/cars');
      return data;
    },
  });
}

export function useCar(id: string) {
  return useQuery<Car>({
    queryKey: ['cars', id],
    queryFn: async () => {
      const { data } = await api.get(`/cars/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateCar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (car: Partial<Car>) => {
      const { data } = await api.post('/cars', car);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cars'] }),
  });
}

export function useUpdateCar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...car }: Partial<Car> & { id: string }) => {
      const { data } = await api.put(`/cars/${id}`, car);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cars'] }),
  });
}

export function useDeleteCar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/cars/${id}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cars'] }),
  });
}

export function useUpdateCarHealth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...healthData }: { id: string; healthStatus?: string; lastKnownLocation?: { lat: number; lng: number }; lastKnownOdometer?: number }) => {
      const { data } = await api.patch(`/cars/${id}/health`, healthData);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cars'] }),
  });
}
