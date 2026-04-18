import { useState, useEffect } from 'react';
import { useFleetTelemetry, type TelemetrySnapshot } from '@/hooks/useFleetMap';
import { useDeviceStatuses, type DeviceStatus } from '@/hooks/useDevices';
import { useCars } from '@/hooks/useCars';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
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

type MarkerStatus = 'connected' | 'rented' | 'disconnected' | 'no-gps' | 'unpaired';

const statusConfig: Record<MarkerStatus, { color: string; label: string; bg: string }> = {
  'connected': { color: '#22c55e', label: 'Connected & Available', bg: 'bg-emerald-500' },
  'rented': { color: '#f97316', label: 'Rented', bg: 'bg-orange-500' },
  'disconnected': { color: '#ef4444', label: 'Disconnected', bg: 'bg-red-500' },
  'no-gps': { color: '#6b7280', label: 'No GPS Data', bg: 'bg-gray-500' },
  'unpaired': { color: '#8b5cf6', label: 'Unpaired', bg: 'bg-dash-purple' },
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

// Helper to parse manually typed "lat, lng" strings from the location field
const parseLocationString = (locStr?: string) => {
  if (!locStr) return undefined;
  const parts = locStr.split(',');
  if (parts.length === 2) {
    const lat = parseFloat(parts[0].trim());
    const lng = parseFloat(parts[1].trim());
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }
  return undefined;
};

function getMarkerStatus(
  snapshot: TelemetrySnapshot,
  deviceStatuses: DeviceStatus[]
): MarkerStatus {
  // 1. Unpaired
  if (!snapshot.deviceId) return 'unpaired';

  // 2. Connection status
  const deviceStatus = deviceStatuses.find(d => d.deviceId === snapshot.deviceId);
  const isConnected = deviceStatus?.isConnected ?? false;
  if (!isConnected) return 'disconnected';

  // 3. Rented vs Available
  const avail = snapshot.car?.availability?.status;
  if (avail === 'RESERVED' || avail === 'IN_USE') return 'rented';

  return 'connected';
}

const FleetMap = () => {
  const navigate = useNavigate();
  const { data: cars, isLoading: carsLoading } = useCars();
  const { data: telemetry, isLoading: telLoading, refetch: refetchTel } = useFleetTelemetry();
  const { data: deviceStatuses } = useDeviceStatuses();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [connectionFilter, setConnectionFilter] = useState<string>('all');

  useEffect(() => {
    const interval = setInterval(() => {
      refetchTel();
    }, 10000);
    return () => clearInterval(interval);
  }, [refetchTel]);

  const markers = (cars || []).map(car => {
    const snapshot = (telemetry || []).find(t => t.carId === car._id);
    
    // Parse fallback GPS from either lastKnownLocation or the string location field
    const fallbackGps = car.lastKnownLocation || parseLocationString(car.location);

    const enrichedSnapshot: TelemetrySnapshot = snapshot || {
      _id: `faux-${car._id}`,
      carId: car._id,
      deviceId: car.deviceId || '',
      ts: new Date(0).toISOString(),
      payload: { gps: fallbackGps },
    };

    // Ensure car data is always attached for filters
    enrichedSnapshot.car = {
      _id: car._id,
      marque: car.marque,
      matricule: car.matricule,
      availability: car.availability,
    };

    const status = getMarkerStatus(enrichedSnapshot, deviceStatuses || []);
    return { ...enrichedSnapshot, markerStatus: status };
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
      if (connectionFilter === 'unpaired' && m.markerStatus !== 'unpaired') return false;
    }
    return true;
  });

  const markersWithGps = filteredMarkers.filter(m => m.payload?.gps);
  const positions: [number, number][] = markersWithGps.map(m => [m.payload.gps!.lat, m.payload.gps!.lng]);

  const defaultCenter: [number, number] = [33.8869, 9.5375]; // Tunisia strict center

  const connectedCount = markers.filter(m => m.markerStatus === 'connected' || m.markerStatus === 'rented').length;
  const disconnectedCount = markers.filter(m => m.markerStatus === 'disconnected').length;
  const noGpsCount = markers.filter(m => m.markerStatus === 'no-gps').length;
  const unpairedCount = markers.filter(m => m.markerStatus === 'unpaired').length;
  const noGpsCars = filteredMarkers.filter(m => !m.payload?.gps);

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-8rem)] font-inter">
      {/* Top Filter Bar */}
      <Card className="border-dash-border shrink-0">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-dash-muted font-medium">Availability Filter</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 h-9 text-xs border-dash-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="rented">Rented</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-dash-muted font-medium">Connection Filter</label>
              <Select value={connectionFilter} onValueChange={setConnectionFilter}>
                <SelectTrigger className="w-40 h-9 text-xs border-dash-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="connected">Connected</SelectItem>
                  <SelectItem value="disconnected">Disconnected</SelectItem>
                  <SelectItem value="unpaired">Unpaired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="icon" onClick={() => refetchTel()} className="mt-5 h-9 w-9 cursor-pointer"><RefreshCw size={14} /></Button>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center">
              <div className="flex justify-center items-center gap-1.5 text-emerald-500 font-semibold text-lg"><Wifi size={16} />{connectedCount}</div>
              <span className="text-[10px] uppercase text-dash-muted font-medium">Connected</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex justify-center items-center gap-1.5 text-red-500 font-semibold text-lg"><WifiOff size={16} />{disconnectedCount}</div>
              <span className="text-[10px] uppercase text-dash-muted font-medium">Offline</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex justify-center items-center gap-1.5 text-dash-muted font-semibold text-lg"><Navigation size={16} />{noGpsCount}</div>
              <span className="text-[10px] uppercase text-dash-muted font-medium">No GPS</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex justify-center items-center gap-1.5 text-violet-500 font-semibold text-lg"><Car size={16} />{unpairedCount}</div>
              <span className="text-[10px] uppercase text-dash-muted font-medium">Unpaired</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left Panel: No Location Data Sidebar */}
        <div className="w-64 flex-shrink-0 flex flex-col h-full">
          <Card className="border-dash-border flex-1 flex flex-col overflow-hidden">
            <CardHeader className="py-3 px-4 border-b border-dash-border bg-dash-bg/50">
              <CardTitle className="text-sm font-semibold text-dash-text flex items-center gap-2">
                <Navigation size={14} className="text-dash-warning" /> No Location Data
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1">
              {noGpsCars.length === 0 ? (
                <div className="py-8 text-center px-4">
                  <p className="text-xs text-dash-muted">All filtered vehicles have valid GPS data.</p>
                </div>
              ) : (
                <div className="divide-y divide-dash-border">
                  {noGpsCars.map(car => (
                    <div key={car._id} className="p-3 hover:bg-dash-bg/50 transition-colors">
                      <p className="text-sm font-medium text-dash-text">{car.car ? `${car.car.marque} — ${car.car.matricule}` : 'Unknown'}</p>
                      <p className="text-[10px] text-dash-muted flex justify-between mt-1">
                        <span>Status: {car.car?.availability?.status || 'N/A'}</span>
                        <span className={car.markerStatus === 'disconnected' ? 'text-red-500' : 'text-emerald-500'}>
                          {car.markerStatus === 'disconnected' ? 'Offline' : 'Online'}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <div className="flex-1 rounded-xl overflow-hidden border border-dash-border relative h-full">
          {telLoading || carsLoading ? (
            <div className="w-full h-full flex items-center justify-center bg-dash-bg">
              <div className="text-center space-y-3">
                <Skeleton className="h-8 w-48 mx-auto" />
                <p className="text-sm text-dash-muted">Loading fleet map...</p>
              </div>
            </div>
          ) : (
            <>
              <MapContainer
                center={defaultCenter}
                zoom={7}
                className="w-full h-full"
                style={{ background: '#f8fafc' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {markersWithGps.map((m) => (
                  <Marker
                    key={m._id}
                    position={[m.payload.gps!.lat, m.payload.gps!.lng]}
                    icon={createCarIcon(statusConfig[m.markerStatus].color)}
                  >
                    <Popup>
                      <div className="text-sm space-y-2 min-w-[200px] p-1">
                        <div className="font-semibold text-dash-text text-base border-b border-dash-border pb-1">
                          {m.car ? `${m.car.marque} — ${m.car.matricule}` : 'Unknown Car'}
                        </div>
                        <div className="space-y-1.5 text-xs text-dash-muted pt-1">
                          <div className="flex justify-between items-center">
                            <span>Status:</span>
                            <Badge variant="outline" className="text-[9px] font-semibold">
                              {m.car?.availability?.status || 'N/A'}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Connection:</span>
                            <span className={m.markerStatus === 'connected' || m.markerStatus === 'rented' ? 'text-emerald-600 font-bold' : (m.markerStatus === 'unpaired' ? 'text-dash-purple font-bold' : 'text-red-600 font-bold')}>
                              {m.markerStatus === 'connected' || m.markerStatus === 'rented' ? '● Connected' : (m.markerStatus === 'unpaired' ? '● Unpaired' : '● Disconnected')}
                            </span>
                          </div>
                          {m.payload.speed != null && (
                            <div className="flex justify-between items-center"><span>Speed:</span><span className="text-dash-text font-bold">{m.payload.speed} km/h</span></div>
                          )}
                          {m.payload.fuelLevel != null && (
                            <div className="flex justify-between items-center"><span>Fuel:</span><span className="text-dash-text font-bold">{m.payload.fuelLevel}%</span></div>
                          )}
                          <div className="flex flex-col text-[10px] mt-2 pt-2 border-t border-dash-border gap-2">
                            <div className="flex justify-between items-center">
                              <span>Last seen:</span>
                              <span className="text-dash-text font-medium">{new Date(m.ts).toLocaleString()}</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="default" 
                              className="w-full h-7 text-[10px] font-bold mt-1 bg-dash-purple hover:bg-dash-purple/90 text-white cursor-pointer"
                              onClick={() => navigate('/dashboard/cars')}
                            >
                              <Car size={10} className="mr-1" /> View Car Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              {/* Bottom Right Legend Overlay */}
              <Card className="absolute bottom-4 right-4 z-[1000] border-dash-border bg-white shadow-xl w-48">
                <CardContent className="p-3 space-y-2">
                  <div className="text-xs font-bold text-dash-text uppercase tracking-wide mb-1 flex items-center gap-1.5">
                    <Layers size={12} className="text-dash-purple" /> Map Legend
                  </div>
                  {(Object.entries(statusConfig) as [MarkerStatus, typeof statusConfig[MarkerStatus]][]).map(([key, config]) => (
                    <div key={key} className="flex items-center gap-2 text-xs">
                      <div className={`w-3 h-3 rounded-full ${config.bg} shadow-sm border border-black/10`} />
                      <span className="text-dash-muted font-medium">{config.label}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FleetMap;
