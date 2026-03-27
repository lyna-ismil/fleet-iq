import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface TelemetryEvent {
  _id: string;
  carId: string;
  deviceId: string;
  eventType: 'ENGINE_STATUS' | 'GPS_LOCATION' | 'SPEED' | 'FUEL_LEVEL' | 'BATTERY' | 'OBD_DIAGNOSTIC' | 'ALERT' | 'HEARTBEAT';
  payload: Record<string, any>;
  timestamp: string;
  createdAt: string;
}

export interface TelemetryLatest {
  carId: string;
  speed?: number;
  rpm?: number;
  fuelLevel?: number;
  engineRunning?: boolean;
  gps?: { lat: number; lng: number };
  odometer?: number;
  lastUpdated?: string;
}

export function useLatestTelemetry(carId: string) {
  return useQuery<TelemetryLatest>({
    queryKey: ['telemetry', 'latest', carId],
    queryFn: async () => {
      const { data } = await api.get(`/telemetry/cars/${carId}/latest`);
      return data;
    },
    enabled: !!carId,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
}

export function useTelemetryRange(carId: string, from: string, to: string) {
  return useQuery<TelemetryEvent[]>({
    queryKey: ['telemetry', 'range', carId, from, to],
    queryFn: async () => {
      const { data } = await api.get(`/telemetry/cars/${carId}/range`, {
        params: { from, to },
      });
      return data;
    },
    enabled: !!carId && !!from && !!to,
  });
}
