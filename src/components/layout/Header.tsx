import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminProfile } from '@/hooks/useAdmin';
import { Search, Bell, ChevronDown, User, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

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
  const title = pageTitles[location.pathname] || 'Dashboard';

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
        <Button variant="ghost" size="icon" className="relative text-dash-muted hover:text-dash-text cursor-pointer">
          <Bell size={20} />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-dash-danger text-white text-[10px] font-bold border-2 border-white">
            3
          </Badge>
        </Button>

        {/* Admin dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 rounded-full bg-dash-purple/10 flex items-center justify-center overflow-hidden border border-dash-border">
                {adminProfile?.photo ? (
                  <img src={adminProfile.photo.startsWith('http') ? adminProfile.photo : `http://localhost:6001${adminProfile.photo}`} alt="Admin" className="w-full h-full object-cover" />
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
