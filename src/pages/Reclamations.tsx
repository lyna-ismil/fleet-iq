import { useState } from 'react';
import { useReclamations, useReclamation, useAssignReclamation, useResolveReclamation, useUpdateReclamationNote, type Reclamation } from '@/hooks/useReclamations';
import { useAdmins } from '@/hooks/useAdmins';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, MessageSquareWarning, AlertCircle, RefreshCw, Eye, Loader2, CheckCircle, XCircle, StickyNote, User as UserIcon, Car as CarIcon } from 'lucide-react';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  OPEN: 'bg-dash-danger/15 text-red-700 border-dash-danger/30',
  IN_PROGRESS: 'bg-dash-warning/15 text-amber-700 border-dash-warning/30',
  RESOLVED: 'bg-dash-success/15 text-emerald-700 border-dash-success/30',
  REJECTED: 'bg-gray-100 text-gray-500 border-gray-200',
};

const bookingStatusColors: Record<string, string> = {
  PENDING: 'bg-dash-warning/15 text-amber-700',
  CONFIRMED: 'bg-dash-info/15 text-blue-700',
  ACTIVE: 'bg-dash-success/15 text-emerald-700',
  COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-dash-danger/15 text-red-700',
  EXPIRED: 'bg-gray-100 text-gray-500',
};

const Reclamations = () => {
  const { data: reclamations, isLoading, isError, refetch } = useReclamations();
  const { data: admins } = useAdmins();
  const assignReclamation = useAssignReclamation();
  const resolveReclamation = useResolveReclamation();
  const updateNote = useUpdateReclamationNote();

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assignAdminId, setAssignAdminId] = useState('');
  const [noteText, setNoteText] = useState('');

  // Fetch full detail when a reclamation is selected
  const { data: selectedDetail, isLoading: detailLoading } = useReclamation(selectedId || '');

  const filtered = reclamations?.filter(r =>
    r.message.toLowerCase().includes(search.toLowerCase()) ||
    (r.user?.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.user?.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.car?.marque || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.car?.matricule || '').toLowerCase().includes(search.toLowerCase()) ||
    r._id.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleOpenDetail = (r: Reclamation) => {
    setSelectedId(r._id);
    setAssignAdminId(r.assignedAdminId || '');
    setNoteText(r.adminNote || '');
  };

  const handleAssign = async () => {
    if (!selectedId || !assignAdminId) return;
    try {
      await assignReclamation.mutateAsync({ id: selectedId, assignedAdminId: assignAdminId });
      toast.success('Reclamation assigned');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Assign failed');
    }
  };

  const handleResolve = async (status: 'RESOLVED' | 'REJECTED') => {
    if (!selectedId) return;
    try {
      await resolveReclamation.mutateAsync({ id: selectedId, status });
      toast.success(`Reclamation ${status.toLowerCase()}`);
      setSelectedId(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Action failed');
    }
  };

  const handleSaveNote = async () => {
    if (!selectedId) return;
    try {
      await updateNote.mutateAsync({ id: selectedId, adminNote: noteText });
      toast.success('Note saved');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Save failed');
    }
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-inter">
        <AlertCircle className="text-dash-danger mb-3" size={40} />
        <p className="text-dash-text font-medium mb-2">Failed to load reclamations</p>
        <Button onClick={() => refetch()} variant="outline" className="gap-2 cursor-pointer"><RefreshCw size={14} /> Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-inter">
      <div className="relative w-72">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dash-muted" />
        <Input placeholder="Search reclamations..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 border-dash-border" />
      </div>

      <Card className="border-dash-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <MessageSquareWarning className="mx-auto text-dash-muted mb-3" size={40} />
              <p className="text-dash-text font-medium">No reclamations found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">ID</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">User</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Car</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Message</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Status</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Admin Note</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Created</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r._id} className="hover:bg-dash-bg/60 transition-colors">
                    <TableCell className="font-mono text-xs text-dash-text">#{r._id.slice(-6)}</TableCell>
                    <TableCell className="text-sm text-dash-text">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-dash-purple/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-dash-purple text-[10px] font-bold">{r.user?.fullName?.charAt(0)?.toUpperCase() || '?'}</span>
                        </div>
                        <span className="truncate max-w-[120px]">{r.user?.fullName || 'Unknown'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-dash-muted">
                      {r.car ? `${r.car.marque} - ${r.car.matricule}` : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-dash-muted max-w-[180px] truncate">{r.message}</TableCell>
                    <TableCell><Badge variant="outline" className={`text-[10px] font-semibold border ${statusColors[r.status]}`}>{r.status}</Badge></TableCell>
                    <TableCell className="text-xs text-dash-muted max-w-[120px] truncate">{r.adminNote || '—'}</TableCell>
                    <TableCell className="text-xs text-dash-muted">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDetail(r)} className="h-8 w-8 text-dash-muted hover:text-dash-purple cursor-pointer"><Eye size={14} /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <p className="text-xs text-dash-muted">Showing {filtered.length} of {reclamations?.length || 0} reclamations</p>

      {/* Detail Modal */}
      <Dialog open={!!selectedId} onOpenChange={() => setSelectedId(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-inter">Reclamation Details</DialogTitle></DialogHeader>
          {detailLoading ? (
            <div className="space-y-3 p-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : selectedDetail && (
            <div className="space-y-5">
              {/* Status + ID */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-xs font-semibold border ${statusColors[selectedDetail.status]}`}>{selectedDetail.status}</Badge>
                <span className="font-mono text-xs text-dash-muted">#{selectedDetail._id.slice(-8)}</span>
              </div>

              {/* Message */}
              <div className="bg-dash-bg rounded-xl p-4">
                <p className="text-sm text-dash-text leading-relaxed">{selectedDetail.message}</p>
              </div>
              {selectedDetail.image && (
                <img src={selectedDetail.image} alt="Reclamation attachment" className="rounded-xl max-h-48 object-cover w-full" />
              )}

              {/* User Profile Panel */}
              <div className="border border-dash-border rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-dash-text">
                  <UserIcon size={14} className="text-dash-purple" /> User Info
                </div>
                {selectedDetail.user ? (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-dash-muted text-xs">Full Name</p><p className="text-dash-text font-medium">{selectedDetail.user.fullName}</p></div>
                    <div><p className="text-dash-muted text-xs">Email</p><p className="text-dash-text">{selectedDetail.user.email}</p></div>
                    <div><p className="text-dash-muted text-xs">Phone</p><p className="text-dash-text">{selectedDetail.user.phone || '—'}</p></div>
                    <div><p className="text-dash-muted text-xs">Reclamations</p><p className="text-dash-text font-medium">{selectedDetail.userReclamationCount || 0}</p></div>
                    <div><p className="text-dash-muted text-xs">Rentals</p><p className="text-dash-text font-medium">{selectedDetail.user.nbr_fois_allocation || 0}</p></div>
                    <div><p className="text-dash-muted text-xs">Status</p><p className="text-dash-text">{selectedDetail.user.status || '—'}</p></div>
                    {selectedDetail.user.cinImageUrl && (
                      <div className="col-span-2">
                        <p className="text-dash-muted text-xs mb-1">CIN Image</p>
                        <img src={selectedDetail.user.cinImageUrl} alt="CIN" className="rounded-lg max-h-32 object-cover" />
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-dash-muted">User data unavailable</p>
                )}
              </div>

              {/* Car Info Panel */}
              {selectedDetail.car && (
                <div className="border border-dash-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-dash-text">
                    <CarIcon size={14} className="text-dash-purple" /> Car Info
                  </div>
                  <div className="flex gap-4">
                    {selectedDetail.car.photo && (
                      <img src={selectedDetail.car.photo} alt="Car" className="rounded-lg w-24 h-16 object-cover flex-shrink-0" />
                    )}
                    <div className="grid grid-cols-2 gap-2 text-sm flex-1">
                      <div><p className="text-dash-muted text-xs">Marque</p><p className="text-dash-text font-medium">{selectedDetail.car.marque}</p></div>
                      <div><p className="text-dash-muted text-xs">Matricule</p><p className="text-dash-text font-medium">{selectedDetail.car.matricule}</p></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Note Editor */}
              <div className="border border-dash-border rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-dash-text">
                  <StickyNote size={14} className="text-dash-purple" /> Admin Note
                </div>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a note about this reclamation..."
                  className="w-full min-h-[80px] p-3 rounded-lg border border-dash-border bg-dash-bg text-sm text-dash-text resize-none focus:outline-none focus:ring-1 focus:ring-dash-purple"
                />
                <Button onClick={handleSaveNote} disabled={updateNote.isPending} size="sm" className="bg-dash-purple hover:bg-dash-purple/90 text-white cursor-pointer">
                  {updateNote.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                  Save Note
                </Button>
              </div>

              {/* User Booking History */}
              {selectedDetail.userBookings && selectedDetail.userBookings.length > 0 && (
                <div className="border border-dash-border rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-dash-text">User Booking History</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedDetail.userBookings.map((b) => (
                      <div key={b._id} className="flex items-center justify-between p-2.5 rounded-lg bg-dash-bg text-xs">
                        <div className="space-y-0.5">
                          <p className="text-dash-text font-medium">{b.car ? `${b.car.marque} - ${b.car.matricule}` : 'Unknown car'}</p>
                          <p className="text-dash-muted">{new Date(b.startDate).toLocaleDateString()} → {new Date(b.endDate).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-dash-text font-medium">{b.payment?.amount ? `${b.payment.amount} ${b.payment.currency || 'TND'}` : '—'}</span>
                          <Badge variant="outline" className={`text-[10px] font-semibold ${bookingStatusColors[b.status]}`}>{b.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {(selectedDetail.status === 'OPEN' || selectedDetail.status === 'IN_PROGRESS') && (
                <div className="border-t border-dash-border pt-4 space-y-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-dash-text">Assign to Admin</label>
                    <div className="flex gap-2">
                      <Select value={assignAdminId} onValueChange={setAssignAdminId}>
                        <SelectTrigger className="flex-1 border-dash-border"><SelectValue placeholder="Select admin" /></SelectTrigger>
                        <SelectContent>
                          {admins?.map(a => (<SelectItem key={a._id} value={a._id}>{a.name} ({a.role})</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <Button onClick={handleAssign} disabled={!assignAdminId || assignReclamation.isPending} className="bg-dash-purple hover:bg-dash-purple/90 text-white cursor-pointer">
                        {assignReclamation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Assign'}
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleResolve('RESOLVED')} disabled={resolveReclamation.isPending} className="flex-1 bg-dash-success hover:bg-dash-success/90 text-white cursor-pointer">
                      <CheckCircle size={14} className="mr-1" />Resolve
                    </Button>
                    <Button onClick={() => handleResolve('REJECTED')} disabled={resolveReclamation.isPending} variant="outline" className="flex-1 text-dash-danger border-dash-danger/30 hover:bg-dash-danger/5 cursor-pointer">
                      <XCircle size={14} className="mr-1" />Reject
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reclamations;
