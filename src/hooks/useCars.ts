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
  photo?: string;
  description?: string;
  cityRestriction: boolean;
  allowedCities: string[];
  deviceId?: string | null;
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
    mutationFn: async (carData: FormData | Partial<Car>) => {
      const isFormData = carData instanceof FormData;
      const { data } = await api.post('/cars', carData, isFormData ? {
        headers: { 'Content-Type': 'multipart/form-data' },
      } : undefined);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cars'] }),
  });
}

export function useUpdateCar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }: { id: string; [key: string]: any }) => {
      // Check if we received FormData or plain object
      if (rest.formData instanceof FormData) {
        const { data } = await api.put(`/cars/${id}`, rest.formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
      }
      const { data } = await api.put(`/cars/${id}`, rest);
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
