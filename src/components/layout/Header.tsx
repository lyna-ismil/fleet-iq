import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminProfile } from '@/hooks/useAdmin';
import { Search, Bell, ChevronDown, User, Settings, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useRecentNotifications } from '@/hooks/useNotifications';
import { ScrollArea } from '@/components/ui/scroll-area';

const notifIcons: Record<string, any> = {
  SYSTEM: Info,
  ALERT: AlertCircle,
  BOOKING_CONFIRMED: CheckCircle,
  BOOKING_CANCELLED: AlertCircle,
};

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/cars': 'Cars Management',
  '/dashboard/users': 'Users Management',
  '/dashboard/bookings': 'Bookings',
  '/dashboard/reclamations': 'Reclamations',
  '/dashboard/devices': 'Devices',
  '/dashboard/telemetry': 'Telemetry',
  '/dashboard/map': 'Fleet Map',
  '/dashboard/notifications': 'Notifications',
  '/dashboard/settings': 'Settings',
};

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, role, adminId } = useAuth();
  const { data: adminProfile } = useAdminProfile(adminId);
  const { data: recentNotifs } = useRecentNotifications();
  const title = pageTitles[location.pathname] || 'Dashboard';
  
  const unreadCount = recentNotifs?.filter(n => n.status !== 'READ').length || 0;

  return (
    <header className="h-16 bg-white border-b border-dash-border flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left: Title */}
      <div>
        <h1 className="text-xl font-heading font-bold text-dash-text">{title}</h1>
      </div>

      {/* Right: Search + Notifications + Profile */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dash-muted" />
          <Input
            placeholder="Search..."
            className="w-64 h-9 pl-9 bg-dash-bg border-dash-border text-sm focus:border-dash-purple focus:ring-dash-purple/20"
          />
        </div>

        {/* Notification bell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-dash-muted hover:text-dash-text cursor-pointer">
              <Bell size={20} />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-dash-danger text-white text-[10px] font-bold border-2 border-white">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="font-inter font-semibold">Recent Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className="h-[300px]">
              {recentNotifs?.length ? (
                <DropdownMenuGroup>
                  {recentNotifs.map((notif) => {
                    const Icon = notifIcons[notif.type] || Bell;
                    return (
                      <DropdownMenuItem key={notif._id} className="cursor-pointer flex flex-col items-start gap-1 py-3 px-4 outline-none border-b border-dash-border last:border-0 hover:bg-dash-bg shadow-none focus:bg-dash-bg">
                        <div className="flex items-center gap-2 text-dash-text w-full">
                          <Icon size={14} className="text-dash-purple mt-0.5 shrink-0" />
                          <p className="text-sm font-medium leading-tight">{notif.title}</p>
                        </div>
                        <p className="text-xs text-dash-muted pl-6">{notif.user?.name} {notif.user?.email ? `(${notif.user.email})` : ''}</p>
                        <div className="pl-6 pt-1 flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] uppercase px-1 py-0 h-4">{notif.type}</Badge>
                          <span className="text-[10px] text-dash-muted">{new Date(notif.createdAt).toLocaleDateString()}</span>
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuGroup>
              ) : (
                <div className="py-8 text-center text-sm text-dash-muted">No recent notifications</div>
              )}
            </ScrollArea>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/dashboard/notifications')} className="cursor-pointer flex justify-center text-xs text-dash-purple font-medium">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Admin dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 rounded-full bg-dash-purple/10 flex items-center justify-center overflow-hidden border border-dash-border">
                {adminProfile?.photo ? (
                  <img src={adminProfile.photo.startsWith('http') ? adminProfile.photo : `${import.meta.env.VITE_ADMIN_SERVICE_URL || 'http://localhost:6000'}${adminProfile.photo}`} alt="Admin" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-dash-purple text-sm font-bold">{adminProfile?.name?.charAt(0)?.toUpperCase() || 'A'}</span>
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-dash-text leading-tight">{adminProfile?.name || 'Loading...'}</p>
                <p className="text-xs text-dash-muted leading-tight">{role || 'ADMIN'}</p>
              </div>
              <ChevronDown size={14} className="text-dash-muted" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate('/dashboard/settings')} className="cursor-pointer">
              <User size={14} className="mr-2" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/dashboard/settings')} className="cursor-pointer">
              <Settings size={14} className="mr-2" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-dash-danger cursor-pointer">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
