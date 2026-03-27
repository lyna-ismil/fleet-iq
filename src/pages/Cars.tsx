import { useState, useRef } from 'react';
import { useCars, useCreateCar, useUpdateCar, useDeleteCar, type Car } from '@/hooks/useCars';
import { useDeviceStatuses } from '@/hooks/useDevices';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Search, Car as CarIcon, AlertCircle, Loader2, RefreshCw, Upload, X, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

const carSchema = z.object({
  matricule: z.string().min(1, 'Matricule is required'),
  marque: z.string().min(1, 'Marque is required'),
  location: z.string().optional(),
  visite_technique: z.string().optional(),
  date_assurance: z.string().optional(),
  vignette: z.string().optional(),
  description: z.string().optional(),
  deviceId: z.string().optional(),
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
  const { data: deviceStatuses } = useDeviceStatuses();
  const createCar = useCreateCar();
  const updateCar = useUpdateCar();
  const deleteCar = useDeleteCar();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cityRestriction, setCityRestriction] = useState(false);
  const [allowedCities, setAllowedCities] = useState<string[]>([]);
  const [cityInput, setCityInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CarFormData>({
    resolver: zodResolver(carSchema),
  });

  const openCreate = () => {
    setEditingCar(null);
    reset({ matricule: '', marque: '', location: '', visite_technique: '', date_assurance: '', vignette: '', description: '', deviceId: '' });
    setPhotoFile(null);
    setPhotoPreview(null);
    setCityRestriction(false);
    setAllowedCities([]);
    setCityInput('');
    setModalOpen(true);
  };

  const openEdit = (car: Car) => {
    setEditingCar(car);
    reset({
      matricule: car.matricule,
      marque: car.marque,
      location: car.location || '',
      visite_technique: car.visite_technique ? new Date(car.visite_technique).toISOString().split('T')[0] : '',
      date_assurance: car.date_assurance ? new Date(car.date_assurance).toISOString().split('T')[0] : '',
      vignette: car.vignette ? new Date(car.vignette).toISOString().split('T')[0] : '',
      description: car.description || '',
      deviceId: car.deviceId || '',
    });
    setPhotoFile(null);
    setPhotoPreview(car.photo || null);
    setCityRestriction(car.cityRestriction || false);
    setAllowedCities(car.allowedCities || []);
    setCityInput('');
    setModalOpen(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const addCity = () => {
    const city = cityInput.trim();
    if (city && !allowedCities.includes(city)) {
      setAllowedCities([...allowedCities, city]);
      setCityInput('');
    }
  };

  const removeCity = (city: string) => {
    setAllowedCities(allowedCities.filter(c => c !== city));
  };

  const onSubmit = async (data: CarFormData) => {
    try {
      const formData = new FormData();
      formData.append('matricule', data.matricule);
      formData.append('marque', data.marque);
      if (data.location) formData.append('location', data.location);
      if (data.visite_technique) formData.append('visite_technique', data.visite_technique);
      if (data.date_assurance) formData.append('date_assurance', data.date_assurance);
      if (data.vignette) formData.append('vignette', data.vignette);
      if (data.description) formData.append('description', data.description);
      if (data.deviceId) formData.append('deviceId', data.deviceId);
      formData.append('cityRestriction', String(cityRestriction));
      formData.append('allowedCities', JSON.stringify(allowedCities));
      if (photoFile) formData.append('photo', photoFile);

      if (editingCar) {
        await updateCar.mutateAsync({ id: editingCar._id, formData });
        toast.success('Car updated successfully');
      } else {
        await createCar.mutateAsync(formData);
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
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Photo</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Matricule</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Marque</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Location</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Health</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Availability</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Device</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Visite Technique</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((car) => (
                  <TableRow key={car._id} className="hover:bg-dash-bg/60 transition-colors cursor-pointer">
                    <TableCell>
                      {car.photo ? (
                        <img src={car.photo.startsWith('http') ? car.photo : `http://localhost:6002${car.photo}`} alt={car.marque} className="w-10 h-8 object-cover rounded" />
                      ) : (
                        <div className="w-10 h-8 bg-dash-bg rounded flex items-center justify-center">
                          <CarIcon size={14} className="text-dash-muted" />
                        </div>
                      )}
                    </TableCell>
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
                    <TableCell>
                      {car.deviceId ? (
                        (() => {
                          const ds = deviceStatuses?.find(d => d.deviceId === car.deviceId);
                          if (!ds) return <Badge variant="outline" className="text-[10px] font-semibold border bg-gray-100 text-gray-500 border-gray-200">UNKNOWN</Badge>;
                          return ds.isConnected ? (
                            <Badge variant="outline" className="text-[10px] font-semibold border bg-emerald-500/15 text-emerald-700 border-emerald-500/30 gap-1"><Wifi size={10} /> Connected</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] font-semibold border bg-red-500/15 text-red-700 border-red-500/30 gap-1"><WifiOff size={10} /> Disconnected</Badge>
                          );
                        })()
                      ) : (
                        <span className="text-xs flex items-center gap-1 text-dash-muted italic">No device</span>
                      )}
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
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-inter">{editingCar ? 'Edit Car' : 'Add New Car'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
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
            </div>
            {/* Photo Upload */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" {...register('location')} className="border-dash-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deviceId">Device ID (Optional)</Label>
                <Input id="deviceId" {...register('deviceId')} className="border-dash-border" placeholder="e.g. 5f8d..." />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Photo</Label>
              <div className="flex items-center gap-3">
                {photoPreview && (
                  <img src={photoPreview.startsWith('http') || photoPreview.startsWith('blob') ? photoPreview : `http://localhost:6002${photoPreview}`} alt="Preview" className="w-20 h-14 object-cover rounded-lg border border-dash-border" />
                )}
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2 cursor-pointer">
                  <Upload size={14} /> {photoFile ? 'Change Photo' : 'Upload Photo'}
                </Button>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                {...register('description')}
                placeholder="Add a description for this car..."
                className="w-full min-h-[70px] p-3 rounded-lg border border-dash-border bg-transparent text-sm text-dash-text resize-none focus:outline-none focus:ring-1 focus:ring-dash-purple"
              />
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

            {/* City Restriction */}
            <div className="border border-dash-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-dash-text">City Restriction</p>
                  <p className="text-xs text-dash-muted">Restrict this car to specific cities</p>
                </div>
                <Switch checked={cityRestriction} onCheckedChange={setCityRestriction} className="cursor-pointer" />
              </div>
              {cityRestriction && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a city..."
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCity(); } }}
                      className="border-dash-border text-sm"
                    />
                    <Button type="button" variant="outline" onClick={addCity} size="sm" className="cursor-pointer">Add</Button>
                  </div>
                  {allowedCities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {allowedCities.map((city) => (
                        <Badge key={city} variant="outline" className="text-xs gap-1 border-dash-border">
                          {city}
                          <button type="button" onClick={() => removeCity(city)} className="hover:text-dash-danger cursor-pointer">
                            <X size={10} />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
