import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookings, useConfirmBooking, useCancelBooking, useUpdateBooking, useDeleteBooking, useCreateBooking, type Booking } from '@/hooks/useBookings';
import { useUsers } from '@/hooks/useUsers';
import { useCars } from '@/hooks/useCars';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, CalendarCheck, AlertCircle, RefreshCw, Eye, Check, X, Loader2, Pencil, Trash2, User as UserIcon, Upload, ImageIcon, Plus } from 'lucide-react';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  PENDING: 'bg-dash-warning/15 text-amber-700 border-dash-warning/30',
  CONFIRMED: 'bg-dash-info/15 text-blue-700 border-dash-info/30',
  ACTIVE: 'bg-dash-success/15 text-emerald-700 border-dash-success/30',
  COMPLETED: 'bg-gray-100 text-gray-600 border-gray-200',
  CANCELLED: 'bg-dash-danger/15 text-red-700 border-dash-danger/30',
  EXPIRED: 'bg-gray-100 text-gray-500 border-gray-200',
};

const paymentColors: Record<string, string> = {
  UNPAID: 'bg-dash-warning/15 text-amber-700',
  PAID: 'bg-dash-success/15 text-emerald-700',
  FAILED: 'bg-dash-danger/15 text-red-700',
  REFUNDED: 'bg-gray-100 text-gray-600',
};

const Bookings = () => {
  const { data: bookings, isLoading, isError, refetch } = useBookings();
  const confirmBooking = useConfirmBooking();
  const cancelBooking = useCancelBooking();
  const createBooking = useCreateBooking();
  const updateBooking = useUpdateBooking();
  const deleteBooking = useDeleteBooking();
  const navigate = useNavigate();
  const { data: users } = useUsers();
  const { data: cars } = useCars();

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Booking | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'confirm' | 'cancel'; id: string } | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editData, setEditData] = useState<Partial<Booking>>({});
  const [editFile, setEditFile] = useState<File | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('UNPAID');

  // Create Booking state
  const [createOpen, setCreateOpen] = useState(false);
  const [createUserId, setCreateUserId] = useState('');
  const [createCarId, setCreateCarId] = useState('');
  const [createStartDate, setCreateStartDate] = useState('');
  const [createEndDate, setCreateEndDate] = useState('');
  const [createPickup, setCreatePickup] = useState('');
  const [createDropoff, setCreateDropoff] = useState('');
  const [createAmount, setCreateAmount] = useState('');
  const [createPayment, setCreatePayment] = useState('UNPAID');
  const [createStatus, setCreateStatus] = useState('PENDING');
  const [userSearch, setUserSearch] = useState('');
  const [carSearch, setCarSearch] = useState('');

  const openCreateForm = () => {
    setCreateUserId(''); setCreateCarId(''); setCreateStartDate(''); setCreateEndDate('');
    setCreatePickup(''); setCreateDropoff(''); setCreateAmount(''); setCreatePayment('UNPAID');
    setCreateStatus('PENDING'); setUserSearch(''); setCarSearch('');
    setCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createUserId || !createCarId || !createStartDate || !createEndDate) {
      toast.error('Please fill all required fields');
      return;
    }
    if (new Date(createEndDate) <= new Date(createStartDate)) {
      toast.error('End date must be after start date');
      return;
    }
    try {
      await createBooking.mutateAsync({
        userId: createUserId,
        carId: createCarId,
        startDate: new Date(createStartDate).toISOString(),
        endDate: new Date(createEndDate).toISOString(),
        pickupLocation: createPickup || undefined,
        dropoffLocation: createDropoff || undefined,
        payment: {
          amount: createAmount ? Number(createAmount) : undefined,
          currency: 'TND',
          status: createPayment,
        },
      });
      toast.success('Booking created successfully');
      setCreateOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to create booking');
    }
  };

  const filteredUsers = users?.filter(u =>
    u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  ) || [];

  const filteredCars = cars?.filter(c =>
    c.marque.toLowerCase().includes(carSearch.toLowerCase()) ||
    c.matricule.toLowerCase().includes(carSearch.toLowerCase())
  ) || [];

  const openEdit = (b: Booking) => {
    setEditData({
      status: b.status,
      startDate: new Date(b.startDate).toISOString().slice(0, 16), // 'YYYY-MM-DDThh:mm'
      endDate: new Date(b.endDate).toISOString().slice(0, 16),
      pickupLocation: b.pickupLocation || '',
      dropoffLocation: b.dropoffLocation || ''
    });
    setPaymentStatus(b.payment?.status || 'UNPAID');
    setEditFile(null);
    setEditingBooking(b);
  };

  const filtered = bookings?.filter(b =>
    b._id.toLowerCase().includes(search.toLowerCase()) ||
    (b.user?.fullName || b.userId).toLowerCase().includes(search.toLowerCase()) ||
    (b.user?.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.car?.marque || b.carId).toLowerCase().includes(search.toLowerCase()) ||
    (b.car?.matricule || '').toLowerCase().includes(search.toLowerCase()) ||
    b.pickupLocation?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleAction = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === 'confirm') {
        await confirmBooking.mutateAsync(confirmAction.id);
        toast.success('Booking confirmed');
      } else {
        await cancelBooking.mutateAsync(confirmAction.id);
        toast.success('Booking cancelled');
      }
      setConfirmAction(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Action failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteBooking.mutateAsync(deleteId);
      toast.success('Booking deleted');
      setDeleteId(null);
    } catch {
      toast.error('Failed to delete booking');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    try {
      const formData = new FormData();
      if (editData.status) formData.append('status', editData.status);
      if (editData.startDate) formData.append('startDate', new Date(editData.startDate as string).toISOString());
      if (editData.endDate) formData.append('endDate', new Date(editData.endDate as string).toISOString());
      if (editData.pickupLocation !== undefined) formData.append('pickupLocation', editData.pickupLocation);
      if (editData.dropoffLocation !== undefined) formData.append('dropoffLocation', editData.dropoffLocation);
      if (editFile) formData.append('image', editFile);
      formData.append('payment', JSON.stringify({ status: paymentStatus }));

      await updateBooking.mutateAsync({ id: editingBooking._id, data: formData });
      toast.success('Booking updated successfully');
      setEditingBooking(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to update booking');
    }
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-inter">
        <AlertCircle className="text-dash-danger mb-3" size={40} />
        <p className="text-dash-text font-medium mb-2">Failed to load bookings</p>
        <Button onClick={() => refetch()} variant="outline" className="gap-2 cursor-pointer"><RefreshCw size={14} /> Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-inter">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dash-muted" />
          <Input placeholder="Search bookings..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 border-dash-border" />
        </div>
        <Button onClick={openCreateForm} className="bg-dash-purple hover:bg-dash-purple/90 text-white gap-2 cursor-pointer">
          <Plus size={16} /> Add Booking
        </Button>
      </div>

      <Card className="border-dash-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarCheck className="mx-auto text-dash-muted mb-3" size={40} />
              <p className="text-dash-text font-medium">No bookings found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">User</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Car</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Period</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Pickup</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Amount</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Status</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b) => (
                  <TableRow key={b._id} className="hover:bg-dash-bg/60 transition-colors">
                    <TableCell className="text-sm text-dash-text cursor-pointer hover:underline hover:text-dash-purple" onClick={() => navigate('/dashboard/users', { state: { openUserId: b.userId } })}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-dash-purple/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-dash-purple text-[10px] font-bold">{(b.user?.fullName || '?').charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="truncate max-w-[120px]">{b.user?.fullName || b.userId.slice(-6)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-dash-muted cursor-pointer hover:underline hover:text-dash-purple" onClick={() => navigate('/dashboard/cars', { state: { openCarId: b.carId } })}>
                      {b.car ? `${b.car.marque} - ${b.car.matricule}` : b.carId.slice(-6)}
                    </TableCell>
                    <TableCell className="text-xs text-dash-muted">
                      {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-xs text-dash-muted">{b.pickupLocation || '—'}</TableCell>
                    <TableCell className="text-xs text-dash-text font-medium">{b.payment?.amount ? `${b.payment.amount} ${b.payment.currency || 'TND'}` : '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] font-semibold border ${statusColors[b.status]}`}>{b.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setSelected(b)} className="h-8 w-8 text-dash-muted hover:text-dash-purple cursor-pointer"><Eye size={14} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(b)} className="h-8 w-8 text-dash-muted hover:text-dash-purple cursor-pointer"><Pencil size={14} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(b._id)} className="h-8 w-8 text-dash-muted hover:text-dash-danger cursor-pointer"><Trash2 size={14} /></Button>
                        {b.status === 'PENDING' && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => setConfirmAction({ type: 'confirm', id: b._id })} className="h-8 w-8 text-dash-muted hover:text-dash-success cursor-pointer"><Check size={14} /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setConfirmAction({ type: 'cancel', id: b._id })} className="h-8 w-8 text-dash-muted hover:text-dash-danger cursor-pointer"><X size={14} /></Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <p className="text-xs text-dash-muted">Showing {filtered.length} of {bookings?.length || 0} bookings</p>

      {/* Detail Drawer */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-[450px] sm:max-w-[450px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-inter">Booking Details</SheetTitle>
          </SheetHeader>
          {selected && (() => {
            const start = new Date(selected.startDate);
            const end = new Date(selected.endDate);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return (
              <div className="space-y-6 mt-6">
                {/* HEADER SECTION */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-dash-purple flex items-center justify-center flex-shrink-0 text-white text-xl font-bold shadow-md">
                    {(selected.user?.fullName || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col pt-1">
                    <p className="text-xl font-bold text-dash-text tracking-tight">{selected.user?.fullName || 'Unknown User'}</p>
                    <p className="text-sm text-dash-muted mb-2">{selected.user?.email || 'No email provided'}</p>
                    <div>
                      <Badge variant="outline" className={`text-xs font-semibold border px-2 py-0.5 ${statusColors[selected.status]}`}>
                        {selected.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* STATS ROW */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-dash-bg rounded-xl border border-dash-border">
                    <p className="text-xs text-dash-muted uppercase font-medium mb-1">Amount</p>
                    <p className="text-sm font-bold text-dash-text">{selected.payment?.amount || 0} {selected.payment?.currency || 'TND'}</p>
                  </div>
                  <div className="p-3 bg-dash-bg rounded-xl border border-dash-border">
                    <p className="text-xs text-dash-muted uppercase font-medium mb-1">Duration</p>
                    <p className="text-sm font-bold text-dash-text">{durationDays} days</p>
                  </div>
                  <div className="p-3 bg-dash-bg rounded-xl border border-dash-border">
                    <p className="text-xs text-dash-muted uppercase font-medium mb-1">Payment</p>
                    <Badge variant="outline" className={`text-[10px] mt-0.5 font-bold ${paymentColors[selected.payment?.status || 'UNPAID']}`}>
                      {selected.payment?.status || 'UNPAID'}
                    </Badge>
                  </div>
                </div>

                {/* DETAILS SECTION */}
                <div className="border border-dash-border rounded-xl bg-white overflow-hidden">
                  <div className="p-4 space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-dash-border">
                      <span className="text-xs text-dash-muted uppercase tracking-wide font-medium">Car</span>
                      <span 
                        className="text-sm font-bold text-dash-text cursor-pointer hover:underline hover:text-dash-purple transition-colors"
                        onClick={() => { setSelected(null); navigate('/dashboard/cars', { state: { openCarId: selected.carId } }); }}
                      >
                        {selected.car ? `${selected.car.marque} — ${selected.car.matricule}` : 'Unknown Car'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-dash-border">
                      <span className="text-xs text-dash-muted uppercase tracking-wide font-medium">Start Date</span>
                      <span className="text-sm font-bold text-dash-text">{start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} &middot; {start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-dash-border">
                      <span className="text-xs text-dash-muted uppercase tracking-wide font-medium">End Date</span>
                      <span className="text-sm font-bold text-dash-text">{end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} &middot; {end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-dash-border">
                      <span className="text-xs text-dash-muted uppercase tracking-wide font-medium">Pickup</span>
                      <span className="text-sm font-bold text-dash-text">{selected.pickupLocation || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-dash-muted uppercase tracking-wide font-medium">Dropoff</span>
                      <span className="text-sm font-bold text-dash-text">{selected.dropoffLocation || '—'}</span>
                    </div>
                  </div>
                </div>

                {selected.contractUrl && (
                  <div className="pt-2">
                    <a href={selected.contractUrl} target="_blank" rel="noopener noreferrer" className="text-dash-purple text-sm font-medium hover:underline cursor-pointer flex items-center gap-2">View Contract Document &rarr;</a>
                  </div>
                )}

                {/* ACTIONS */}
                <div className="pt-6 space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-center bg-white border-dash-border hover:bg-dash-bg text-dash-text font-medium cursor-pointer"
                    onClick={() => { openEdit(selected); setSelected(null); }}
                  >
                    <Pencil size={14} className="mr-2" /> Edit Booking
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-center border-dash-danger/30 text-dash-danger hover:bg-dash-danger/5 hover:text-dash-danger font-medium cursor-pointer"
                    onClick={() => { setDeleteId(selected._id); setSelected(null); }}
                  >
                    <Trash2 size={14} className="mr-2" /> Delete Booking
                  </Button>
                </div>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>
      {/* Confirm/Cancel Action Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.type === 'confirm' ? 'Confirm Booking' : 'Cancel Booking'}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'confirm' ? 'Are you sure you want to confirm this booking?' : 'Are you sure you want to cancel this booking? This may trigger notifications.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} className={`cursor-pointer ${confirmAction?.type === 'confirm' ? 'bg-dash-success hover:bg-dash-success/90' : 'bg-dash-danger hover:bg-dash-danger/90'}`}>
              {(confirmBooking.isPending || cancelBooking.isPending) ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              {confirmAction?.type === 'confirm' ? 'Confirm' : 'Cancel Booking'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this booking? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-dash-danger hover:bg-dash-danger/90 cursor-pointer">
              {deleteBooking.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Form Drawer */}
      <Sheet open={!!editingBooking} onOpenChange={(open) => !open && setEditingBooking(null)}>
        <SheetContent className="w-full sm:max-w-[520px] p-0 flex flex-col font-inter bg-dash-bg">
          <SheetHeader className="px-6 py-4 border-b border-dash-border">
            <SheetTitle>Edit Booking</SheetTitle>
            {editingBooking && <p className="text-xs text-dash-muted mt-1">Booking ID: {editingBooking._id}</p>}
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <form id="edit-booking-form" onSubmit={handleEditSubmit} className="space-y-6">
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Status <span className="text-red-500">*</span></Label>
                  <div className="flex w-full rounded-lg overflow-hidden border border-dash-border p-1 gap-1 bg-dash-bg bg-opacity-50">
                    <button type="button" onClick={() => setEditData({...editData, status: 'PENDING' as any})} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${editData.status === 'PENDING' ? 'bg-amber-500 text-white shadow-sm' : 'text-dash-muted hover:bg-dash-bg'}`}>Pending</button>
                    <button type="button" onClick={() => setEditData({...editData, status: 'CONFIRMED' as any})} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${editData.status === 'CONFIRMED' ? 'bg-blue-500 text-white shadow-sm' : 'text-dash-muted hover:bg-dash-bg'}`}>Confirmed</button>
                    <button type="button" onClick={() => setEditData({...editData, status: 'CANCELLED' as any})} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${editData.status === 'CANCELLED' ? 'bg-red-500 text-white shadow-sm' : 'text-dash-muted hover:bg-dash-bg'}`}>Cancelled</button>
                    <button type="button" onClick={() => setEditData({...editData, status: 'COMPLETED' as any})} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${editData.status === 'COMPLETED' ? 'bg-gray-500 text-white shadow-sm' : 'text-dash-muted hover:bg-dash-bg'}`}>Completed</button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <div className="flex rounded-lg overflow-hidden border border-dash-border p-1 gap-1 bg-dash-bg bg-opacity-50 w-full">
                     <button type="button" onClick={() => setPaymentStatus('UNPAID')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${paymentStatus === 'UNPAID' ? 'bg-amber-500 text-white shadow-sm' : 'text-dash-muted hover:bg-dash-bg'}`}>Unpaid</button>
                     <button type="button" onClick={() => setPaymentStatus('PAID')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${paymentStatus === 'PAID' ? 'bg-emerald-500 text-white shadow-sm' : 'text-dash-muted hover:bg-dash-bg'}`}>Paid</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date <span className="text-red-500">*</span></Label>
                    <Input 
                      type="datetime-local" 
                      value={editData.startDate as string} 
                      onChange={(e) => setEditData({...editData, startDate: e.target.value})} 
                      className="border-dash-border text-sm" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date <span className="text-red-500">*</span></Label>
                    <Input 
                      type="datetime-local" 
                      value={editData.endDate as string} 
                      onChange={(e) => setEditData({...editData, endDate: e.target.value})} 
                      className={`border-dash-border text-sm ${editData.startDate && editData.endDate && new Date(editData.endDate) <= new Date(editData.startDate) ? 'border-red-500 focus:ring-red-500/20' : ''}`} 
                    />
                  </div>
                </div>
                {editData.startDate && editData.endDate && (() => {
                  const s = new Date(editData.startDate);
                  const e = new Date(editData.endDate);
                  if (e <= s) {
                     return <p className="text-xs text-red-500 font-medium">⚠️ End date must be after start date</p>;
                  }
                  const diff = Math.ceil(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
                  return <p className="text-xs text-emerald-600 font-medium">Duration: {diff} day{diff !== 1 && 's'}</p>;
                })()}

                <div className="space-y-2">
                  <Label>Pickup Location</Label>
                  <Input 
                    placeholder="E.g. Tunis Airport" 
                    value={editData.pickupLocation || ''} 
                    onChange={(e) => setEditData({...editData, pickupLocation: e.target.value})} 
                    className="border-dash-border" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Dropoff Location</Label>
                  <Input 
                    placeholder="E.g. Sousse City Center" 
                    value={editData.dropoffLocation || ''} 
                    onChange={(e) => setEditData({...editData, dropoffLocation: e.target.value})} 
                    className="border-dash-border" 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contract Photo (Optional)</Label>
                  {editFile ? (
                    <div className="flex items-center justify-between p-3 border border-dash-border rounded-lg bg-white">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <ImageIcon size={16} className="text-dash-purple shrink-0" />
                        <span className="text-sm truncate max-w-[200px]">{editFile.name}</span>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setEditFile(null)} className="h-6 w-6 p-0 text-dash-danger hover:bg-red-50"><X size={14} /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <label className="flex items-center justify-center gap-2 border border-dash-border rounded-lg px-4 py-2 hover:bg-dash-bg cursor-pointer transition-colors w-full text-sm font-medium text-dash-text bg-white">
                        <Upload size={14} /> Upload Document
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && setEditFile(e.target.files[0])} />
                      </label>
                    </div>
                  )}
                  {editingBooking?.contractUrl && !editFile && (
                    <p className="text-xs text-dash-muted mt-1 text-right">Already has a document uploaded.</p>
                  )}
                </div>
              </div>

            </form>
          </div>
          <div className="px-6 py-4 border-t border-dash-border flex justify-end gap-3 bg-white">
            <Button type="button" variant="outline" onClick={() => setEditingBooking(null)} className="cursor-pointer border-dash-border">Cancel</Button>
            <Button type="submit" form="edit-booking-form" disabled={updateBooking.isPending} className="bg-dash-purple hover:bg-dash-purple/90 text-white cursor-pointer transition-all shadow-sm">
              {updateBooking.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}Save Changes
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Create Booking Drawer */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="w-full sm:max-w-[520px] p-0 flex flex-col font-inter bg-dash-bg">
          <SheetHeader className="px-6 py-4 border-b border-dash-border">
            <SheetTitle>Add New Booking</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <form id="create-booking-form" onSubmit={handleCreateSubmit} className="space-y-6">

              {/* User Dropdown */}
              <div className="space-y-2">
                <Label>User <span className="text-red-500">*</span></Label>
                <Input placeholder="Search users..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="border-dash-border text-sm mb-2" />
                <div className="max-h-[140px] overflow-y-auto border border-dash-border rounded-lg bg-white">
                  {filteredUsers.length === 0 ? (
                    <p className="text-xs text-dash-muted p-3 text-center">No users found</p>
                  ) : filteredUsers.slice(0, 20).map(u => (
                    <div
                      key={u._id}
                      onClick={() => setCreateUserId(u._id)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-dash-bg transition-colors ${createUserId === u._id ? 'bg-dash-purple/10 border-l-2 border-dash-purple' : ''}`}
                    >
                      <div className="w-6 h-6 rounded-full bg-dash-purple/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-dash-purple text-[9px] font-bold">{u.fullName?.charAt(0)?.toUpperCase()}</span>
                      </div>
                      <span className="truncate font-medium text-dash-text">{u.fullName}</span>
                      <span className="text-dash-muted text-xs truncate">— {u.email}</span>
                    </div>
                  ))}
                </div>
                {createUserId && <p className="text-xs text-emerald-600">✓ {users?.find(u => u._id === createUserId)?.fullName}</p>}
              </div>

              {/* Car Dropdown */}
              <div className="space-y-2">
                <Label>Car <span className="text-red-500">*</span></Label>
                <Input placeholder="Search cars..." value={carSearch} onChange={(e) => setCarSearch(e.target.value)} className="border-dash-border text-sm mb-2" />
                <div className="max-h-[140px] overflow-y-auto border border-dash-border rounded-lg bg-white">
                  {filteredCars.length === 0 ? (
                    <p className="text-xs text-dash-muted p-3 text-center">No cars found</p>
                  ) : filteredCars.slice(0, 20).map(c => (
                    <div
                      key={c._id}
                      onClick={() => setCreateCarId(c._id)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-dash-bg transition-colors ${createCarId === c._id ? 'bg-dash-purple/10 border-l-2 border-dash-purple' : ''}`}
                    >
                      <span className="font-medium text-dash-text">{c.marque}</span>
                      <span className="text-dash-muted text-xs">— {c.matricule}</span>
                    </div>
                  ))}
                </div>
                {createCarId && <p className="text-xs text-emerald-600">✓ {cars?.find(c => c._id === createCarId)?.marque} — {cars?.find(c => c._id === createCarId)?.matricule}</p>}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date & Time <span className="text-red-500">*</span></Label>
                  <Input type="datetime-local" value={createStartDate} onChange={(e) => setCreateStartDate(e.target.value)} className="border-dash-border text-sm" />
                </div>
                <div className="space-y-2">
                  <Label>End Date & Time <span className="text-red-500">*</span></Label>
                  <Input type="datetime-local" value={createEndDate} onChange={(e) => setCreateEndDate(e.target.value)} className={`border-dash-border text-sm ${createStartDate && createEndDate && new Date(createEndDate) <= new Date(createStartDate) ? 'border-red-500' : ''}`} />
                </div>
              </div>
              {createStartDate && createEndDate && (() => {
                const s = new Date(createStartDate);
                const e = new Date(createEndDate);
                if (e <= s) return <p className="text-xs text-red-500 font-medium">⚠️ End date must be after start date</p>;
                const diff = Math.ceil(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
                return <p className="text-xs text-emerald-600 font-medium">Duration: {diff} day{diff !== 1 && 's'}</p>;
              })()}

              {/* Locations */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pickup Location <span className="text-red-500">*</span></Label>
                  <Input placeholder="E.g. Tunis Airport" value={createPickup} onChange={(e) => setCreatePickup(e.target.value)} className="border-dash-border" />
                </div>
                <div className="space-y-2">
                  <Label>Dropoff Location <span className="text-red-500">*</span></Label>
                  <Input placeholder="E.g. Sousse Center" value={createDropoff} onChange={(e) => setCreateDropoff(e.target.value)} className="border-dash-border" />
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label>Amount (TND) <span className="text-red-500">*</span></Label>
                <Input type="number" min="0" step="0.01" placeholder="0.00" value={createAmount} onChange={(e) => setCreateAmount(e.target.value)} className="border-dash-border" />
              </div>

              {/* Payment Status */}
              <div className="space-y-2">
                <Label>Payment Status</Label>
                <div className="flex rounded-lg overflow-hidden border border-dash-border p-1 gap-1 bg-dash-bg bg-opacity-50 w-full">
                  <button type="button" onClick={() => setCreatePayment('UNPAID')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${createPayment === 'UNPAID' ? 'bg-amber-500 text-white shadow-sm' : 'text-dash-muted hover:bg-dash-bg'}`}>Unpaid</button>
                  <button type="button" onClick={() => setCreatePayment('PAID')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${createPayment === 'PAID' ? 'bg-emerald-500 text-white shadow-sm' : 'text-dash-muted hover:bg-dash-bg'}`}>Paid</button>
                </div>
              </div>

              {/* Booking Status Pills */}
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex w-full rounded-lg overflow-hidden border border-dash-border p-1 gap-1 bg-dash-bg bg-opacity-50">
                  <button type="button" onClick={() => setCreateStatus('PENDING')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${createStatus === 'PENDING' ? 'bg-amber-500 text-white shadow-sm' : 'text-dash-muted hover:bg-dash-bg'}`}>Pending</button>
                  <button type="button" onClick={() => setCreateStatus('CONFIRMED')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${createStatus === 'CONFIRMED' ? 'bg-blue-500 text-white shadow-sm' : 'text-dash-muted hover:bg-dash-bg'}`}>Confirmed</button>
                  <button type="button" onClick={() => setCreateStatus('CANCELLED')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${createStatus === 'CANCELLED' ? 'bg-red-500 text-white shadow-sm' : 'text-dash-muted hover:bg-dash-bg'}`}>Cancelled</button>
                  <button type="button" onClick={() => setCreateStatus('COMPLETED')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${createStatus === 'COMPLETED' ? 'bg-gray-500 text-white shadow-sm' : 'text-dash-muted hover:bg-dash-bg'}`}>Completed</button>
                </div>
              </div>

            </form>
          </div>
          <div className="px-6 py-4 border-t border-dash-border flex justify-end gap-3 bg-white">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="cursor-pointer border-dash-border">Cancel</Button>
            <Button type="submit" form="create-booking-form" disabled={createBooking.isPending} className="bg-dash-purple hover:bg-dash-purple/90 text-white cursor-pointer transition-all shadow-sm">
              {createBooking.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}Create Booking
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Bookings;
