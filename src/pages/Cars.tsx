import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCars, useCreateCar, useUpdateCar, useDeleteCar, useUpdateCarStatus, type Car } from '@/hooks/useCars';
import { useDeviceStatuses } from '@/hooks/useDevices';
import { useCarBookings, type Booking } from '@/hooks/useBookings';
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Pencil, Trash2, Search, Car as CarIcon, AlertCircle, Loader2, RefreshCw, Upload, X, Wifi, WifiOff, Eye, ChevronDown } from 'lucide-react';
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
  AVAILABLE: 'bg-dash-success/15 text-emerald-700 border-dash-success/30 hover:bg-dash-success/25',
  RESERVED: 'bg-dash-info/15 text-blue-700 border-dash-info/30 hover:bg-dash-info/25',
  IN_USE: 'bg-dash-purple/15 text-purple-700 border-dash-purple/30 hover:bg-dash-purple/25',
  MAINTENANCE: 'bg-dash-warning/15 text-amber-700 border-dash-warning/30 hover:bg-dash-warning/25',
};

const statusLabels: Record<string, string> = {
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  IN_USE: 'RENTED',
  MAINTENANCE: 'MAINTENANCE',
};

const Cars = () => {
  const location = useLocation();
  const { data: cars, isLoading, isError, refetch } = useCars();
  const { data: deviceStatuses } = useDeviceStatuses();
  const createCar = useCreateCar();
  const updateCar = useUpdateCar();
  const deleteCar = useDeleteCar();
  const updateCarStatus = useUpdateCarStatus();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cityRestriction, setCityRestriction] = useState(false);
  const [allowedCities, setAllowedCities] = useState<string[]>([]);
  const [cityInput, setCityInput] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState<string>('AVAILABLE');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CarFormData>({
    resolver: zodResolver(carSchema),
  });

  useEffect(() => {
    if (location.state?.openCarId && cars?.length) {
      const car = cars.find(c => c._id === location.state.openCarId);
      if (car) {
        setSelectedCar(car);
        window.history.replaceState({}, document.title); // clear state
      }
    }
  }, [location.state, cars]);

  const openCreate = () => {
    setEditingCar(null);
    reset({ matricule: '', marque: '', location: '', visite_technique: '', date_assurance: '', vignette: '', description: '', deviceId: '' });
    setPhotoFile(null);
    setPhotoPreview(null);
    setCityRestriction(false);
    setAllowedCities([]);
    setCityInput('');
    setAvailabilityStatus('AVAILABLE');
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
    setAvailabilityStatus(car.availability?.status || 'AVAILABLE');
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
        if (availabilityStatus !== editingCar.availability?.status) {
          await updateCarStatus.mutateAsync({ id: editingCar._id, status: availabilityStatus });
        }
        toast.success('Car updated successfully');
      } else {
        const newCar = await createCar.mutateAsync(formData);
        if (availabilityStatus !== 'AVAILABLE' && newCar && newCar._id) {
          await updateCarStatus.mutateAsync({ id: newCar._id, status: availabilityStatus });
        }
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

  const handleStatusChange = async (carId: string, nextStatus: string) => {
    if (updatingStatusId) return;
    
    setUpdatingStatusId(carId);
    try {
      await updateCarStatus.mutateAsync({ id: carId, status: nextStatus });
      toast.success(`Status updated to ${statusLabels[nextStatus] || nextStatus}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to update status');
    } finally {
      setUpdatingStatusId(null);
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
                        <img src={car.photo.startsWith('http') ? car.photo : `${import.meta.env.VITE_CAR_SERVICE_URL || 'http://localhost:6002'}${car.photo}`} alt={car.marque} className="w-10 h-8 object-cover rounded" />
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
                      <DropdownMenu>
                        <DropdownMenuTrigger disabled={updatingStatusId === car._id} className={`focus:outline-none focus:ring-2 focus:ring-dash-purple focus:ring-offset-1 rounded-full group flex items-center ${updatingStatusId === car._id ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}>
                          <Badge variant="outline" className={`text-[10px] font-semibold border min-w-[100px] justify-between transition-colors ${availColors[car.availability?.status || 'AVAILABLE']}`}>
                            {updatingStatusId === car._id ? (
                              <Loader2 size={12} className="animate-spin mx-auto" />
                            ) : (
                              <div className="flex items-center justify-between w-full">
                                <span>{statusLabels[car.availability?.status || 'AVAILABLE'] || car.availability?.status}</span>
                                <ChevronDown size={12} className="opacity-50 group-data-[state=open]:rotate-180 transition-transform" />
                              </div>
                            )}
                          </Badge>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[160px] p-1 font-inter rounded-xl shadow-lg border-dash-border">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(car._id, 'AVAILABLE') }} className="justify-between text-xs cursor-pointer rounded-lg mb-1">
                            <div className="flex items-center gap-2">
                              {car.availability?.status === 'AVAILABLE' ? <span className="font-bold">✓ Available</span> : <span className="pl-4 text-dash-muted">Available</span>}
                            </div>
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(car._id, 'IN_USE') }} className="justify-between text-xs cursor-pointer rounded-lg mb-1">
                            <div className="flex items-center gap-2">
                              {car.availability?.status === 'IN_USE' ? <span className="font-bold">✓ Rented</span> : <span className="pl-4 text-dash-muted">Rented</span>}
                            </div>
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(car._id, 'MAINTENANCE') }} className="justify-between text-xs cursor-pointer rounded-lg">
                            <div className="flex items-center gap-2">
                              {car.availability?.status === 'MAINTENANCE' ? <span className="font-bold">✓ Maintenance</span> : <span className="pl-4 text-dash-muted">Maintenance</span>}
                            </div>
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                        <Button variant="ghost" size="icon" onClick={() => setSelectedCar(car)} className="h-8 w-8 text-dash-muted hover:text-dash-purple cursor-pointer">
                          <Eye size={14} />
                        </Button>
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

      {/* Add/Edit Drawer */}
      <Sheet open={modalOpen} onOpenChange={setModalOpen}>
        <SheetContent className="w-full sm:max-w-[520px] p-0 flex flex-col font-inter bg-dash-bg">
          <SheetHeader className="px-6 py-4 border-b border-dash-border">
            <SheetTitle>{editingCar ? 'Edit Car' : 'Add New Car'}</SheetTitle>
            {editingCar && <p className="text-xs text-dash-muted mt-1">{editingCar.marque} {(editingCar as any).model || ''} · {editingCar.matricule}</p>}
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <form id="car-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              
              {/* SECTION 1 */}
              <div className="space-y-4">
                <div className="flex items-center pb-2 border-b border-dash-border">
                  <h3 className="text-sm font-semibold text-dash-text">Section 1 &mdash; Basic Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="marque">Marque / Brand <span className="text-red-500">*</span></Label>
                    <Input id="marque" {...register('marque')} className="border-dash-border focus:border-dash-purple focus:ring-dash-purple/20 transition-all" />
                    {errors.marque && <p className="text-dash-danger text-xs">{errors.marque.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="matricule">Matricule <span className="text-red-500">*</span></Label>
                    <Input id="matricule" {...register('matricule')} onChange={(e) => { e.target.value = e.target.value.toUpperCase(); return e; }} className="border-dash-border focus:border-dash-purple focus:ring-dash-purple/20 transition-all uppercase" />
                    {errors.matricule && <p className="text-dash-danger text-xs">{errors.matricule.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    {...register('description')}
                    placeholder="Enter a description visible to users..."
                    className="w-full min-h-[100px] p-3 rounded-lg border border-dash-border bg-dash-bg text-sm text-dash-text resize-none focus:outline-none focus:border-dash-purple focus:ring-1 focus:ring-dash-purple/20 transition-all"
                  />
                </div>
              </div>

              {/* SECTION 2 */}
              <div className="space-y-4">
                <div className="flex items-center pb-2 border-b border-dash-border">
                  <h3 className="text-sm font-semibold text-dash-text">Section 2 &mdash; Status & Location</h3>
                </div>
                <div className="space-y-2">
                  <Label>Availability Status</Label>
                  <div className="flex w-full rounded-lg overflow-hidden border border-dash-border gap-1 p-1 bg-dash-bg bg-opacity-50">
                    <button type="button" onClick={() => setAvailabilityStatus('AVAILABLE')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${availabilityStatus === 'AVAILABLE' ? 'bg-emerald-500 text-white shadow-sm' : 'text-dash-muted hover:bg-dash-bg'}`}>🟢 Available</button>
                    <button type="button" onClick={() => setAvailabilityStatus('IN_USE')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${availabilityStatus === 'IN_USE' ? 'bg-amber-500 text-white shadow-sm' : 'text-dash-muted hover:bg-dash-bg'}`}>🟠 Rented</button>
                    <button type="button" onClick={() => setAvailabilityStatus('MAINTENANCE')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${availabilityStatus === 'MAINTENANCE' ? 'bg-red-500 text-white shadow-sm' : 'text-dash-muted hover:bg-dash-bg'}`}>🔴 Maintenance</button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location / City <span className="text-red-500">*</span></Label>
                  <Input id="location" {...register('location')} placeholder="e.g. Tunis, Monastir, Sfax" className="border-dash-border focus:border-dash-purple focus:ring-dash-purple/20" />
                </div>
                <div className="border border-dash-border rounded-xl p-4 space-y-3 bg-white/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-dash-text">Restrict to specific cities</p>
                      <p className="text-xs text-dash-muted">Prevents booking if destination is outside allowed cities</p>
                    </div>
                    <Switch checked={cityRestriction} onCheckedChange={setCityRestriction} className="cursor-pointer" />
                  </div>
                  {cityRestriction && (
                    <div className="space-y-2 mt-2 pt-2 border-t border-dash-border">
                      <Label>Allowed Cities</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type city and press Enter..."
                          value={cityInput}
                          onChange={(e) => setCityInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCity(); } }}
                          className="border-dash-border text-sm focus:border-dash-purple focus:ring-dash-purple/20"
                        />
                        <Button type="button" variant="outline" onClick={addCity} size="sm" className="cursor-pointer">Add</Button>
                      </div>
                      {allowedCities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {allowedCities.map((city) => (
                            <Badge key={city} variant="outline" className="text-xs gap-1 border-dash-border bg-dash-bg">
                              {city}
                              <button type="button" onClick={() => removeCity(city)} className="hover:text-dash-danger cursor-pointer ml-1">
                                <X size={10} />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 3 */}
              <div className="space-y-4">
                <div className="flex items-center pb-2 border-b border-dash-border">
                  <h3 className="text-sm font-semibold text-dash-text">Section 3 &mdash; Compliance & Documents</h3>
                </div>
                
                {[
                  { field: 'visite_technique', label: 'Visite Technique' },
                  { field: 'date_assurance', label: 'Date Assurance' },
                  { field: 'vignette', label: 'Vignette' }
                ].map((item) => {
                  const currentValue = editingCar ? (editingCar as any)[item.field] : null;
                  const daysDiff = currentValue ? Math.ceil((new Date(currentValue).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : null;
                  return (
                    <div key={item.field} className="space-y-1 mt-3">
                      <Label htmlFor={item.field} className="text-sm">{item.label} <span className="text-red-500">*</span></Label>
                      <Input id={item.field} type="date" {...register(item.field as 'visite_technique'|'date_assurance'|'vignette')} className="border-dash-border text-sm focus:border-dash-purple focus:ring-dash-purple/20 transition-all" />
                      {currentValue && (
                        <div className="text-[11px] mt-1 space-y-1">
                          <p className="text-dash-muted">Currently: {new Date(currentValue).toLocaleDateString()}</p>
                          {daysDiff !== null && daysDiff <= 0 && <div className="bg-red-500/10 text-red-600 px-2 py-1 rounded-sm border border-red-500/20">🔴 Expired &mdash; update immediately</div>}
                          {daysDiff !== null && daysDiff > 0 && daysDiff <= 30 && <div className="bg-amber-500/10 text-amber-600 px-2 py-1 rounded-sm border border-amber-500/20">🟡 Expires in {daysDiff} days &mdash; renew soon</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* SECTION 4 */}
              <div className="space-y-4">
                <div className="flex items-center pb-2 border-b border-dash-border">
                  <h3 className="text-sm font-semibold text-dash-text">Section 4 &mdash; Car Photo</h3>
                </div>
                <div className="space-y-3">
                  {photoPreview ? (
                    <div className="flex flex-col gap-2">
                       <img src={photoPreview.startsWith('http') || photoPreview.startsWith('blob') || photoPreview.startsWith('data') ? photoPreview : `${import.meta.env.VITE_CAR_SERVICE_URL || 'http://localhost:6002'}${photoPreview}`} alt="Preview" className="w-[160px] h-[120px] object-cover rounded-xl border border-dash-border" />
                       <div className="flex gap-3">
                         <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" />
                         <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="cursor-pointer text-xs h-8">Change Photo</Button>
                         <Button type="button" variant="ghost" size="sm" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} className="cursor-pointer text-xs h-8 text-dash-danger hover:text-red-800 hover:bg-red-50">Remove Photo</Button>
                       </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-dash-border rounded-xl p-8 flex flex-col items-center justify-center bg-dash-bg text-dash-muted hover:bg-dash-border/30 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                       <CarIcon size={32} className="mb-2 opacity-50" />
                       <p className="text-sm font-medium">Click to upload or drag & drop</p>
                       <p className="text-xs">SVG, PNG, JPG or WEBP (max 5MB)</p>
                       <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" />
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 5 */}
              <div className="space-y-4">
                <div className="flex items-center pb-2 border-b border-dash-border">
                  <h3 className="text-sm font-semibold text-dash-text">Section 5 &mdash; Linked Device <span className="text-xs font-normal text-dash-muted ml-2">(read-only)</span></h3>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-dash-border">
                   {editingCar && editingCar.deviceId ? (
                     <div className="space-y-2">
                       <div className="flex justify-between items-center">
                          <span className="text-sm text-dash-muted">Device ID:</span>
                          <span className="text-sm font-mono text-dash-text bg-gray-200 px-2 py-0.5 rounded">{editingCar.deviceId}</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-sm text-dash-muted">Status:</span>
                          <span className="text-xs font-medium text-emerald-600 flex items-center gap-1"><Wifi size={12}/> Connected</span>
                       </div>
                       <p className="text-[10px] text-dash-muted pt-2 border-t border-dash-border/50">Device assignment is managed from the Devices page.</p>
                     </div>
                   ) : (
                     <div className="text-center py-2 space-y-1">
                       <p className="text-sm text-dash-muted">No device linked to this car</p>
                       <p className="text-xs text-dash-purple hover:underline cursor-pointer">→ Go to Devices to link one</p>
                     </div>
                   )}
                </div>
              </div>

            </form>
          </div>
          
          <div className="px-6 py-4 border-t border-dash-border bg-dash-bg flex justify-end gap-3 z-10">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="cursor-pointer border-dash-border">Cancel</Button>
            <Button type="submit" form="car-form" disabled={createCar.isPending || updateCar.isPending} className="bg-dash-purple hover:bg-dash-purple/90 text-white cursor-pointer transition-all shadow-sm">
              {(createCar.isPending || updateCar.isPending) ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        </SheetContent>
      </Sheet>

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

      {/* Car Detail Drawer */}
      <Sheet open={!!selectedCar} onOpenChange={() => setSelectedCar(null)}>
        <SheetContent className="w-full sm:max-w-[520px] p-0 flex flex-col font-inter bg-dash-bg">
          {selectedCar && <CarDetailContent 
            car={selectedCar} 
            deviceStatuses={deviceStatuses || []} 
            onEdit={() => { 
               openEdit(selectedCar);
               setSelectedCar(null);
            }}
          />}
        </SheetContent>
      </Sheet>
    </div>
  );
};

const bookingStatusColors: Record<string, string> = {
  PENDING: 'bg-dash-warning/15 text-amber-700',
  CONFIRMED: 'bg-dash-info/15 text-blue-700',
  ACTIVE: 'bg-dash-success/15 text-emerald-700',
  COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-dash-danger/15 text-red-700',
  EXPIRED: 'bg-gray-100 text-gray-500',
};

function CarDetailContent({ car, deviceStatuses, onEdit }: { car: Car; deviceStatuses: any[]; onEdit: () => void; }) {
  const { data: bookings, isLoading: bookingsLoading } = useCarBookings(car._id);
  const device = deviceStatuses.find(d => d.deviceId === car.deviceId);

  const isTechniqueValid = car.visite_technique && new Date(car.visite_technique) > new Date();
  const isAssuranceValid = car.date_assurance && new Date(car.date_assurance) > new Date();
  const isVignetteValid = car.vignette && new Date(car.vignette) > new Date();

  // Calculate days remaining
  const calcDays = (dateStr: string | undefined) => {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
  };
  const tecDays = calcDays(car.visite_technique);
  const assDays = calcDays(car.date_assurance);
  const vigDays = calcDays(car.vignette);

  const activeBooking = bookings?.find((b: any) => b.status === 'ACTIVE' || b.status === 'CONFIRMED');

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        {/* HEADER (Full Width Photo) */}
        <div className="relative w-full h-[200px] bg-dash-border/30 shrink-0">
          {car.photo ? (
            <img src={car.photo.startsWith('http') || car.photo.startsWith('blob') || car.photo.startsWith('data') ? car.photo : `${import.meta.env.VITE_CAR_SERVICE_URL || 'http://localhost:6002'}${car.photo}`} alt="Car" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-dash-bg text-dash-muted">
              <CarIcon size={48} className="opacity-20" />
            </div>
          )}
          {/* Overlay Gradients & Text */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-between p-6">
            <h2 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">
              {car.marque} {(car as any).model || ''}
            </h2>
            <Badge className={`font-semibold border shadow-sm ${availColors[car.availability?.status || 'AVAILABLE']}`}>
              {statusLabels[car.availability?.status || 'AVAILABLE'] || car.availability?.status}
            </Badge>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-8 -mt-2">
          {/* Identifiers */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold bg-dash-purple/10 text-dash-purple px-2 py-1 rounded shadow-sm border border-dash-purple/20">
              {car.matricule}
            </span>
            <span className="text-xs text-dash-muted px-2 py-1 bg-white border border-dash-border rounded shadow-sm">{(car as any).year || 'N/A'}</span>
          </div>

           {/* SECTION 1 - Basic Info */}
           <div className="space-y-3">
             <h3 className="text-xs font-semibold uppercase tracking-wider text-dash-muted border-b border-dash-border pb-1">Basic Information</h3>
             <div className="grid grid-cols-2 gap-y-3 text-sm">
               <div>
                  <p className="text-dash-muted text-xs">Color</p>
                  <p className="font-medium text-dash-text">{(car as any).color || '—'}</p>
               </div>
             </div>
             <div>
               <p className="text-dash-muted text-xs mb-1">Description</p>
               <p className="text-sm text-dash-text leading-relaxed bg-white border border-dash-border p-3 rounded-xl shadow-sm">{car.description || 'No description provided.'}</p>
             </div>
           </div>

           {/* SECTION 2 - Status & Location */}
           <div className="space-y-3">
             <h3 className="text-xs font-semibold uppercase tracking-wider text-dash-muted border-b border-dash-border pb-1">Status & Location</h3>
             <div className="grid grid-cols-2 gap-4 text-sm bg-white p-4 rounded-xl shadow-sm border border-dash-border">
               <div>
                  <p className="text-dash-muted text-xs">Location / City</p>
                  <p className="font-medium text-dash-text">{car.location || '—'}</p>
               </div>
               <div>
                  <p className="text-dash-muted text-xs">City Restriction</p>
                  {car.cityRestriction && car.allowedCities && car.allowedCities.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {car.allowedCities.map((city) => <Badge key={city} variant="outline" className="text-[10px] bg-dash-bg">{city}</Badge>)}
                    </div>
                  ) : <p className="font-medium text-dash-text mt-1">None</p>}
               </div>
             </div>
           </div>

           {/* SECTION 3 - Compliance Traffic Light */}
           <div className="space-y-3">
             <h3 className="text-xs font-semibold uppercase tracking-wider text-dash-muted border-b border-dash-border pb-1">Compliance</h3>
             <div className="space-y-2 bg-white rounded-xl p-2 shadow-sm border border-dash-border">
                {[
                  { name: 'Visite Technique', date: car.visite_technique, days: tecDays },
                  { name: 'Assurance', date: car.date_assurance, days: assDays },
                  { name: 'Vignette', date: car.vignette, days: vigDays },
                ].map(doc => (
                  <div key={doc.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-dash-bg/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-dash-text">{doc.name}</p>
                      <p className="text-xs text-dash-muted">{doc.date ? new Date(doc.date).toLocaleDateString() : 'Missing'}</p>
                    </div>
                    {doc.days === null ? (
                      <Badge variant="outline" className="text-[10px] border-dash-border text-dash-muted bg-dash-bg">MISSING</Badge>
                    ) : doc.days <= 0 ? (
                      <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-700 bg-red-500/10">EXPIRED</Badge>
                    ) : doc.days <= 30 ? (
                      <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-700 bg-amber-500/10">EXP. {doc.days}d</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-700 bg-emerald-500/10">VALID</Badge>
                    )}
                  </div>
                ))}
             </div>
           </div>

           {/* SECTION 4 - Linked Device */}
           <div className="space-y-3">
             <h3 className="text-xs font-semibold uppercase tracking-wider text-dash-muted border-b border-dash-border pb-1">Linked Device</h3>
             {car.deviceId ? (
               <div className="bg-gray-50 border border-dash-border p-4 rounded-xl shadow-sm space-y-3">
                 <div className="flex items-center justify-between">
                   <div className="space-y-1">
                     <p className="text-[10px] uppercase tracking-wider text-dash-muted">Hardware ID</p>
                     <p className="font-mono text-xs font-medium text-dash-text">{car.deviceId}</p>
                   </div>
                   {device?.isConnected ? 
                     <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded shadow-sm border border-emerald-100"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span> Connected</span> :
                     <span className="flex items-center gap-1.5 text-xs font-medium text-dash-danger bg-red-50 px-2 py-1 rounded shadow-sm border border-red-100"><span className="w-2 h-2 rounded-full bg-dash-danger"></span> Offline</span>
                   }
                 </div>
                 {/* Mock telemetry chips */}
                 <div className="flex gap-2 pt-2 border-t border-dash-border/50">
                    <span className="text-[10px] bg-white border border-dash-border px-2 py-0.5 rounded shadow-sm text-dash-muted">Speed: 0 km/h</span>
                    <span className="text-[10px] bg-white border border-dash-border px-2 py-0.5 rounded shadow-sm text-dash-muted">RPM: 0</span>
                    <span className="text-[10px] bg-white border border-dash-border px-2 py-0.5 rounded shadow-sm text-dash-muted">Temp: 90°C</span>
                 </div>
               </div>
             ) : (
               <div className="bg-white border border-dash-border p-4 rounded-xl text-center shadow-sm">
                 <p className="text-xs text-dash-muted">No device linked to this car.</p>
               </div>
             )}
           </div>

           {/* SECTION 5 - Active Booking */}
           {car.availability?.status === 'IN_USE' && activeBooking && (
             <div className="space-y-3">
               <h3 className="text-xs font-semibold uppercase tracking-wider text-dash-muted border-b border-dash-border pb-1">Active Booking</h3>
               <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl shadow-sm space-y-3 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100 rounded-bl-full -mr-8 -mt-8 opacity-50 pointer-events-none"></div>
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-dash-purple/10 flex items-center justify-center text-dash-purple font-bold text-xs">{(activeBooking as any).userName?.charAt(0) || '?'}</div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-dash-text">{(activeBooking as any).userName || 'Unknown User'}</p>
                      <p className="text-xs text-dash-muted">{new Date(activeBooking.startDate).toLocaleDateString()} &rarr; {new Date(activeBooking.endDate).toLocaleDateString()}</p>
                    </div>
                    <Badge className={bookingStatusColors[activeBooking.status]}>{activeBooking.status}</Badge>
                 </div>
               </div>
             </div>
           )}

           {/* SECTION 6 - Booking History */}
           <div className="space-y-3">
             <h3 className="text-xs font-semibold uppercase tracking-wider text-dash-muted border-b border-dash-border pb-1">Booking History</h3>
             {bookingsLoading ? (
               <div className="space-y-2">{[...Array(2)].map((_, idx) => <Skeleton key={idx} className="h-10 w-full rounded-xl" />)}</div>
             ) : bookings && bookings.length > 0 ? (
               <div className="bg-white border border-dash-border rounded-xl shadow-sm overflow-hidden">
                 <Table>
                   <TableBody>
                     {bookings.slice(0, 5).map((b: any) => (
                       <TableRow key={b._id} className="hover:bg-dash-bg/50">
                         <TableCell className="py-2 px-3">
                           <p className="text-xs font-medium text-dash-text">{b.userName || 'User'}</p>
                           <p className="text-[10px] text-dash-muted">{new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}</p>
                         </TableCell>
                         <TableCell className="py-2 px-3 text-right">
                           <Badge variant="outline" className={`text-[9px] ${bookingStatusColors[b.status]}`}>{b.status}</Badge>
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </div>
             ) : (
               <p className="text-xs text-dash-muted text-center py-4 bg-white border border-dash-border rounded-xl shadow-sm">No booking history yet.</p>
             )}
           </div>
        </div>
      </div>
      
      {/* FOOTER */}
      <div className="px-6 py-4 border-t border-dash-border bg-white flex justify-end gap-3 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <Button variant="outline" onClick={onEdit} className="cursor-pointer font-medium bg-white hover:bg-dash-bg text-dash-text border-dash-border">
          <Pencil size={14} className="mr-2" /> Edit Car
        </Button>
      </div>
    </>
  );
}

export default Cars;
