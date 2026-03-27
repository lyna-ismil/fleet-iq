import { useState } from 'react';
import { useDevices, useRegisterDevice, usePairDevice, useDeleteDevice, type Device } from '@/hooks/useDevices';
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Cpu, AlertCircle, RefreshCw, Link2, Trash2, Loader2 } from 'lucide-react';
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
  const registerDevice = useRegisterDevice();
  const pairDevice = usePairDevice();
  const deleteDevice = useDeleteDevice();

  const [search, setSearch] = useState('');
  const [registerOpen, setRegisterOpen] = useState(false);
  const [pairModal, setPairModal] = useState<{ deviceId: string } | null>(null);
  const [pairCarId, setPairCarId] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
                {filtered.map((d) => (
                  <TableRow key={d._id} className="hover:bg-dash-bg/60 transition-colors">
                    <TableCell className="font-medium text-dash-text text-sm">{d.serialNumber}</TableCell>
                    <TableCell className="text-xs text-dash-muted">{d.carId ? (cars?.find(c => c._id === d.carId) ? `${cars.find(c => c._id === d.carId)!.marque} — ${cars.find(c => c._id === d.carId)!.matricule}` : d.carId.slice(-8)) : '—'}</TableCell>
                    <TableCell><Badge variant="outline" className={`text-[10px] font-semibold border ${statusColors[d.status]}`}>{d.status}</Badge></TableCell>
                    <TableCell className="text-xs text-dash-muted">{d.firmwareVersion || '—'}</TableCell>
                    <TableCell className="text-xs text-dash-muted">{new Date(d.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setPairModal({ deviceId: d._id }); setPairCarId(''); }} className="h-8 w-8 text-dash-muted hover:text-dash-info cursor-pointer"><Link2 size={14} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(d._id)} className="h-8 w-8 text-dash-muted hover:text-dash-danger cursor-pointer"><Trash2 size={14} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
    </div>
  );
};

export default Devices;
