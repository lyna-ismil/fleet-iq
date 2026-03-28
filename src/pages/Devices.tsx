import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDevices, useRegisterDevice, usePairDevice, useDeleteDevice, useUpdateDeviceStatus, useDeviceStatuses, type Device } from '@/hooks/useDevices';
import { useCars } from '@/hooks/useCars';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Cpu, AlertCircle, RefreshCw, Link2, Trash2, Loader2, Link2Off, Eye, Pencil, Activity } from 'lucide-react';
import { toast } from 'sonner';

const deviceSchema = z.object({
  serialNumber: z.string().min(1, 'Serial number is required'),
  sharedSecret: z.string().min(16, 'Shared secret must be at least 16 characters'),
  firmwareVersion: z.string().optional(),
});

type DeviceFormData = z.infer<typeof deviceSchema>;

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-dash-success/15 text-emerald-700 border-dash-success/30',
  BLOCKED: 'bg-dash-danger/15 text-red-700 border-dash-danger/30',
  RETIRED: 'bg-gray-100 text-gray-500 border-gray-200',
};

const Devices = () => {
  const { data: devices, isLoading, isError, refetch } = useDevices();
  const { data: cars } = useCars();
  const { data: deviceStatuses } = useDeviceStatuses();
  const registerDevice = useRegisterDevice();
  const pairDevice = usePairDevice();
  const deleteDevice = useDeleteDevice();
  const updateDeviceStatus = useUpdateDeviceStatus();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [registerOpen, setRegisterOpen] = useState(false);
  const [pairModal, setPairModal] = useState<{ deviceId: string } | null>(null);
  const [pairCarId, setPairCarId] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailDevice, setDetailDevice] = useState<Device | null>(null);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [editStatus, setEditStatus] = useState<Device['status']>('ACTIVE');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
  });

  const onRegister = async (data: DeviceFormData) => {
    try {
      await registerDevice.mutateAsync(data as any);
      toast.success('Device registered successfully');
      setRegisterOpen(false);
      reset();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Registration failed');
    }
  };

  const handlePair = async () => {
    if (!pairModal || !pairCarId) return;
    try {
      await pairDevice.mutateAsync({ id: pairModal.deviceId, carId: pairCarId });
      toast.success('Device paired successfully');
      setPairModal(null);
      setPairCarId('');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Pairing failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDevice.mutateAsync(deleteId);
      toast.success('Device deleted');
      setDeleteId(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Delete failed');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDevice) return;
    try {
      await updateDeviceStatus.mutateAsync({ id: editingDevice._id, status: editStatus });
      toast.success('Device status updated');
      setEditingDevice(null);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleUnpair = async (deviceId: string) => {
    try {
      await pairDevice.mutateAsync({ id: deviceId, carId: '' });
      toast.success('Device unpaired successfully');
    } catch {
      toast.error('Failed to unpair device');
    }
  };

  const filtered = devices?.filter(d =>
    d.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
    d.deviceId.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-inter">
        <AlertCircle className="text-dash-danger mb-3" size={40} />
        <p className="text-dash-text font-medium mb-2">Failed to load devices</p>
        <Button onClick={() => refetch()} variant="outline" className="gap-2 cursor-pointer"><RefreshCw size={14} /> Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-inter">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dash-muted" />
          <Input placeholder="Search devices..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 border-dash-border" />
        </div>
        <Button onClick={() => { setRegisterOpen(true); reset(); }} className="bg-dash-purple hover:bg-dash-purple/90 text-white gap-2 cursor-pointer">
          <Plus size={16} /> Register Device
        </Button>
      </div>

      <Card className="border-dash-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Cpu className="mx-auto text-dash-muted mb-3" size={40} />
              <p className="text-dash-text font-medium">No devices found</p>
              <p className="text-dash-muted text-sm mt-1">Register your first OBD-II device.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Serial Number</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Paired Car</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Status</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Firmware</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Created</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => {
                  const telemetry = deviceStatuses?.find(s => s.deviceId === d.deviceId);
                  return (
                    <TableRow key={d._id} className="hover:bg-dash-bg/60 transition-colors">
                      <TableCell className="font-medium text-dash-text text-sm cursor-pointer hover:underline hover:text-dash-purple" onClick={() => setDetailDevice(d)}>
                        {d.serialNumber}
                      </TableCell>
                      <TableCell className="text-xs text-dash-muted">
                        {d.carId && cars?.find(c => c._id === d.carId) ? (
                          <span className="cursor-pointer hover:underline hover:text-dash-purple" onClick={() => navigate('/dashboard/cars', { state: { openCarId: d.carId } })}>
                            {cars.find(c => c._id === d.carId)!.marque} — {cars.find(c => c._id === d.carId)!.matricule}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-[10px] font-semibold border ${statusColors[d.status]}`}>{d.status}</Badge>
                          {telemetry && (
                            <div className="flex items-center gap-1 bg-dash-bg px-1.5 py-0.5 rounded-full border border-dash-border">
                              <span className={`w-1.5 h-1.5 rounded-full ${telemetry.isConnected ? 'bg-dash-success shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-dash-danger'}`}></span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-dash-muted">{d.firmwareVersion || '—'}</TableCell>
                      <TableCell className="text-xs text-dash-muted">{new Date(d.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setDetailDevice(d)} className="h-8 w-8 text-dash-muted hover:text-dash-purple cursor-pointer"><Eye size={14} /></Button>
                          <Button variant="ghost" size="icon" onClick={() => { setEditingDevice(d); setEditStatus(d.status); }} className="h-8 w-8 text-dash-muted hover:text-dash-purple cursor-pointer"><Pencil size={14} /></Button>
                          {d.carId ? (
                            <Button variant="ghost" size="icon" onClick={() => handleUnpair(d._id)} className="h-8 w-8 text-dash-muted hover:text-dash-warning cursor-pointer" title="Unpair"><Link2Off size={14} /></Button>
                          ) : (
                            <Button variant="ghost" size="icon" onClick={() => { setPairModal({ deviceId: d._id }); setPairCarId(''); }} className="h-8 w-8 text-dash-muted hover:text-dash-info cursor-pointer" title="Pair"><Link2 size={14} /></Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(d._id)} className="h-8 w-8 text-dash-muted hover:text-dash-danger cursor-pointer"><Trash2 size={14} /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <p className="text-xs text-dash-muted">Showing {filtered.length} of {devices?.length || 0} devices</p>

      {/* Register Device Modal */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-inter">Register Device</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onRegister)} className="space-y-4">
            <div className="space-y-2">
              <Label>Serial Number *</Label>
              <Input {...register('serialNumber')} className="border-dash-border" placeholder="SN-001-ABC" />
              {errors.serialNumber && <p className="text-dash-danger text-xs">{errors.serialNumber.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Shared Secret *</Label>
              <Input type="password" {...register('sharedSecret')} className="border-dash-border" placeholder="Min 16 characters" />
              {errors.sharedSecret && <p className="text-dash-danger text-xs">{errors.sharedSecret.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Firmware Version</Label>
              <Input {...register('firmwareVersion')} className="border-dash-border" placeholder="1.0.0" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRegisterOpen(false)} className="cursor-pointer">Cancel</Button>
              <Button type="submit" disabled={registerDevice.isPending} className="bg-dash-purple hover:bg-dash-purple/90 text-white cursor-pointer">
                {registerDevice.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}Register
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pair Device Modal */}
      <Dialog open={!!pairModal} onOpenChange={() => setPairModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-inter">Pair Device with Car</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Car</Label>
              <Select value={pairCarId} onValueChange={setPairCarId}>
                <SelectTrigger className="border-dash-border"><SelectValue placeholder="Choose a car" /></SelectTrigger>
                <SelectContent>
                  {cars?.map(c => (<SelectItem key={c._id} value={c._id}>{c.matricule} — {c.marque}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPairModal(null)} className="cursor-pointer">Cancel</Button>
              <Button onClick={handlePair} disabled={!pairCarId || pairDevice.isPending} className="bg-dash-purple hover:bg-dash-purple/90 text-white cursor-pointer">
                {pairDevice.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}Pair
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      {/* Delete */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Device</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to remove this device? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-dash-danger hover:bg-dash-danger/90 cursor-pointer">
              {deleteDevice.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail Drawer */}
      <Sheet open={!!detailDevice} onOpenChange={() => setDetailDevice(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-inter">Device Details</SheetTitle>
          </SheetHeader>
          {detailDevice && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-dash-purple/10 flex items-center justify-center">
                  <Cpu className="text-dash-purple" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-dash-text">{detailDevice.serialNumber}</h3>
                  <p className="text-sm font-mono text-dash-muted">{detailDevice.deviceId}</p>
                </div>
              </div>

              <div className="space-y-3 text-sm border-t border-dash-border pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-dash-muted">Status</span>
                  <Badge variant="outline" className={`text-[10px] font-semibold border ${statusColors[detailDevice.status]}`}>{detailDevice.status}</Badge>
                </div>
                
                {(() => {
                  const telemetry = deviceStatuses?.find(s => s.deviceId === detailDevice.deviceId);
                  return (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-dash-muted flex items-center gap-1.5"><Activity size={12} className="text-dash-info" /> Connection</span>
                        {telemetry ? (
                           <div className="flex items-center gap-1.5 text-xs font-medium">
                            <span className={`w-2 h-2 rounded-full ${telemetry.isConnected ? 'bg-dash-success shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-dash-danger'}`}></span>
                            <span className={telemetry.isConnected ? 'text-dash-success' : 'text-dash-danger'}>{telemetry.isConnected ? 'Online' : 'Offline'}</span>
                           </div>
                        ) : <span className="text-dash-muted">Offline</span>}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-dash-muted">Last Seen</span>
                        <span className="text-dash-text">{telemetry?.lastSeen ? new Date(telemetry.lastSeen).toLocaleString() : 'Never'}</span>
                      </div>
                    </>
                  );
                })()}

                <div className="flex justify-between items-center">
                  <span className="text-dash-muted">Firmware</span>
                  <span className="text-dash-text font-mono">{detailDevice.firmwareVersion || 'Unknown'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-dash-muted">Registered On</span>
                  <span className="text-dash-text">{new Date(detailDevice.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="border border-dash-border rounded-xl p-4 bg-dash-bg space-y-3">
                <h4 className="text-sm font-semibold text-dash-text">Vehicle Link</h4>
                {detailDevice.carId && cars?.find(c => c._id === detailDevice.carId) ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-dash-text font-medium cursor-pointer hover:underline hover:text-dash-purple" onClick={() => navigate('/dashboard/cars', { state: { openCarId: detailDevice.carId } })}>
                        {cars.find(c => c._id === detailDevice.carId)!.marque} — {cars.find(c => c._id === detailDevice.carId)!.matricule}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleUnpair(detailDevice._id)} className="text-dash-warning border-dash-warning/30 hover:bg-dash-warning/10 cursor-pointer h-7 text-xs">Unpair</Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-dash-muted">No vehicle paired</p>
                    <Button variant="outline" size="sm" onClick={() => { setPairModal({ deviceId: detailDevice._id }); setDetailDevice(null); }} className="text-dash-info border-dash-info/30 hover:bg-dash-info/10 cursor-pointer h-7 text-xs">Pair Now</Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Status Modal */}
      <Dialog open={!!editingDevice} onOpenChange={() => setEditingDevice(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle className="font-inter">Edit Device Status</DialogTitle></DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as any)}
                className="w-full text-sm h-10 px-3 rounded-lg border border-dash-border bg-transparent focus:ring-1 focus:ring-dash-purple focus:outline-none cursor-pointer"
              >
                {Object.keys(statusColors).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingDevice(null)} className="cursor-pointer">Cancel</Button>
              <Button type="submit" disabled={updateDeviceStatus.isPending} className="bg-dash-purple hover:bg-dash-purple/90 text-white cursor-pointer">
                {updateDeviceStatus.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Devices;
