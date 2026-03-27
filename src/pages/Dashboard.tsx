import { useCars } from '@/hooks/useCars';
import { useDeviceStatuses } from '@/hooks/useDevices';
import { useUsers } from '@/hooks/useUsers';
import { useBookings } from '@/hooks/useBookings';
import { useReclamations } from '@/hooks/useReclamations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Car, Users, CalendarCheck, MessageSquareWarning, ArrowUpRight, Plus, Wifi } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const statusColors: Record<string, string> = {
  PENDING: 'bg-dash-warning/15 text-amber-700 border-dash-warning/30',
  CONFIRMED: 'bg-dash-info/15 text-blue-700 border-dash-info/30',
  ACTIVE: 'bg-dash-success/15 text-emerald-700 border-dash-success/30',
  COMPLETED: 'bg-gray-100 text-gray-600 border-gray-200',
  CANCELLED: 'bg-dash-danger/15 text-red-700 border-dash-danger/30',
  EXPIRED: 'bg-gray-100 text-gray-500 border-gray-200',
  OPEN: 'bg-dash-danger/15 text-red-700 border-dash-danger/30',
  IN_PROGRESS: 'bg-dash-warning/15 text-amber-700 border-dash-warning/30',
  RESOLVED: 'bg-dash-success/15 text-emerald-700 border-dash-success/30',
  REJECTED: 'bg-gray-100 text-gray-500 border-gray-200',
};

const Dashboard = () => {
  const { data: cars, isLoading: carsLoading } = useCars();
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: bookings, isLoading: bookingsLoading } = useBookings();
  const { data: reclamations, isLoading: reclamationsLoading } = useReclamations();
  const { data: deviceStatuses, isLoading: devicesLoading } = useDeviceStatuses();

  const activeBookings = bookings?.filter(b => b.status === 'CONFIRMED' || b.status === 'ACTIVE') || [];
  const openReclamations = reclamations?.filter(r => r.status === 'OPEN') || [];
  const recentBookings = bookings?.slice(0, 5) || [];
  const recentReclamations = reclamations?.slice(0, 5) || [];

  const stats = [
    { label: 'Total Cars', value: cars?.length || 0, icon: Car, color: 'bg-dash-purple/10 text-dash-purple', loading: carsLoading, link: '/dashboard/cars' },
    { label: 'Total Users', value: users?.length || 0, icon: Users, color: 'bg-dash-info/10 text-dash-info', loading: usersLoading, link: '/dashboard/users' },
    { label: 'Active Bookings', value: activeBookings.length, icon: CalendarCheck, color: 'bg-dash-success/10 text-dash-success', loading: bookingsLoading, link: '/dashboard/bookings' },
    { label: 'Connected Devices', value: `${deviceStatuses?.filter(d => d.isConnected).length || 0} / ${deviceStatuses?.length || 0}`, icon: Wifi, color: 'bg-emerald-500/10 text-emerald-500', loading: devicesLoading, link: '/dashboard/devices' },
    { label: 'Open Reclamations', value: openReclamations.length, icon: MessageSquareWarning, color: 'bg-dash-danger/10 text-dash-danger', loading: reclamationsLoading, link: '/dashboard/reclamations' },
  ];

  return (
    <div className="space-y-6 font-inter">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dash-text">Hello Admin 👋</h2>
          <p className="text-dash-muted text-sm mt-1">Here's what's happening with your fleet today.</p>
        </div>
        <Link to="/dashboard/cars">
          <Button className="bg-dash-purple hover:bg-dash-purple/90 text-white gap-2 cursor-pointer">
            <Plus size={16} />
            Add Car
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.link}>
            <Card className="hover:shadow-md transition-all duration-200 cursor-pointer border-dash-border hover:-translate-y-0.5">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    {stat.loading ? (
                      <Skeleton className="h-8 w-16 mb-1" />
                    ) : (
                      <p className="text-3xl font-bold text-dash-text">{stat.value.toLocaleString()}</p>
                    )}
                    <p className="text-sm text-dash-muted mt-1">{stat.label}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                    <stat.icon size={22} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card className="border-dash-border">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-semibold text-dash-text">Recent Bookings</CardTitle>
            <Link to="/dashboard/bookings" className="text-dash-purple text-xs font-medium flex items-center gap-1 hover:underline cursor-pointer">
              View all <ArrowUpRight size={12} />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {bookingsLoading ? (
              <div className="px-6 pb-4 space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="px-6 pb-6 text-center">
                <CalendarCheck className="mx-auto text-dash-muted mb-2" size={32} />
                <p className="text-sm text-dash-muted">No bookings yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-t border-dash-border">
                      <th className="text-left px-6 py-3 text-xs text-dash-muted font-medium uppercase tracking-wider">Car</th>
                      <th className="text-left px-4 py-3 text-xs text-dash-muted font-medium uppercase tracking-wider">Dates</th>
                      <th className="text-left px-4 py-3 text-xs text-dash-muted font-medium uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((b) => (
                      <tr key={b._id} className="border-t border-dash-border hover:bg-dash-bg/60 transition-colors">
                        <td className="px-6 py-3 text-xs text-dash-text font-medium">{b.car ? `${b.car.marque} — ${b.car.matricule}` : b.carId?.slice(-6)}</td>
                        <td className="px-4 py-3 text-xs text-dash-muted">
                          {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-[10px] font-semibold border ${statusColors[b.status] || 'bg-gray-100 text-gray-600'}`}>
                            {b.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Reclamations */}
        <Card className="border-dash-border">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-semibold text-dash-text">Recent Reclamations</CardTitle>
            <Link to="/dashboard/reclamations" className="text-dash-purple text-xs font-medium flex items-center gap-1 hover:underline cursor-pointer">
              View all <ArrowUpRight size={12} />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {reclamationsLoading ? (
              <div className="px-6 pb-4 space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : recentReclamations.length === 0 ? (
              <div className="px-6 pb-6 text-center">
                <MessageSquareWarning className="mx-auto text-dash-muted mb-2" size={32} />
                <p className="text-sm text-dash-muted">No reclamations</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-t border-dash-border">
                      <th className="text-left px-6 py-3 text-xs text-dash-muted font-medium uppercase tracking-wider">User</th>
                      <th className="text-left px-4 py-3 text-xs text-dash-muted font-medium uppercase tracking-wider">Car</th>
                      <th className="text-left px-4 py-3 text-xs text-dash-muted font-medium uppercase tracking-wider">Message</th>
                      <th className="text-left px-4 py-3 text-xs text-dash-muted font-medium uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentReclamations.map((r) => (
                      <tr key={r._id} className="border-t border-dash-border hover:bg-dash-bg/60 transition-colors">
                        <td className="px-6 py-3 text-xs text-dash-text font-medium">{r.user?.fullName || r.userId?.slice(-6)}</td>
                        <td className="px-4 py-3 text-xs text-dash-muted">{r.car ? `${r.car.marque} — ${r.car.matricule}` : '—'}</td>
                        <td className="px-4 py-3 text-xs text-dash-muted max-w-[200px] truncate">{r.message}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-[10px] font-semibold border ${statusColors[r.status] || 'bg-gray-100 text-gray-600'}`}>
                            {r.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
