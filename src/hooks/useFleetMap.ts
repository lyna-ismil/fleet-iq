import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface TelemetrySnapshot {
  _id: string;
  carId: string;
  deviceId: string;
  ts: string;
  payload: {
    speed?: number;
    rpm?: number;
    fuelLevel?: number;
    gps?: { lat: number; lng: number };
    engineRunning?: boolean;
    odometer?: number;
    batteryVoltage?: number;
    coolantTemp?: number;
    dtcCodes?: string[];
  };
  car?: {
    _id: string;
    marque: string;
    matricule: string;
    availability?: {
      status: 'AVAILABLE' | 'RESERVED' | 'IN_USE';
    };
  } | null;
}

export function useFleetTelemetry() {
  return useQuery<TelemetrySnapshot[]>({
    queryKey: ['fleet-telemetry'],
    queryFn: async () => {
      const { data } = await api.get('/telemetry/latest-all');
      return data;
    },
    refetchInterval: 10_000,
  });
}
