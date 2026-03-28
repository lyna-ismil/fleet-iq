import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSendNotification, useProcessQueue, useUserNotifications, useRecentNotifications } from '@/hooks/useNotifications';
import { useUsers } from '@/hooks/useUsers';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bell, Send, Play, Loader2, Search, User as UserIcon, X } from 'lucide-react';
import { toast } from 'sonner';

const notifSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
});
type NotifForm = z.infer<typeof notifSchema>;

const notifTypes = ['BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'PAYMENT_RECEIVED', 'RECLAMATION_UPDATE', 'SYSTEM', 'REMINDER', 'ALERT', 'PROMOTION'];
const channels = ['IN_APP', 'EMAIL', 'SMS', 'PUSH'];

const statusColors: Record<string, string> = {
  QUEUED: 'bg-gray-100 text-gray-600',
  PROCESSING: 'bg-dash-warning/15 text-amber-700',
  SENT: 'bg-dash-info/15 text-blue-700',
  DELIVERED: 'bg-dash-success/15 text-emerald-700',
  READ: 'bg-dash-purple/15 text-purple-700',
  FAILED: 'bg-dash-danger/15 text-red-700',
};

const Notifications = () => {
  const sendNotif = useSendNotification();
  const processQueue = useProcessQueue();
  const navigate = useNavigate();
  const { data: users, isLoading: usersLoading } = useUsers();

  const [type, setType] = useState('SYSTEM');
  const [channel, setChannel] = useState('IN_APP');
  const [lookupUserId, setLookupUserId] = useState('');

  const { data: userNotifs, isLoading: notifsLoading } = useUserNotifications(lookupUserId);
  const { data: recentNotifs, isLoading: recentLoading } = useRecentNotifications();

  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm<NotifForm>({
    resolver: zodResolver(notifSchema),
  });

  const selectedUserId = watch('userId');

  const onSend = async (data: NotifForm) => {
    try {
      await sendNotif.mutateAsync({ 
        userId: data.userId, 
        title: data.title, 
        body: data.body, 
        type, 
        channel 
      });
      toast.success('Notification sent');
      reset();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Send failed');
    }
  };

  const onProcess = async () => {
    try {
      const result = await processQueue.mutateAsync(10);
      toast.success(`Processed ${result?.processed || 0} notifications`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Process failed');
    }
  };

  return (
    <div className="space-y-6 font-inter">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send Form */}
        <Card className="border-dash-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-dash-text flex items-center gap-2">
              <Send size={16} className="text-dash-purple" /> Send Notification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSend)} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">User *</Label>
                <Select value={selectedUserId || ''} onValueChange={(v) => setValue('userId', v)}>
                  <SelectTrigger className="border-dash-border">
                    <SelectValue placeholder={usersLoading ? "Loading..." : "Select user"} />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map(u => (
                      <SelectItem key={u._id} value={u._id}>{u.fullName} ({u.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.userId && <p className="text-dash-danger text-xs">{errors.userId.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="border-dash-border"><SelectValue /></SelectTrigger>
                    <SelectContent>{notifTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Channel</Label>
                  <Select value={channel} onValueChange={setChannel}>
                    <SelectTrigger className="border-dash-border"><SelectValue /></SelectTrigger>
                    <SelectContent>{channels.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Title *</Label>
                <Input {...register('title')} className="border-dash-border" placeholder="Notification title" />
                {errors.title && <p className="text-dash-danger text-xs">{errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Body *</Label>
                <Textarea {...register('body')} className="border-dash-border min-h-[80px]" placeholder="Notification body..." />
                {errors.body && <p className="text-dash-danger text-xs">{errors.body.message}</p>}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={sendNotif.isPending} className="flex-1 bg-dash-purple hover:bg-dash-purple/90 text-white cursor-pointer">
                  {sendNotif.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : <Send size={14} className="mr-2" />} Send
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Process Queue */}
        <Card className="border-dash-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-dash-text flex items-center gap-2">
              <Play size={16} className="text-dash-success" /> Queue Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-dash-muted">Process queued notifications in batches of 10.</p>
            <Button onClick={onProcess} disabled={processQueue.isPending} className="bg-dash-success hover:bg-dash-success/90 text-white gap-2 cursor-pointer">
              {processQueue.isPending ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Process Queue
            </Button>

            <div className="border-t border-dash-border pt-4 mt-4">
              <Label className="text-sm mb-2 block">Lookup User Notifications</Label>
              <div className="flex gap-2 items-center">
                <Select value={lookupUserId} onValueChange={setLookupUserId}>
                  <SelectTrigger className="flex-1 border-dash-border text-sm">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map(u => (
                      <SelectItem key={u._id} value={u._id}>{u.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {lookupUserId && (
                  <Button variant="ghost" size="icon" onClick={() => setLookupUserId('')} className="cursor-pointer text-dash-muted hover:text-dash-danger"><X size={16} /></Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications Table */}
      <Card className="border-dash-border">
        <CardHeader className="pb-3 border-b border-dash-border/50">
          <CardTitle className="text-base font-semibold text-dash-text">
            {lookupUserId ? (
              <span className="flex items-center gap-2">
                <UserIcon size={16} className="text-dash-purple" />
                Notifications for {users?.find(u => u._id === lookupUserId)?.fullName || 'Selected User'}
              </span>
            ) : (
              'Recent Global Notifications'
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(lookupUserId ? notifsLoading : recentLoading) ? (
            <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (() => {
            const dataToRender = lookupUserId 
              ? userNotifs 
              : recentNotifs?.filter(n => n.title !== 'Internal System Queue');
              
            if (!dataToRender?.length) {
              return (
                <div className="py-12 text-center">
                  <Bell className="mx-auto text-dash-muted mb-2" size={32} />
                  <p className="text-sm text-dash-muted">No notifications found.</p>
                </div>
              );
            }

            return (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    {!lookupUserId && <TableHead className="text-xs text-dash-muted uppercase font-medium">Recipient</TableHead>}
                    <TableHead className="text-xs text-dash-muted uppercase font-medium">Type</TableHead>
                    <TableHead className="text-xs text-dash-muted uppercase font-medium">Channel</TableHead>
                    <TableHead className="text-xs text-dash-muted uppercase font-medium">Message</TableHead>
                    <TableHead className="text-xs text-dash-muted uppercase font-medium">Status</TableHead>
                    <TableHead className="text-xs text-dash-muted uppercase font-medium">Retries</TableHead>
                    <TableHead className="text-xs text-dash-muted uppercase font-medium">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataToRender.map(n => {
                    const user = users?.find(u => u._id === n.userId);
                    return (
                      <TableRow key={n._id} className="hover:bg-dash-bg/60">
                        {!lookupUserId && (
                          <TableCell className="text-xs text-dash-text">
                            {user ? (
                              <span className="cursor-pointer hover:underline hover:text-dash-purple" onClick={() => navigate('/dashboard/users', { state: { openUserId: user._id } })}>
                                {user.fullName} <span className="text-dash-muted">({user.email})</span>
                              </span>
                            ) : (
                              <span className="text-dash-muted font-mono">{n.userId.slice(-6)}</span>
                            )}
                          </TableCell>
                        )}
                        <TableCell className="text-xs text-dash-text">{n.type}</TableCell>
                        <TableCell className="text-xs text-dash-muted">{n.channel}</TableCell>
                        <TableCell className="text-xs text-dash-text max-w-[250px]">
                          <p className="font-semibold truncate">{n.title}</p>
                          <p className="text-dash-muted truncate">{n.body}</p>
                        </TableCell>
                        <TableCell><Badge variant="outline" className={`text-[9px] font-semibold border ${statusColors[n.status] || 'bg-gray-100 text-gray-600'}`}>{n.status}</Badge></TableCell>
                        <TableCell className="text-xs text-dash-muted">{n.retryCount || 0}</TableCell>
                        <TableCell className="text-xs text-dash-muted">{new Date(n.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;
