import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDevices, useRegisterDevice, usePairDevice, useDeleteDevice, useUpdateDeviceStatus, useUpdateDevice, useDeviceStatuses, type Device } from '@/hooks/useDevices';
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
import { Plus, Search, Cpu, AlertCircle, RefreshCw, Link2, Trash2, Loader2, Link2Off, Eye, Pencil, Activity, Lock } from 'lucide-react';
import { toast } from 'sonner';

const deviceSchema = z.object({
  serialNumber: z.string().min(1, 'Serial number is required'),
  sharedSecret: z.string().min(16, 'Shared secret must be at least 16 characters'),
  firmwareVersion: z.string().optional(),
  carId: z.string().optional(),
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
  const updateDevice = useUpdateDevice();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [registerOpen, setRegisterOpen] = useState(false);
  const [pairModal, setPairModal] = useState<{ deviceId: string } | null>(null);
  const [pairCarId, setPairCarId] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailDevice, setDetailDevice] = useState<Device | null>(null);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [editStatus, setEditStatus] = useState<Device['status']>('ACTIVE');
  const [editFirmware, setEditFirmware] = useState('');
  const [editCarId, setEditCarId] = useState('');
  const [createStatus, setCreateStatus] = useState<Device['status']>('ACTIVE');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
  });

  const onRegister = async (data: DeviceFormData) => {
    try {
      const payload: any = { ...data, status: createStatus };
      if (payload.carId === '' || payload.carId === 'none') delete payload.carId;
      await registerDevice.mutateAsync(payload);
      toast.success('Device registered successfully');
      setRegisterOpen(false);
      reset();
      setCreateStatus('ACTIVE');
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
      await updateDevice.mutateAsync({
        id: editingDevice._id,
        status: editStatus,
        firmwareVersion: editFirmware,
        carId: editCarId || null // Send null to unpair if empty
      });
      toast.success('Device updated successfully');
      setEditingDevice(null);
    } catch {
      toast.error('Failed to update device');
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
        <Button onClick={() => { setRegisterOpen(true); reset(); setCreateStatus('ACTIVE'); }} className="bg-dash-purple hover:bg-dash-purple/90 text-white gap-2 cursor-pointer">
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
                          <Button variant="ghost" size="icon" onClick={() => { setEditingDevice(d); setEditStatus(d.status); setEditFirmware(d.firmwareVersion || ''); setEditCarId(d.carId || ''); }} className="h-8 w-8 text-dash-muted hover:text-dash-purple cursor-pointer"><Pencil size={14} /></Button>
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

      {/* Register Device Drawer */}
      <Sheet open={registerOpen} onOpenChange={setRegisterOpen}>
        <SheetContent className="w-full sm:max-w-[480px] p-0 flex flex-col font-inter bg-dash-bg overflow-y-auto">
          <SheetHeader className="p-6 pb-4 border-b border-dash-border bg-white sticky top-0 z-10">
            <SheetTitle className="text-xl font-bold text-dash-text tracking-tight">Register New Device</SheetTitle>
          </SheetHeader>
          <div className="flex-1 p-6">
            <form id="register-device-form" onSubmit={handleSubmit(onRegister)} className="space-y-6">

              {/* Serial Number */}
              <div className="space-y-2">
                <Label>Serial Number <span className="text-red-500">*</span></Label>
                <Input {...register('serialNumber')} className="border-dash-border" placeholder="SN-001-ABC" />
                <p className="text-[10px] text-dash-muted">The unique hardware serial number printed on the OBD-II device.</p>
                {errors.serialNumber && <p className="text-dash-danger text-xs">{errors.serialNumber.message}</p>}
              </div>

              {/* Shared Secret */}
              <div className="space-y-2">
                <Label>Shared Secret <span className="text-red-500">*</span></Label>
                <Input type="password" {...register('sharedSecret')} className="border-dash-border" placeholder="Min 16 characters" />
                <p className="text-[10px] text-dash-muted">The authentication key for this device. Minimum 16 characters, stored securely (hashed).</p>
                {errors.sharedSecret && <p className="text-dash-danger text-xs">{errors.sharedSecret.message}</p>}
              </div>

              {/* Initial Status */}
              <div className="space-y-2">
                <Label>Initial Status</Label>
                <div className="flex w-full rounded-lg overflow-hidden border border-dash-border p-1 gap-1 bg-dash-bg bg-opacity-50">
                  <button type="button" onClick={() => setCreateStatus('ACTIVE')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${createStatus === 'ACTIVE' ? 'bg-emerald-500 text-white shadow-sm' : 'text-dash-muted hover:bg-dash-bg'}`}>Active</button>
                  <button type="button" onClick={() => setCreateStatus('BLOCKED')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${createStatus === 'BLOCKED' ? 'bg-red-500 text-white shadow-sm' : 'text-dash-muted hover:bg-dash-bg'}`}>Blocked</button>
                  <button type="button" onClick={() => setCreateStatus('RETIRED')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${createStatus === 'RETIRED' ? 'bg-gray-500 text-white shadow-sm' : 'text-dash-muted hover:bg-dash-bg'}`}>Retired</button>
                </div>
                <p className="text-[10px] text-dash-muted">Set the initial operational status. Defaults to Active.</p>
              </div>

              {/* Firmware Version */}
              <div className="space-y-2">
                <Label>Firmware Version</Label>
                <Input {...register('firmwareVersion')} className="border-dash-border" placeholder="e.g. 1.0.0" />
                <p className="text-[10px] text-dash-muted">The current firmware version running on the device.</p>
              </div>

              {/* Initial Car Pairing */}
              <div className="space-y-2 pt-4 border-t border-dash-border">
                <Label>Initial Vehicle Pairing <span className="text-dash-muted text-[10px]">(Optional)</span></Label>
                <Select value={undefined} onValueChange={(val) => register('carId').onChange({ target: { name: 'carId', value: val } })}>
                  <SelectTrigger className="border-dash-border">
                    <SelectValue placeholder="No vehicle (pair later)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No vehicle (pair later)</SelectItem>
                    {cars?.map(c => (
                      <SelectItem key={c._id} value={c._id}>{c.matricule} — {c.marque}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-dash-muted">Optionally link this device to a vehicle right away. Can be changed later.</p>
              </div>

            </form>
          </div>
          <div className="p-6 border-t border-dash-border bg-white sticky bottom-0 z-10 flex gap-3 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.05)]">
            <Button type="button" variant="outline" onClick={() => setRegisterOpen(false)} className="flex-1 cursor-pointer">Cancel</Button>
            <Button type="submit" form="register-device-form" disabled={registerDevice.isPending} className="flex-1 bg-dash-purple hover:bg-dash-purple/90 text-white cursor-pointer shadow-sm">
              {registerDevice.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}Register Device
            </Button>
          </div>
        </SheetContent>
      </Sheet>

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
                <div className="flex justify-between items-center">
                  <span className="text-dash-muted">Last Updated</span>
                  <span className="text-dash-text">{new Date(detailDevice.updatedAt).toLocaleDateString()}</span>
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

      {/* Edit Form Drawer */}
      <Sheet open={!!editingDevice} onOpenChange={(open) => !open && setEditingDevice(null)}>
        <SheetContent className="w-full sm:max-w-[480px] p-0 flex flex-col font-inter bg-dash-bg overflow-y-auto">
          <SheetHeader className="p-6 pb-4 border-b border-dash-border bg-white sticky top-0 z-10">
            <SheetTitle className="text-xl font-bold text-dash-text tracking-tight">Edit Device</SheetTitle>
          </SheetHeader>
          <div className="flex-1 p-6">
            <form id="edit-device-form" onSubmit={handleEditSubmit} className="space-y-6">
              
              {/* READ-ONLY ID */}
              <div className="space-y-2">
                <Label>Device MAC ID (Read-Only)</Label>
                <div className="relative">
                  <Input readOnly value={editingDevice?.deviceId || ''} className="font-mono text-sm bg-gray-50 border-dash-border text-dash-muted" />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Lock size={14} className="text-dash-muted/50" />
                  </div>
                </div>
                <p className="text-[10px] text-dash-muted">The unique hardware identifier cannot be modified after registration.</p>
              </div>

              {/* READ-ONLY SERIAL NUMBER */}
              <div className="space-y-2">
                <Label>Serial Number (Read-Only)</Label>
                <div className="relative">
                  <Input readOnly value={editingDevice?.serialNumber || ''} className="font-mono text-sm bg-gray-50 border-dash-border text-dash-muted" />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Lock size={14} className="text-dash-muted/50" />
                  </div>
                </div>
                <p className="text-[10px] text-dash-muted">The serial number is set at registration and cannot be changed.</p>
              </div>

              {/* SHARED SECRET NOTE */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-2">
                <AlertCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 leading-tight">
                  <strong>Authentication:</strong> The shared secret was set at registration and cannot be changed through this form for security reasons.
                </p>
              </div>

              {/* STATUS TOGGLE */}
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex w-full rounded-lg overflow-hidden border border-dash-border p-1 gap-1 bg-dash-bg bg-opacity-50">
                  <button type="button" onClick={() => setEditStatus('ACTIVE')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${editStatus === 'ACTIVE' ? 'bg-emerald-500 text-white shadow-sm' : 'text-dash-muted hover:bg-dash-bg'}`}>Active</button>
                  <button type="button" onClick={() => setEditStatus('BLOCKED')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${editStatus === 'BLOCKED' ? 'bg-red-500 text-white shadow-sm' : 'text-dash-muted hover:bg-dash-bg'}`}>Blocked</button>
                  <button type="button" onClick={() => setEditStatus('RETIRED')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${editStatus === 'RETIRED' ? 'bg-gray-500 text-white shadow-sm' : 'text-dash-muted hover:bg-dash-bg'}`}>Retired</button>
                </div>
              </div>

              {/* FIRMWARE */}
              <div className="space-y-2">
                <Label>Firmware Version</Label>
                <Input value={editFirmware} onChange={(e) => setEditFirmware(e.target.value)} className="border-dash-border" placeholder="e.g. 1.0.0" />
              </div>

              {/* VEHICLE PAIRING */}
              <div className="space-y-3 pt-4 border-t border-dash-border">
                <Label>Assigned Vehicle</Label>
                <Select value={editCarId || 'unassigned'} onValueChange={(val) => setEditCarId(val === 'unassigned' ? '' : val)}>
                  <SelectTrigger className="border-dash-border focus:ring-dash-purple/20">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned" className="text-dash-danger font-medium">Unassigned (Unpair)</SelectItem>
                    {cars?.map((c) => (
                      <SelectItem key={c._id} value={c._id}>{c.matricule} — {c.marque}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editingDevice?.carId && editingDevice.carId !== editCarId && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
                    <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-tight">
                      <strong>Reassignment Warning:</strong> Changing or removing the assigned vehicle will immediately unlink this device's telemetry stream from the current car.
                    </p>
                  </div>
                )}
              </div>

            </form>
          </div>
          <div className="p-6 border-t border-dash-border bg-white sticky bottom-0 z-10 flex gap-3 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.05)]">
            <Button type="button" variant="outline" onClick={() => setEditingDevice(null)} className="flex-1 cursor-pointer">Cancel</Button>
            <Button type="submit" form="edit-device-form" disabled={updateDevice.isPending} className="flex-1 bg-dash-purple hover:bg-dash-purple/90 text-white cursor-pointer shadow-sm">
              {updateDevice.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}Save Changes
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Devices;
