import { useState } from 'react';
import { useSendNotification, useProcessQueue, useUserNotifications } from '@/hooks/useNotifications';
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
import { Bell, Send, Play, Loader2, Search } from 'lucide-react';
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

  const [type, setType] = useState('SYSTEM');
  const [channel, setChannel] = useState('IN_APP');
  const [lookupUserId, setLookupUserId] = useState('');
  const [searchUserId, setSearchUserId] = useState('');

  const { data: userNotifs, isLoading: notifsLoading } = useUserNotifications(lookupUserId);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NotifForm>({
    resolver: zodResolver(notifSchema),
  });

  const onSend = async (data: NotifForm) => {
    try {
      await sendNotif.mutateAsync({ ...data, type, channel });
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
                <Label className="text-sm">User ID *</Label>
                <Input {...register('userId')} className="border-dash-border" placeholder="Enter user ID" />
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
              <div className="flex gap-2">
                <Input value={searchUserId} onChange={e => setSearchUserId(e.target.value)} placeholder="Enter user ID" className="border-dash-border" />
                <Button onClick={() => setLookupUserId(searchUserId)} variant="outline" className="cursor-pointer"><Search size={14} /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Notifications Table */}
      {lookupUserId && (
        <Card className="border-dash-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-dash-text">
              Notifications for user ...{lookupUserId.slice(-6)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {notifsLoading ? (
              <div className="p-6 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : !userNotifs?.length ? (
              <div className="py-12 text-center">
                <Bell className="mx-auto text-dash-muted mb-2" size={32} />
                <p className="text-sm text-dash-muted">No notifications for this user.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs text-dash-muted uppercase font-medium">Type</TableHead>
                    <TableHead className="text-xs text-dash-muted uppercase font-medium">Channel</TableHead>
                    <TableHead className="text-xs text-dash-muted uppercase font-medium">Title</TableHead>
                    <TableHead className="text-xs text-dash-muted uppercase font-medium">Status</TableHead>
                    <TableHead className="text-xs text-dash-muted uppercase font-medium">Retries</TableHead>
                    <TableHead className="text-xs text-dash-muted uppercase font-medium">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userNotifs.map(n => (
                    <TableRow key={n._id} className="hover:bg-dash-bg/60">
                      <TableCell className="text-xs text-dash-text">{n.type}</TableCell>
                      <TableCell className="text-xs text-dash-muted">{n.channel}</TableCell>
                      <TableCell className="text-sm text-dash-text max-w-[200px] truncate">{n.title}</TableCell>
                      <TableCell><Badge variant="outline" className={`text-[10px] font-semibold ${statusColors[n.status]}`}>{n.status}</Badge></TableCell>
                      <TableCell className="text-xs text-dash-muted">{n.retryCount}</TableCell>
                      <TableCell className="text-xs text-dash-muted">{new Date(n.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Notifications;
