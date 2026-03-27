import { useState } from 'react';
import { useCars, useCreateCar, useUpdateCar, useDeleteCar, type Car } from '@/hooks/useCars';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Search, Car as CarIcon, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const carSchema = z.object({
  matricule: z.string().min(1, 'Matricule is required'),
  marque: z.string().min(1, 'Marque is required'),
  location: z.string().optional(),
  visite_technique: z.string().optional(),
  date_assurance: z.string().optional(),
  vignette: z.string().optional(),
});

type CarFormData = z.infer<typeof carSchema>;

const healthColors: Record<string, string> = {
  OK: 'bg-dash-success/15 text-emerald-700 border-dash-success/30',
  WARN: 'bg-dash-warning/15 text-amber-700 border-dash-warning/30',
  CRITICAL: 'bg-dash-danger/15 text-red-700 border-dash-danger/30',
};

const availColors: Record<string, string> = {
  AVAILABLE: 'bg-dash-success/15 text-emerald-700 border-dash-success/30',
  RESERVED: 'bg-dash-info/15 text-blue-700 border-dash-info/30',
  IN_USE: 'bg-dash-purple/15 text-purple-700 border-dash-purple/30',
};

const Cars = () => {
  const { data: cars, isLoading, isError, refetch } = useCars();
  const createCar = useCreateCar();
  const updateCar = useUpdateCar();
  const deleteCar = useDeleteCar();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CarFormData>({
    resolver: zodResolver(carSchema),
  });

  const openCreate = () => { setEditingCar(null); reset({ matricule: '', marque: '', location: '', visite_technique: '', date_assurance: '', vignette: '' }); setModalOpen(true); };
  const openEdit = (car: Car) => {
    setEditingCar(car);
    reset({
      matricule: car.matricule,
      marque: car.marque,
      location: car.location || '',
      visite_technique: car.visite_technique ? new Date(car.visite_technique).toISOString().split('T')[0] : '',
      date_assurance: car.date_assurance ? new Date(car.date_assurance).toISOString().split('T')[0] : '',
      vignette: car.vignette ? new Date(car.vignette).toISOString().split('T')[0] : '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: CarFormData) => {
    try {
      if (editingCar) {
        await updateCar.mutateAsync({ id: editingCar._id, ...data });
        toast.success('Car updated successfully');
      } else {
        await createCar.mutateAsync(data);
        toast.success('Car created successfully');
      }
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCar.mutateAsync(deleteId);
      toast.success('Car deleted successfully');
      setDeleteId(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Delete failed');
    }
  };

  const filtered = cars?.filter(c =>
    c.matricule.toLowerCase().includes(search.toLowerCase()) ||
    c.marque.toLowerCase().includes(search.toLowerCase()) ||
    c.location.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-inter">
        <AlertCircle className="text-dash-danger mb-3" size={40} />
        <p className="text-dash-text font-medium mb-2">Failed to load cars</p>
        <Button onClick={() => refetch()} variant="outline" className="gap-2 cursor-pointer">
          <RefreshCw size={14} /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-inter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dash-muted" />
          <Input placeholder="Search cars..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 border-dash-border" />
        </div>
        <Button onClick={openCreate} className="bg-dash-purple hover:bg-dash-purple/90 text-white gap-2 cursor-pointer">
          <Plus size={16} /> Add Car
        </Button>
      </div>

      {/* Table */}
      <Card className="border-dash-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <CarIcon className="mx-auto text-dash-muted mb-3" size={40} />
              <p className="text-dash-text font-medium">No cars found</p>
              <p className="text-dash-muted text-sm mt-1">Add your first car to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Matricule</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Marque</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Location</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Health</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Availability</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Visite Technique</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((car) => (
                  <TableRow key={car._id} className="hover:bg-dash-bg/60 transition-colors cursor-pointer">
                    <TableCell className="font-medium text-dash-text">{car.matricule}</TableCell>
                    <TableCell className="text-dash-muted">{car.marque}</TableCell>
                    <TableCell className="text-dash-muted">{car.location}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] font-semibold border ${healthColors[car.healthStatus]}`}>
                        {car.healthStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] font-semibold border ${availColors[car.availability?.status]}`}>
                        {car.availability?.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-dash-muted text-xs">
                      {car.visite_technique ? new Date(car.visite_technique).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(car)} className="h-8 w-8 text-dash-muted hover:text-dash-purple cursor-pointer">
                          <Pencil size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(car._id)} className="h-8 w-8 text-dash-muted hover:text-dash-danger cursor-pointer">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-dash-muted">Showing {filtered.length} of {cars?.length || 0} cars</p>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-inter">{editingCar ? 'Edit Car' : 'Add New Car'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="matricule">Matricule *</Label>
              <Input id="matricule" {...register('matricule')} className="border-dash-border" />
              {errors.matricule && <p className="text-dash-danger text-xs">{errors.matricule.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="marque">Marque *</Label>
              <Input id="marque" {...register('marque')} className="border-dash-border" />
              {errors.marque && <p className="text-dash-danger text-xs">{errors.marque.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" {...register('location')} className="border-dash-border" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="visite_technique" className="text-xs">Visite Technique</Label>
                <Input id="visite_technique" type="date" {...register('visite_technique')} className="border-dash-border text-xs" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_assurance" className="text-xs">Assurance</Label>
                <Input id="date_assurance" type="date" {...register('date_assurance')} className="border-dash-border text-xs" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vignette" className="text-xs">Vignette</Label>
                <Input id="vignette" type="date" {...register('vignette')} className="border-dash-border text-xs" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="cursor-pointer">Cancel</Button>
              <Button type="submit" disabled={createCar.isPending || updateCar.isPending} className="bg-dash-purple hover:bg-dash-purple/90 text-white cursor-pointer">
                {(createCar.isPending || updateCar.isPending) ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                {editingCar ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Car</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this car? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-dash-danger hover:bg-dash-danger/90 cursor-pointer">
              {deleteCar.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Cars;
