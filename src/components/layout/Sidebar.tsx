import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Car,
  Users,
  CalendarCheck,
  MessageSquareWarning,
  Cpu,
  Activity,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Crown,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Car, label: 'Cars', path: '/dashboard/cars' },
  { icon: Users, label: 'Users', path: '/dashboard/users' },
  { icon: CalendarCheck, label: 'Bookings', path: '/dashboard/bookings' },
  { icon: MessageSquareWarning, label: 'Reclamations', path: '/dashboard/reclamations' },
  { icon: Cpu, label: 'Devices', path: '/dashboard/devices' },
  { icon: Activity, label: 'Telemetry', path: '/dashboard/telemetry' },
  { icon: Bell, label: 'Notifications', path: '/dashboard/notifications' },
  { icon: MapPin, label: 'Fleet Map', path: '/dashboard/map' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { logout, role } = useAuth();

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-white border-r border-dash-border flex flex-col transition-all duration-300 z-40',
        collapsed ? 'w-[68px]' : 'w-[250px]'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-dash-border', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="w-9 h-9 rounded-xl bg-dash-purple flex items-center justify-center shadow-sm flex-shrink-0">
          <span className="text-white font-bold text-sm font-heading">N</span>
        </div>
        {!collapsed && (
          <div className="flex items-center gap-1.5">
            <span className="font-heading font-bold text-dash-text text-lg">NexDrive</span>
            <span className="text-[10px] text-dash-muted font-medium bg-dash-bg px-1.5 py-0.5 rounded">v1.0</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const linkContent = (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group cursor-pointer',
                active
                  ? 'bg-dash-purple text-white shadow-sm'
                  : 'text-dash-muted hover:text-dash-text hover:bg-dash-bg'
              )}
            >
              <item.icon size={20} className={cn('flex-shrink-0', active ? 'text-white' : 'text-dash-muted group-hover:text-dash-text')} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.path} delayDuration={0}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return linkContent;
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4 space-y-3">
        {/* Admin profile */}
        <div className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl bg-dash-bg', collapsed && 'justify-center px-2')}>
          <div className="w-8 h-8 rounded-full bg-dash-purple/10 flex items-center justify-center flex-shrink-0">
            <span className="text-dash-purple text-xs font-bold">A</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dash-text truncate">Admin</p>
              <p className="text-xs text-dash-muted truncate">{role || 'ADMIN'}</p>
            </div>
          )}
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          onClick={logout}
          className={cn(
            'w-full text-dash-muted hover:text-dash-danger hover:bg-dash-danger/5 transition-all duration-200 cursor-pointer',
            collapsed ? 'px-2' : 'justify-start gap-3 px-3'
          )}
        >
          <LogOut size={18} />
          {!collapsed && <span className="text-sm">Logout</span>}
        </Button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-dash-border flex items-center justify-center shadow-sm hover:bg-dash-bg transition-colors cursor-pointer z-50"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
};

export default Sidebar;
