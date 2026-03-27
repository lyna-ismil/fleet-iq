import { useState } from 'react';
import { useUsers, useUpdateUser, useDeleteUser, useCreateUser, type User } from '@/hooks/useUsers';
import { useUserBookings, type Booking } from '@/hooks/useBookings';
import { useUserHistory } from '@/hooks/useUserHistory';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Users as UsersIcon, AlertCircle, Loader2, RefreshCw, Eye, Trash2, Plus, Lock } from 'lucide-react';
import { toast } from 'sonner';

const statusBadge: Record<string, string> = {
  ACTIVE: 'bg-dash-success/15 text-emerald-700 border-dash-success/30',
  SUSPENDED: 'bg-gray-100 text-gray-500 border-gray-200',
};

const bookingStatusColors: Record<string, string> = {
  PENDING: 'bg-dash-warning/15 text-amber-700',
  CONFIRMED: 'bg-dash-info/15 text-blue-700',
  ACTIVE: 'bg-dash-success/15 text-emerald-700',
  COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-dash-danger/15 text-red-700',
  EXPIRED: 'bg-gray-100 text-gray-500',
};

const userSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(8, 'Phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type UserFormData = z.infer<typeof userSchema>;

const Users = () => {
  const { data: users, isLoading, isError, refetch } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  const onCreateUser = async (data: { fullName: string; email: string; phone: string; password: string }) => {
    try {
      await createUser.mutateAsync(data);
      toast.success('User created successfully');
      setCreateOpen(false);
      reset();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to create user');
    }
  };

  const filtered = users?.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search)
  ) || [];

  const handleToggleStatus = async (user: User) => {
    try {
      await updateUser.mutateAsync({ id: user._id, status: user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' });
      toast.success(`User ${user.status === 'ACTIVE' ? 'suspended' : 'activated'} successfully`);
      if (selectedUser?._id === user._id) {
        setSelectedUser({ ...user, status: user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Update failed');
    }
  };

  const handleToggleBlacklist = async (user: User) => {
    try {
      await updateUser.mutateAsync({ id: user._id, blacklist: !user.blacklist });
      toast.success(`User ${user.blacklist ? 'removed from' : 'added to'} blacklist`);
      if (selectedUser?._id === user._id) {
        setSelectedUser({ ...user, blacklist: !user.blacklist });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Update failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteUser.mutateAsync(deleteId);
      toast.success('User deleted successfully');
      setDeleteId(null);
      if (selectedUser?._id === deleteId) setSelectedUser(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Delete failed');
    }
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-inter">
        <AlertCircle className="text-dash-danger mb-3" size={40} />
        <p className="text-dash-text font-medium mb-2">Failed to load users</p>
        <Button onClick={() => refetch()} variant="outline" className="gap-2 cursor-pointer"><RefreshCw size={14} /> Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-inter">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dash-muted" />
          <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 border-dash-border" />
        </div>
        <Button onClick={() => { setCreateOpen(true); reset(); }} className="bg-dash-purple hover:bg-dash-purple/90 text-white gap-2 cursor-pointer">
          <Plus size={16} /> Add User
        </Button>
      </div>

      <Card className="border-dash-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <UsersIcon className="mx-auto text-dash-muted mb-3" size={40} />
              <p className="text-dash-text font-medium">No users found</p>
              <p className="text-dash-muted text-sm mt-1">Users will appear once they sign up.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">User</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Email</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Phone</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Status</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Blacklisted</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium">Joined</TableHead>
                  <TableHead className="text-xs text-dash-muted uppercase tracking-wider font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user._id} className="hover:bg-dash-bg/60 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-dash-purple/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-dash-purple text-xs font-bold">{user.fullName?.charAt(0)?.toUpperCase()}</span>
                        </div>
                        <span className="font-medium text-dash-text text-sm">{user.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-dash-muted text-sm">{user.email}</TableCell>
                    <TableCell className="text-dash-muted text-sm">{user.phone}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] font-semibold border ${statusBadge[user.status]}`}>{user.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {user.blacklist && <Badge variant="outline" className="text-[10px] font-semibold border bg-dash-danger/15 text-red-700 border-dash-danger/30">BLACKLISTED</Badge>}
                    </TableCell>
                    <TableCell className="text-dash-muted text-xs">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedUser(user)} className="h-8 w-8 text-dash-muted hover:text-dash-purple cursor-pointer"><Eye size={14} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(user._id)} className="h-8 w-8 text-dash-muted hover:text-dash-danger cursor-pointer"><Trash2 size={14} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-dash-muted">Showing {filtered.length} of {users?.length || 0} users</p>

      {/* User Detail Drawer */}
      <Sheet open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <SheetContent className="w-[450px] sm:max-w-[450px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-inter">User Details</SheetTitle>
          </SheetHeader>
          {selectedUser && <UserDetailContent user={selectedUser} onToggleStatus={handleToggleStatus} onToggleBlacklist={handleToggleBlacklist} />}
        </SheetContent>
      </Sheet>

      {/* Delete */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this user? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-dash-danger hover:bg-dash-danger/90 cursor-pointer">
              {deleteUser.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create User Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-inter">Add New User</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onCreateUser)} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input {...register('fullName')} className="border-dash-border" placeholder="John Doe" />
              {errors.fullName && <p className="text-dash-danger text-xs">{errors.fullName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" {...register('email')} className="border-dash-border" placeholder="john@example.com" />
              {errors.email && <p className="text-dash-danger text-xs">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input {...register('phone')} className="border-dash-border" placeholder="+216 XX XXX XXX" />
              {errors.phone && <p className="text-dash-danger text-xs">{errors.phone.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dash-muted" />
                <Input type="password" {...register('password')} className="border-dash-border pl-9" placeholder="Min 6 characters" />
              </div>
              {errors.password && <p className="text-dash-danger text-xs">{errors.password.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="cursor-pointer">Cancel</Button>
              <Button type="submit" disabled={createUser.isPending} className="bg-dash-purple hover:bg-dash-purple/90 text-white cursor-pointer">
                {createUser.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function UserDetailContent({ user, onToggleStatus, onToggleBlacklist }: { user: User; onToggleStatus: (u: User) => void; onToggleBlacklist: (u: User) => void }) {
  const { data: history, isLoading: historyLoading } = useUserHistory(user._id);

  return (
    <div className="space-y-6 mt-6">
      {/* Profile */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-dash-purple/10 flex items-center justify-center">
          <span className="text-dash-purple text-xl font-bold">{user.fullName?.charAt(0)?.toUpperCase()}</span>
        </div>
        <div>
          <p className="text-lg font-semibold text-dash-text">{user.fullName}</p>
          <p className="text-sm text-dash-muted">{user.email}</p>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-3 text-sm">
        <div className="flex justify-between"><span className="text-dash-muted">Phone</span><span className="text-dash-text">{user.phone}</span></div>
        <div className="flex justify-between"><span className="text-dash-muted">Rentals</span><span className="text-dash-text">{history?.rentalCount ?? user.nbr_fois_allocation}</span></div>
        <div className="flex justify-between"><span className="text-dash-muted">Reclamations</span><span className="text-dash-text">{history?.reclamationCount ?? 0}</span></div>
        <div className="flex justify-between"><span className="text-dash-muted">Outstanding</span><span className="text-dash-text">{user.facture} TND</span></div>
        <div className="flex justify-between"><span className="text-dash-muted">Joined</span><span className="text-dash-text">{new Date(user.createdAt).toLocaleDateString()}</span></div>
      </div>

      {/* CIN Image */}
      {user.cinImageUrl && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-dash-text">CIN Image</p>
          <img src={user.cinImageUrl} alt="CIN" className="rounded-xl max-h-40 object-cover w-full border border-dash-border" />
        </div>
      )}

      {/* License Image */}
      {user.licenseImageUrl && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-dash-text">License Image</p>
          <img src={user.licenseImageUrl} alt="License" className="rounded-xl max-h-40 object-cover w-full border border-dash-border" />
        </div>
      )}

      {/* Toggles */}
      <div className="space-y-4 border-t border-dash-border pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-dash-text">Active Account</p>
            <p className="text-xs text-dash-muted">Enable or disable user access</p>
          </div>
          <Switch checked={user.status === 'ACTIVE'} onCheckedChange={() => onToggleStatus(user)} className="cursor-pointer" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-dash-text">Blacklist</p>
            <p className="text-xs text-dash-muted">Block user from making bookings</p>
          </div>
          <Switch checked={user.blacklist} onCheckedChange={() => onToggleBlacklist(user)} className="cursor-pointer" />
        </div>
      </div>

      {/* Booking History (enriched with car info) */}
      <div className="border-t border-dash-border pt-4">
        <h4 className="text-sm font-semibold text-dash-text mb-3">Booking History</h4>
        {historyLoading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
        ) : !history?.bookings?.length ? (
          <p className="text-xs text-dash-muted">No bookings for this user.</p>
        ) : (
          <div className="space-y-2">
            {history.bookings.map((b) => (
              <div key={b._id} className="p-3 rounded-lg bg-dash-bg text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-dash-text font-medium">
                    {b.car ? `${b.car.marque} - ${b.car.matricule}` : 'Unknown car'}
                  </span>
                  <Badge variant="outline" className={`text-[10px] font-semibold ${bookingStatusColors[b.status]}`}>{b.status}</Badge>
                </div>
                <div className="flex items-center justify-between text-dash-muted">
                  <span>{new Date(b.startDate).toLocaleDateString()} → {new Date(b.endDate).toLocaleDateString()}</span>
                  <span className="font-medium text-dash-text">{b.payment?.amount ? `${b.payment.amount} ${b.payment.currency || 'TND'}` : '—'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Users;
