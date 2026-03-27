import { useState } from 'react';
import { useReclamations, useAssignReclamation, useResolveReclamation, type Reclamation } from '@/hooks/useReclamations';
import { useAdmins } from '@/hooks/useAdmins';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, MessageSquareWarning, AlertCircle, RefreshCw, Eye, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  OPEN: 'bg-dash-danger/15 text-red-700 border-dash-danger/30',
  IN_PROGRESS: 'bg-dash-warning/15 text-amber-700 border-dash-warning/30',
  RESOLVED: 'bg-dash-success/15 text-emerald-700 border-dash-success/30',
  REJECTED: 'bg-gray-100 text-gray-500 border-gray-200',
};

const Reclamations = () => {
  const { data: reclamations, isLoading, isError, refetch } = useReclamations();
  const { data: admins } = useAdmins();
  const assignReclamation = useAssignReclamation();
  const resolveReclamation = useResolveReclamation();

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Reclamation | null>(null);
  const [assignAdminId, setAssignAdminId] = useState('');

  const filtered = reclamations?.filter(r =>
    r.message.toLowerCase().includes(search.toLowerCase()) ||
    r.userId.toLowerCase().includes(search.toLowerCase()) ||
    r._id.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleAssign = async () => {
    if (!selected || !assignAdminId) return;
    try {
      await assignReclamation.mutateAsync({ id: selected._id, assignedAdminId: assignAdminId });
      toast.success('Reclamation assigned');
      setSelected(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Assign failed');
    }
  };

  const handleResolve = async (status: 'RESOLVED' | 'REJECTED') => {
    if (!selected) return;
    try {
      await resolveReclamation.mutateAsync({ id: selected._id, status });
      toast.success(`Reclamation ${status.toLowerCase()}`);
      setSelected(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Action failed');
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
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Message</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Status</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Assigned</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Created</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r._id} className="hover:bg-dash-bg/60 transition-colors">
                    <TableCell className="font-mono text-xs text-dash-text">#{r._id.slice(-6)}</TableCell>
                    <TableCell className="font-mono text-xs text-dash-muted">{r.userId.slice(-6)}</TableCell>
                    <TableCell className="text-sm text-dash-muted max-w-[250px] truncate">{r.message}</TableCell>
                    <TableCell><Badge variant="outline" className={`text-[10px] font-semibold border ${statusColors[r.status]}`}>{r.status}</Badge></TableCell>
                    <TableCell className="text-xs text-dash-muted">{r.assignedAdminId ? r.assignedAdminId.slice(-6) : '—'}</TableCell>
                    <TableCell className="text-xs text-dash-muted">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { setSelected(r); setAssignAdminId(r.assignedAdminId || ''); }} className="h-8 w-8 text-dash-muted hover:text-dash-purple cursor-pointer"><Eye size={14} /></Button>
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
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-inter">Reclamation Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-xs font-semibold border ${statusColors[selected.status]}`}>{selected.status}</Badge>
                <span className="font-mono text-xs text-dash-muted">#{selected._id.slice(-8)}</span>
              </div>
              <div className="bg-dash-bg rounded-xl p-4">
                <p className="text-sm text-dash-text leading-relaxed">{selected.message}</p>
              </div>
              {selected.image && (
                <img src={selected.image} alt="Reclamation attachment" className="rounded-xl max-h-48 object-cover w-full" />
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-dash-muted text-xs">User</p><p className="font-mono text-dash-text">{selected.userId.slice(-8)}</p></div>
                <div><p className="text-dash-muted text-xs">Booking</p><p className="font-mono text-dash-text">{selected.bookingId?.slice(-8) || '—'}</p></div>
                <div><p className="text-dash-muted text-xs">Created</p><p className="text-dash-text">{new Date(selected.createdAt).toLocaleString()}</p></div>
              </div>

              {(selected.status === 'OPEN' || selected.status === 'IN_PROGRESS') && (
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
