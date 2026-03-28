import { useState } from 'react';
import { useLatestTelemetry, useTelemetryRange } from '@/hooks/useTelemetry';
import { useCars } from '@/hooks/useCars';
import { useDeviceStatuses } from '@/hooks/useDevices';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Gauge, RotateCw, Fuel, MapPin, Activity, Cog, RefreshCw, Car as CarIcon, Cpu, AlertCircle, History } from 'lucide-react';

const eventColors: Record<string, string> = {
  ENGINE_STATUS: 'bg-dash-success/15 text-emerald-700',
  GPS_LOCATION: 'bg-dash-info/15 text-blue-700',
  SPEED: 'bg-dash-purple/15 text-purple-700',
  FUEL_LEVEL: 'bg-dash-warning/15 text-amber-700',
  BATTERY: 'bg-orange-100 text-orange-700',
  OBD_DIAGNOSTIC: 'bg-gray-100 text-gray-700',
  ALERT: 'bg-dash-danger/15 text-red-700',
  HEARTBEAT: 'bg-teal-100 text-teal-700',
};

const TelemetryDetailPanel = ({ carId, onClose }: { carId: string; onClose: () => void }) => {
  const { data: latest, isLoading: ll, refetch } = useLatestTelemetry(carId);
  
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { data: range, isLoading: rl } = useTelemetryRange(carId, dateFrom, dateTo);

  const stats = [
    { label: 'Speed', value: latest?.speed != null ? `${latest.speed} km/h` : '—', icon: Gauge, color: 'text-dash-purple' },
    { label: 'RPM', value: latest?.rpm != null ? `${latest.rpm}` : '—', icon: RotateCw, color: 'text-dash-info' },
    { label: 'Fuel', value: latest?.fuelLevel != null ? `${latest.fuelLevel}%` : '—', icon: Fuel, color: 'text-dash-warning' },
    { label: 'Engine', value: latest?.engineRunning != null ? (latest.engineRunning ? 'Running' : 'Off') : '—', icon: Cog, color: latest?.engineRunning ? 'text-dash-success' : 'text-dash-muted' },
    { label: 'GPS', value: latest?.gps ? `${latest.gps.lat.toFixed(4)}, ${latest.gps.lng.toFixed(4)}` : '—', icon: MapPin, color: 'text-dash-info' },
    { label: 'Odometer', value: latest?.odometer != null ? `${latest.odometer.toLocaleString()} km` : '—', icon: Activity, color: 'text-dash-success' },
  ];

  return (
    <Sheet open={!!carId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-2xl w-full">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-inter flex items-center justify-between">
            <span className="flex items-center gap-2"><Activity className="text-dash-purple" /> Live Telemetry</span>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 cursor-pointer h-8 text-xs"><RefreshCw size={12} /> Sync</Button>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-dash-text mb-3 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${latest ? 'bg-dash-success animate-pulse' : 'bg-dash-muted'}`} /> Current Diagnostics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {stats.map(s => (
                <Card key={s.label} className="border-dash-border">
                  <CardContent className="p-4 text-center">
                    {ll ? <Skeleton className="h-10 w-full mb-1" /> : (
                      <>
                        <s.icon size={16} className={`mx-auto mb-2 ${s.color}`} />
                        <p className="text-base font-bold text-dash-text">{s.value}</p>
                        <p className="text-[10px] text-dash-muted uppercase tracking-wider mt-1">{s.label}</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="border border-dash-border rounded-xl p-4 bg-dash-bg space-y-4">
            <h3 className="text-sm font-semibold text-dash-text flex items-center gap-2"><History size={14} className="text-dash-muted" /> Historical Range</h3>
            <div className="flex items-end gap-3 flex-wrap">
              <div className="space-y-1.5 flex-1 min-w-[140px]"><Label className="text-xs text-dash-muted">From</Label><Input type="datetime-local" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full border-dash-border text-xs h-9 bg-white" /></div>
              <div className="space-y-1.5 flex-1 min-w-[140px]"><Label className="text-xs text-dash-muted">To</Label><Input type="datetime-local" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full border-dash-border text-xs h-9 bg-white" /></div>
            </div>

            {dateFrom && dateTo && (
              <div className="pt-2">
                {rl ? (
                  <div className="space-y-2 mt-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                ) : !range?.length ? (
                  <div className="py-8 text-center bg-white rounded-lg border border-dash-border"><Activity className="mx-auto text-dash-muted mb-2" size={24} /><p className="text-xs text-dash-muted">No events in this range.</p></div>
                ) : (
                  <div className="border border-dash-border rounded-lg overflow-hidden max-h-64 overflow-y-auto bg-white">
                    <Table>
                      <TableHeader className="bg-dash-bg sticky top-0 z-10">
                        <TableRow className="hover:bg-transparent h-8">
                          <TableHead className="text-[10px] h-8 py-1">Time</TableHead>
                          <TableHead className="text-[10px] h-8 py-1">Event</TableHead>
                          <TableHead className="text-[10px] h-8 py-1 w-full">Payload</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {range.map(e => (
                          <TableRow key={e._id} className="hover:bg-dash-bg/60 h-8">
                            <TableCell className="text-[10px] py-2 whitespace-nowrap">{new Date(e.timestamp).toLocaleTimeString()}</TableCell>
                            <TableCell className="py-2"><Badge variant="outline" className={`text-[9px] px-1 py-0 h-4 rounded-sm border ${eventColors[e.eventType] || 'bg-gray-100 text-gray-600'}`}>{e.eventType}</Badge></TableCell>
                            <TableCell className="font-mono text-[10px] py-2 text-dash-muted max-w-[150px] truncate" title={JSON.stringify(e.payload)}>{JSON.stringify(e.payload)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const Telemetry = () => {
  const { data: cars, isLoading: carsLoading, isError } = useCars();
  const { data: deviceStatuses } = useDeviceStatuses();
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-inter">
        <AlertCircle className="text-dash-danger mb-3" size={40} />
        <p className="text-dash-text font-medium mb-2">Failed to load vehicles</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-inter">
      {carsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : !cars?.length ? (
        <div className="py-20 text-center border border-dash-border rounded-xl bg-white">
          <CarIcon className="mx-auto text-dash-muted mb-3" size={48} />
          <p className="text-dash-text font-medium text-lg">No vehicles found</p>
          <p className="text-dash-muted text-sm mt-1">Add cars to track their telemetry.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cars.map((car) => {
            const status = deviceStatuses?.find(s => s.vehicleId === car._id);
            const isOnline = status?.isConnected;

            return (
              <Card 
                key={car._id} 
                className="border-dash-border hover:border-dash-purple/30 transition-all cursor-pointer group flex flex-col justify-between"
                onClick={() => setSelectedCarId(car._id)}
              >
                <CardHeader className="pb-2 pt-4 px-4 flex-row items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-semibold text-dash-text group-hover:text-dash-purple transition-colors">{car.marque}</CardTitle>
                    <CardDescription className="text-xs font-mono">{car.matricule}</CardDescription>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-dash-bg flex items-center justify-center flex-shrink-0">
                    <CarIcon size={18} className="text-dash-muted group-hover:text-dash-purple transition-colors" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <div className="flex items-center justify-between border-t border-dash-border pt-3 mt-1">
                     <div className="flex items-center gap-1.5">
                       {status ? (
                         <>
                           <Cpu size={12} className={isOnline ? 'text-dash-success' : 'text-dash-muted'} />
                           <span className={`text-[10px] font-medium ${isOnline ? 'text-dash-success' : 'text-dash-muted'}`}>
                             {isOnline ? 'Online' : 'Offline'}
                           </span>
                           {isOnline && <span className="w-1.5 h-1.5 rounded-full bg-dash-success shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse ml-0.5" />}
                         </>
                       ) : (
                         <>
                           <AlertCircle size={12} className="text-dash-warning" />
                           <span className="text-[10px] font-medium text-dash-warning">No Device</span>
                         </>
                       )}
                     </div>
                     <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 font-semibold border ${car.availability.status === 'AVAILABLE' ? 'bg-dash-success/15 text-emerald-700 border-dash-success/30' : 'bg-dash-warning/15 text-amber-700 border-dash-warning/30'}`}>
                       {car.availability.status}
                     </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedCarId && (
        <TelemetryDetailPanel carId={selectedCarId} onClose={() => setSelectedCarId(null)} />
      )}
    </div>
  );
};

export default Telemetry;
