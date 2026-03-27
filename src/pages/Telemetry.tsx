import { useState } from 'react';
import { useLatestTelemetry, useTelemetryRange } from '@/hooks/useTelemetry';
import { useCars } from '@/hooks/useCars';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Gauge, RotateCw, Fuel, MapPin, Activity, Cog, RefreshCw } from 'lucide-react';

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

const Telemetry = () => {
  const { data: cars, isLoading: carsLoading } = useCars();
  const [carId, setCarId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: latest, isLoading: ll, refetch } = useLatestTelemetry(carId);
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
    <div className="space-y-6 font-inter">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="space-y-1">
          <Label className="text-xs text-dash-muted">Select Vehicle</Label>
          <Select value={carId} onValueChange={setCarId}>
            <SelectTrigger className="w-64 border-dash-border"><SelectValue placeholder={carsLoading ? 'Loading...' : 'Choose a car'} /></SelectTrigger>
            <SelectContent>{cars?.map(c => <SelectItem key={c._id} value={c._id}>{c.matricule} — {c.marque}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {carId && <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 mt-5 cursor-pointer"><RefreshCw size={14} /> Refresh</Button>}
      </div>

      {!carId ? (
        <div className="py-20 text-center">
          <Activity className="mx-auto text-dash-muted mb-3" size={48} />
          <p className="text-dash-text font-medium text-lg">Select a vehicle</p>
          <p className="text-dash-muted text-sm mt-1">Choose a car to view telemetry data.</p>
        </div>
      ) : (
        <>
          <div>
            <h3 className="text-sm font-semibold text-dash-text mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-dash-success animate-pulse" /> Live Stats
              <span className="text-xs text-dash-muted font-normal">(auto-refresh 30s)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {stats.map(s => (
                <Card key={s.label} className="border-dash-border">
                  <CardContent className="p-4 text-center">
                    {ll ? <Skeleton className="h-14 w-full" /> : (
                      <>
                        <s.icon size={20} className={`mx-auto mb-2 ${s.color}`} />
                        <p className="text-lg font-bold text-dash-text">{s.value}</p>
                        <p className="text-[10px] text-dash-muted uppercase tracking-wider mt-1">{s.label}</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex items-end gap-4 flex-wrap">
            <div className="space-y-1"><Label className="text-xs text-dash-muted">From</Label><Input type="datetime-local" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-56 border-dash-border text-sm" /></div>
            <div className="space-y-1"><Label className="text-xs text-dash-muted">To</Label><Input type="datetime-local" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-56 border-dash-border text-sm" /></div>
          </div>

          {dateFrom && dateTo && (
            <Card className="border-dash-border">
              <CardHeader className="pb-3"><CardTitle className="text-base font-semibold text-dash-text">History</CardTitle></CardHeader>
              <CardContent className="p-0">
                {rl ? (
                  <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                ) : !range?.length ? (
                  <div className="py-12 text-center"><Activity className="mx-auto text-dash-muted mb-2" size={32} /><p className="text-sm text-dash-muted">No events in this range.</p></div>
                ) : (
                  <Table>
                    <TableHeader><TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs text-dash-muted uppercase font-medium">Timestamp</TableHead>
                      <TableHead className="text-xs text-dash-muted uppercase font-medium">Type</TableHead>
                      <TableHead className="text-xs text-dash-muted uppercase font-medium">Payload</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>{range.map(e => (
                      <TableRow key={e._id} className="hover:bg-dash-bg/60">
                        <TableCell className="text-xs text-dash-muted">{new Date(e.timestamp).toLocaleString()}</TableCell>
                        <TableCell><Badge variant="outline" className={`text-[10px] font-semibold ${eventColors[e.eventType] || 'bg-gray-100 text-gray-600'}`}>{e.eventType}</Badge></TableCell>
                        <TableCell className="font-mono text-xs text-dash-muted max-w-[400px] truncate">{JSON.stringify(e.payload)}</TableCell>
                      </TableRow>
                    ))}</TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default Telemetry;
