import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReclamations, useReclamation, useUpdateReclamation, useDeleteReclamation, type Reclamation } from '@/hooks/useReclamations';
import { useAdmins } from '@/hooks/useAdmins';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, MessageSquareWarning, AlertCircle, RefreshCw, Eye, Loader2, StickyNote, User as UserIcon, Car as CarIcon, Trash2, Calendar, Upload, ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  OPEN: 'bg-dash-danger/15 text-red-700 border-dash-danger/30',
  IN_PROGRESS: 'bg-dash-warning/15 text-amber-700 border-dash-warning/30',
  RESOLVED: 'bg-dash-success/15 text-emerald-700 border-dash-success/30',
  REJECTED: 'bg-gray-100 text-gray-500 border-gray-200',
  CLOSED: 'bg-gray-100 text-gray-600 border-gray-200',
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
  const updateReclamation = useUpdateReclamation();
  const deleteReclamation = useDeleteReclamation();
  const { data: admins } = useAdmins();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [editData, setEditData] = useState<Partial<Reclamation>>({});
  const [editFile, setEditFile] = useState<File | null>(null);

  // Fetch full detail when a reclamation is selected
  const { data: selectedDetail, isLoading: detailLoading } = useReclamation(selectedId || '');

  useEffect(() => {
    if (selectedDetail) {
      setEditData({
        status: selectedDetail.status,
        assignedAdminId: selectedDetail.assignedAdminId || '',
        adminNote: selectedDetail.adminNote || '',
        priority: selectedDetail.priority || 'LOW'
      });
      setEditFile(null);
    }
  }, [selectedDetail]);

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
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    try {
      const formData = new FormData();
      if (editData.status) formData.append('status', editData.status!);
      if (editData.assignedAdminId) formData.append('assignedAdminId', editData.assignedAdminId!);
      if (editData.adminNote !== undefined) formData.append('adminNote', editData.adminNote!);
      if (editData.priority) formData.append('priority', editData.priority!);
      if (editFile) formData.append('image', editFile);

      await updateReclamation.mutateAsync({ id: selectedId, data: formData });
      toast.success('Reclamation updated successfully');
      setSelectedId(null);
    } catch {
      toast.error('Failed to update reclamation');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteReclamation.mutateAsync(deleteId);
      toast.success('Reclamation deleted');
      setDeleteId(null);
    } catch {
      toast.error('Failed to delete reclamation');
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
                    <TableCell className="text-sm text-dash-text cursor-pointer hover:underline hover:text-dash-purple" onClick={() => navigate('/dashboard/users', { state: { openUserId: r.userId } })}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-dash-purple/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-dash-purple text-[10px] font-bold">{r.user?.fullName?.charAt(0)?.toUpperCase() || '?'}</span>
                        </div>
                        <span className="truncate max-w-[120px]">{r.user?.fullName || 'Unknown'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-dash-muted cursor-pointer hover:underline hover:text-dash-purple" onClick={() => navigate('/dashboard/cars', { state: { openCarId: r.carId } })}>
                      {r.car ? `${r.car.marque} - ${r.car.matricule}` : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-dash-muted max-w-[180px] truncate">{r.message}</TableCell>
                    <TableCell><Badge variant="outline" className={`text-[10px] font-semibold border ${statusColors[r.status]}`}>{r.status}</Badge></TableCell>
                    <TableCell className="text-xs text-dash-muted max-w-[120px] truncate">{r.adminNote || '—'}</TableCell>
                    <TableCell className="text-xs text-dash-muted">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDetail(r)} className="h-8 w-8 text-dash-muted hover:text-dash-purple cursor-pointer"><Eye size={14} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(r._id)} className="h-8 w-8 text-dash-muted hover:text-dash-danger cursor-pointer"><Trash2 size={14} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <p className="text-xs text-dash-muted">Showing {filtered.length} of {reclamations?.length || 0} reclamations</p>

      {/* Detail Drawer */}
      <Sheet open={!!selectedId} onOpenChange={() => setSelectedId(null)}>
        <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-inter">Reclamation Details</SheetTitle>
          </SheetHeader>
          
          {detailLoading ? (
            <div className="space-y-3 p-4 mt-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : selectedDetail && (
            <div className="space-y-6 mt-6">
              
              {/* HEADER SECTION */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-dash-purple flex items-center justify-center flex-shrink-0 text-white text-xl font-bold shadow-md">
                  {(selectedDetail.user?.fullName || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col pt-1">
                  <p className="text-xl font-bold text-dash-text tracking-tight">{selectedDetail.user?.fullName || 'Unknown User'}</p>
                  <p className="text-sm text-dash-muted mb-2">{selectedDetail.user?.email || 'No email'}</p>
                  <div>
                    <Badge variant="outline" className={`text-xs font-semibold border px-2 py-0.5 ${statusColors[selectedDetail.status]}`}>
                      {selectedDetail.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* STATS ROW */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-dash-bg rounded-xl border border-dash-border">
                  <p className="text-xs text-dash-muted uppercase font-medium mb-1">Reclamations</p>
                  <p className="text-sm font-bold text-dash-text">{selectedDetail.userReclamationCount || 0}</p>
                </div>
                <div className="p-3 bg-dash-bg rounded-xl border border-dash-border">
                  <p className="text-xs text-dash-muted uppercase font-medium mb-1">Rentals</p>
                  <p className="text-sm font-bold text-dash-text text-dash-purple">{selectedDetail.user?.nbr_fois_allocation || 0}</p>
                </div>
                <div className="p-3 bg-dash-bg rounded-xl border border-dash-border">
                  <p className="text-xs text-dash-muted uppercase font-medium mb-1 flex items-center gap-1"><Calendar size={12}/> Opened</p>
                  <p className="text-sm font-bold text-dash-text">{new Date(selectedDetail.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>

              {/* CAR INFO CARD */}
              {selectedDetail.car && (
                <div className="border border-dash-border rounded-xl bg-white overflow-hidden p-4">
                  <p className="text-xs text-dash-muted uppercase font-medium mb-2">Associated Car</p>
                  <div className="flex justify-between items-center">
                    <span 
                      className="text-sm font-bold text-dash-text cursor-pointer hover:underline hover:text-dash-purple transition-colors"
                      onClick={() => { setSelectedId(null); navigate('/dashboard/cars', { state: { openCarId: selectedDetail.carId } }); }}
                    >
                      {selectedDetail.car.marque} — {selectedDetail.car.matricule}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-semibold">
                      {selectedDetail.car.availability?.status || 'UNKNOWN'}
                    </Badge>
                  </div>
                </div>
              )}

              {/* RECLAMATION MESSAGE SECTION */}
              <div className="space-y-2">
                <p className="text-xs text-dash-muted uppercase font-medium">Message</p>
                <div className="bg-dash-bg p-4 rounded-xl border border-dash-border">
                  <p className="text-sm text-dash-text whitespace-pre-wrap leading-relaxed">{selectedDetail.message}</p>
                </div>
                {selectedDetail.image && (
                  <div className="mt-3">
                    <img src={selectedDetail.image.startsWith('http') ? selectedDetail.image : `http://localhost:6005${selectedDetail.image}`} alt="Reclamation Attachment" className="w-full rounded-xl border border-dash-border max-h-64 object-cover" />
                  </div>
                )}
              </div>

              <form id="edit-reclamation-form" onSubmit={handleSaveChanges} className="space-y-6 pt-4 border-t border-dash-border">
                
                {/* ASSIGN ADMIN */}
                <div className="space-y-2">
                  <p className="text-xs text-dash-muted uppercase font-medium">Assign Admin</p>
                  <Select value={editData.assignedAdminId || 'unassigned'} onValueChange={(val) => setEditData({...editData, assignedAdminId: val === 'unassigned' ? '' : val})}>
                    <SelectTrigger className="w-full border-dash-border focus:ring-dash-purple/20">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {admins?.map((admin: any) => (
                        <SelectItem key={admin._id} value={admin._id}>{admin.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* STATUS MAP */}
                <div className="space-y-2">
                  <p className="text-xs text-dash-muted uppercase font-medium">Reclamation Status</p>
                  <div className="flex w-full rounded-lg overflow-hidden border border-dash-border p-1 gap-1 bg-dash-bg bg-opacity-50">
                    <button type="button" onClick={() => setEditData({...editData, status: 'OPEN' as any})} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${editData.status === 'OPEN' ? 'bg-red-500 text-white shadow-sm' : 'text-dash-muted hover:bg-dash-bg'}`}>Open</button>
                    <button type="button" onClick={() => setEditData({...editData, status: 'IN_PROGRESS' as any})} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${editData.status === 'IN_PROGRESS' ? 'bg-amber-500 text-white shadow-sm' : 'text-dash-muted hover:bg-dash-bg'}`}>In Progress</button>
                    <button type="button" onClick={() => setEditData({...editData, status: 'RESOLVED' as any})} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${editData.status === 'RESOLVED' ? 'bg-emerald-500 text-white shadow-sm' : 'text-dash-muted hover:bg-dash-bg'}`}>Resolved</button>
                    <button type="button" onClick={() => setEditData({...editData, status: 'CLOSED' as any})} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${editData.status === 'CLOSED' ? 'bg-gray-500 text-white shadow-sm' : 'text-dash-muted hover:bg-dash-bg'}`}>Closed</button>
                  </div>
                </div>

                {/* PRIORITY MAP */}
                <div className="space-y-2">
                  <p className="text-xs text-dash-muted uppercase font-medium">Priority</p>
                  <div className="flex w-full rounded-lg overflow-hidden border border-dash-border p-1 gap-1 bg-dash-bg bg-opacity-50">
                    <button type="button" onClick={() => setEditData({...editData, priority: 'LOW'})} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${editData.priority === 'LOW' ? 'bg-gray-500 text-white shadow-sm' : 'text-dash-muted hover:bg-dash-bg'}`}>Low</button>
                    <button type="button" onClick={() => setEditData({...editData, priority: 'MEDIUM'})} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${editData.priority === 'MEDIUM' ? 'bg-amber-500 text-white shadow-sm' : 'text-dash-muted hover:bg-dash-bg'}`}>Medium</button>
                    <button type="button" onClick={() => setEditData({...editData, priority: 'HIGH'})} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${editData.priority === 'HIGH' ? 'bg-red-500 text-white shadow-sm' : 'text-dash-muted hover:bg-dash-bg'}`}>High</button>
                  </div>
                </div>

                {/* ADMIN NOTE */}
                <div className="space-y-2">
                  <p className="text-xs text-dash-muted uppercase font-medium">Admin Note</p>
                  <textarea
                    value={editData.adminNote || ''}
                    onChange={(e) => setEditData({...editData, adminNote: e.target.value})}
                    placeholder="Document your findings or resolution here..."
                    className="w-full min-h-[100px] p-3 rounded-xl border border-dash-border bg-dash-bg text-sm text-dash-text resize-none focus:outline-none focus:ring-1 focus:ring-dash-purple"
                  />
                </div>

                {/* RESOLUTION EVIDENCE (Upload) */}
                <div className="space-y-2">
                  <p className="text-xs text-dash-muted uppercase font-medium">Resolution Evidence Image (Optional)</p>
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
                        <Upload size={14} /> Upload Evidence Image
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && setEditFile(e.target.files[0])} />
                      </label>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <Button 
                    type="submit" 
                    disabled={updateReclamation.isPending} 
                    className="w-full bg-dash-purple hover:bg-dash-purple/90 text-white cursor-pointer shadow-sm"
                  >
                    {updateReclamation.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                    Save Changes
                  </Button>
                  
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full justify-center border-dash-danger/30 text-dash-danger hover:bg-dash-danger/5 hover:text-dash-danger font-medium cursor-pointer"
                    onClick={() => { setDeleteId(selectedDetail._id); setSelectedId(null); }}
                  >
                    <Trash2 size={14} className="mr-2" /> Delete Reclamation
                  </Button>
                </div>
              </form>

            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reclamation</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this reclamation? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-dash-danger hover:bg-dash-danger/90 cursor-pointer">
              {deleteReclamation.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Reclamations;
