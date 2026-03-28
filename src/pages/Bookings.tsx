import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookings, useConfirmBooking, useCancelBooking, useUpdateBooking, useDeleteBooking, type Booking } from '@/hooks/useBookings';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, CalendarCheck, AlertCircle, RefreshCw, Eye, Check, X, Loader2, Pencil, Trash2 } from 'lucide-react';
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

  const updateBooking = useUpdateBooking();
  const deleteBooking = useDeleteBooking();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Booking | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'confirm' | 'cancel'; id: string } | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editStatus, setEditStatus] = useState<Booking['status']>('PENDING');
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
      await updateBooking.mutateAsync({ id: editingBooking._id, status: editStatus });
      toast.success('Booking status updated');
      setEditingBooking(null);
    } catch {
      toast.error('Failed to update booking');
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
      <div className="relative w-72">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dash-muted" />
        <Input placeholder="Search bookings..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 border-dash-border" />
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
                        <Button variant="ghost" size="icon" onClick={() => { setEditingBooking(b); setEditStatus(b.status); }} className="h-8 w-8 text-dash-muted hover:text-dash-purple cursor-pointer"><Pencil size={14} /></Button>
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

      {/* Detail Modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-inter">Booking Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-dash-muted text-xs">Booking ID</p><p className="font-mono text-dash-text">#{selected._id.slice(-8)}</p></div>
                <div><p className="text-dash-muted text-xs">Status</p><Badge variant="outline" className={`text-[10px] font-semibold border ${statusColors[selected.status]}`}>{selected.status}</Badge></div>
                <div><p className="text-dash-muted text-xs">User</p><p className="text-dash-text font-medium cursor-pointer hover:underline hover:text-dash-purple" onClick={() => { setSelected(null); navigate('/dashboard/users', { state: { openUserId: selected.userId } }); }}>{selected.user?.fullName || selected.userId.slice(-8)}</p></div>
                <div><p className="text-dash-muted text-xs">Car</p><p className="text-dash-text font-medium cursor-pointer hover:underline hover:text-dash-purple" onClick={() => { setSelected(null); navigate('/dashboard/cars', { state: { openCarId: selected.carId } }); }}>{selected.car ? `${selected.car.marque} - ${selected.car.matricule}` : selected.carId.slice(-8)}</p></div>
                <div><p className="text-dash-muted text-xs">Start Date</p><p className="text-dash-text">{new Date(selected.startDate).toLocaleString()}</p></div>
                <div><p className="text-dash-muted text-xs">End Date</p><p className="text-dash-text">{new Date(selected.endDate).toLocaleString()}</p></div>
                <div><p className="text-dash-muted text-xs">Pickup</p><p className="text-dash-text">{selected.pickupLocation || '—'}</p></div>
                <div><p className="text-dash-muted text-xs">Dropoff</p><p className="text-dash-text">{selected.dropoffLocation || '—'}</p></div>
              </div>
              <div className="border-t border-dash-border pt-3">
                <p className="text-dash-muted text-xs mb-1">Payment</p>
                <div className="flex items-center gap-2">
                  <span className="text-dash-text font-medium">{selected.payment?.amount || 0} {selected.payment?.currency || 'TND'}</span>
                  <Badge variant="outline" className={`text-[10px] ${paymentColors[selected.payment?.status || 'UNPAID']}`}>{selected.payment?.status || 'UNPAID'}</Badge>
                </div>
              </div>
              {selected.contractUrl && (
                <div className="border-t border-dash-border pt-3">
                  <a href={selected.contractUrl} target="_blank" rel="noopener noreferrer" className="text-dash-purple text-xs hover:underline cursor-pointer">View Contract →</a>
                </div>
              )}
              {selected.status === 'PENDING' && (
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => { setSelected(null); setConfirmAction({ type: 'confirm', id: selected._id }); }} className="flex-1 bg-dash-success hover:bg-dash-success/90 text-white cursor-pointer"><Check size={14} className="mr-1" />Confirm</Button>
                  <Button onClick={() => { setSelected(null); setConfirmAction({ type: 'cancel', id: selected._id }); }} variant="outline" className="flex-1 text-dash-danger border-dash-danger/30 hover:bg-dash-danger/5 cursor-pointer"><X size={14} className="mr-1" />Cancel</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
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

      {/* Edit Status Modal */}
      <Dialog open={!!editingBooking} onOpenChange={() => setEditingBooking(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle className="font-inter">Edit Booking Status</DialogTitle></DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as any)}
                className="w-full text-sm h-10 px-3 rounded-lg border border-dash-border bg-transparent focus:ring-1 focus:ring-dash-purple focus:outline-none"
              >
                {Object.keys(statusColors).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingBooking(null)} className="cursor-pointer">Cancel</Button>
              <Button type="submit" disabled={updateBooking.isPending} className="bg-dash-purple hover:bg-dash-purple/90 text-white cursor-pointer">
                {updateBooking.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Bookings;
