import { useState, useEffect } from 'react';
import { useFleetTelemetry, type TelemetrySnapshot } from '@/hooks/useFleetMap';
import { useDeviceStatuses, type DeviceStatus } from '@/hooks/useDevices';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Layers, Wifi, WifiOff, Car, RefreshCw, Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons in webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

type MarkerStatus = 'connected' | 'rented' | 'disconnected' | 'no-gps';

const statusConfig: Record<MarkerStatus, { color: string; label: string; bg: string }> = {
  'connected': { color: '#22c55e', label: 'Connected & Available', bg: 'bg-emerald-500' },
  'rented': { color: '#f97316', label: 'Rented', bg: 'bg-orange-500' },
  'disconnected': { color: '#ef4444', label: 'Disconnected', bg: 'bg-red-500' },
  'no-gps': { color: '#6b7280', label: 'No GPS Data', bg: 'bg-gray-500' },
};

const createCarIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-car-marker',
    html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px ${color}80;display:flex;align-items:center;justify-content:center">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
};

const GPS_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

function getMarkerStatus(
  snapshot: TelemetrySnapshot,
  deviceStatuses: DeviceStatus[]
): MarkerStatus {
  if (!snapshot.payload?.gps) return 'no-gps';

  const ts = new Date(snapshot.ts).getTime();
  if (Date.now() - ts > GPS_TIMEOUT_MS) return 'no-gps';

  const deviceStatus = deviceStatuses.find(d => d.deviceId === snapshot.deviceId);
  const isConnected = deviceStatus?.isConnected ?? false;

  if (!isConnected) return 'disconnected';

  const avail = snapshot.car?.availability?.status;
  if (avail === 'RESERVED' || avail === 'IN_USE') return 'rented';

  return 'connected';
}

// Auto-fit map to markers
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(p => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [positions, map]);
  return null;
}

const FleetMap = () => {
  const { data: telemetry, isLoading: telLoading, refetch: refetchTel } = useFleetTelemetry();
  const { data: deviceStatuses } = useDeviceStatuses();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [connectionFilter, setConnectionFilter] = useState<string>('all');

  const markers = (telemetry || []).map(s => {
    const status = getMarkerStatus(s, deviceStatuses || []);
    return { ...s, markerStatus: status };
  });

  const filteredMarkers = markers.filter(m => {
    if (statusFilter !== 'all') {
      const avail = m.car?.availability?.status;
      if (statusFilter === 'available' && avail !== 'AVAILABLE') return false;
      if (statusFilter === 'rented' && avail !== 'RESERVED' && avail !== 'IN_USE') return false;
    }
    if (connectionFilter !== 'all') {
      if (connectionFilter === 'connected' && m.markerStatus !== 'connected' && m.markerStatus !== 'rented') return false;
      if (connectionFilter === 'disconnected' && m.markerStatus !== 'disconnected') return false;
    }
    return true;
  });

  const markersWithGps = filteredMarkers.filter(m => m.payload?.gps);
  const positions: [number, number][] = markersWithGps.map(m => [m.payload.gps!.lat, m.payload.gps!.lng]);

  const defaultCenter: [number, number] = [36.8065, 10.1815]; // Tunisia center

  const connectedCount = markers.filter(m => m.markerStatus === 'connected' || m.markerStatus === 'rented').length;
  const disconnectedCount = markers.filter(m => m.markerStatus === 'disconnected').length;
  const noGpsCount = markers.filter(m => m.markerStatus === 'no-gps').length;

  return (
    <div className="flex gap-5 h-[calc(100vh-8rem)] font-inter">
      {/* Left Panel */}
      <div className="w-72 flex-shrink-0 space-y-4">
        {/* Filters */}
        <Card className="border-dash-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-dash-text flex items-center gap-2">
              <Filter size={14} className="text-dash-purple" /> Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-dash-muted font-medium">Availability</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-xs border-dash-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="rented">Rented</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-dash-muted font-medium">Connection</label>
              <Select value={connectionFilter} onValueChange={setConnectionFilter}>
                <SelectTrigger className="h-9 text-xs border-dash-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="connected">Connected</SelectItem>
                  <SelectItem value="disconnected">Disconnected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchTel()}
              className="w-full gap-2 cursor-pointer text-xs"
            >
              <RefreshCw size={12} /> Refresh
            </Button>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="border-dash-border">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-dash-muted flex items-center gap-1.5"><Wifi size={12} className="text-emerald-500" /> Connected</span>
              <span className="font-semibold text-dash-text">{connectedCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-dash-muted flex items-center gap-1.5"><WifiOff size={12} className="text-red-500" /> Disconnected</span>
              <span className="font-semibold text-dash-text">{disconnectedCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-dash-muted flex items-center gap-1.5"><Navigation size={12} className="text-gray-400" /> No GPS</span>
              <span className="font-semibold text-dash-text">{noGpsCount}</span>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="border-dash-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-dash-text flex items-center gap-2">
              <Layers size={14} className="text-dash-purple" /> Legend
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(Object.entries(statusConfig) as [MarkerStatus, typeof statusConfig[MarkerStatus]][]).map(([key, config]) => (
              <div key={key} className="flex items-center gap-2 text-xs">
                <div className={`w-3 h-3 rounded-full ${config.bg}`} />
                <span className="text-dash-muted">{config.label}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <div className="flex-1 rounded-xl overflow-hidden border border-dash-border">
        {telLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-dash-bg">
            <div className="text-center space-y-3">
              <Skeleton className="h-8 w-48 mx-auto" />
              <p className="text-sm text-dash-muted">Loading fleet map...</p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={positions.length > 0 ? positions[0] : defaultCenter}
            zoom={10}
            className="w-full h-full"
            style={{ background: '#f8fafc' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {positions.length > 0 && <FitBounds positions={positions} />}
            {markersWithGps.map((m) => (
              <Marker
                key={m._id}
                position={[m.payload.gps!.lat, m.payload.gps!.lng]}
                icon={createCarIcon(statusConfig[m.markerStatus].color)}
              >
                <Popup>
                  <div className="text-sm space-y-2 min-w-[200px] p-1">
                    <div className="font-semibold text-dash-text text-base">
                      {m.car ? `${m.car.marque} — ${m.car.matricule}` : 'Unknown Car'}
                    </div>
                    <div className="space-y-1 text-xs text-dash-muted">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge variant="outline" className="text-[9px] font-semibold">
                          {m.car?.availability?.status || 'N/A'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Connection:</span>
                        <span className={m.markerStatus === 'connected' || m.markerStatus === 'rented' ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
                          {m.markerStatus === 'connected' || m.markerStatus === 'rented' ? '● Connected' : '● Disconnected'}
                        </span>
                      </div>
                      {m.payload.speed != null && (
                        <div className="flex justify-between"><span>Speed:</span><span className="text-dash-text font-medium">{m.payload.speed} km/h</span></div>
                      )}
                      {m.payload.fuelLevel != null && (
                        <div className="flex justify-between"><span>Fuel:</span><span className="text-dash-text font-medium">{m.payload.fuelLevel}%</span></div>
                      )}
                      <div className="flex justify-between"><span>Last update:</span><span className="text-dash-text">{new Date(m.ts).toLocaleString()}</span></div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
};

export default FleetMap;
