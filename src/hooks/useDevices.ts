import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Device {
  _id: string;
  deviceId: string;
  serialNumber: string;
  carId?: string | null;
  status: 'ACTIVE' | 'BLOCKED' | 'RETIRED';
  firmwareVersion?: string;
  lastSeenAt?: string;
  createdAt: string;
  updatedAt: string;
}

export function useDevices() {
  return useQuery<Device[]>({
    queryKey: ['devices'],
    queryFn: async () => {
      const { data } = await api.get('/devices');
      return data;
    },
  });
}

export function useRegisterDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (device: { serialNumber: string; sharedSecret: string; firmwareVersion?: string }) => {
      const { data } = await api.post('/devices', device);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['devices'] }),
  });
}

export function usePairDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, carId }: { id: string; carId: string }) => {
      const { data } = await api.post(`/devices/${id}/pair`, { carId });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['devices'] }),
  });
}

export function useDeleteDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/devices/${id}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['devices'] }),
  });
}

export function useUpdateDeviceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'ACTIVE' | 'BLOCKED' | 'RETIRED' }) => {
      const { data } = await api.patch(`/devices/${id}/status`, { status });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['devices'] }),
  });
}

export function useUpdateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; status?: 'ACTIVE' | 'BLOCKED' | 'RETIRED'; firmwareVersion?: string; carId?: string | null }) => {
      const { data } = await api.put(`/devices/${id}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['devices'] }),
  });
}

export interface DeviceStatus {
  vehicleId: string | null;
  deviceId: string;
  firmwareVersion: string | null;
  isConnected: boolean;
  lastSeen: string | null;
}

export function useDeviceStatuses() {
  return useQuery<DeviceStatus[]>({
    queryKey: ['device-statuses'],
    queryFn: async () => {
      const { data } = await api.get('/devices/status/all');
      return data;
    },
    refetchInterval: 30_000,
  });
}
