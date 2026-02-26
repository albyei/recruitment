import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  Kanban,
  Calendar,
  BarChart3,
  Briefcase,
  Newspaper,
  ClipboardList,
  Inbox,
  Settings,
  Shield,
  Building2,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import logoWowrack from '@/assets/wowrack-logo.png';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  roles: AppRole[];
}

const navItems: NavItem[] = [
  // HR items
  { path: '/hr', label: 'HR Dashboard', icon: LayoutDashboard, roles: ['hr'] },
  { path: '/hr/requisitions', label: 'Requisitions', icon: FileText, badge: 3, roles: ['hr'] },
  { path: '/hr/job-openings', label: 'Job Openings', icon: Briefcase, roles: ['hr'] },
  { path: '/hr/candidates', label: 'Candidates', icon: Users, roles: ['hr'] },
  { path: '/hr/pipeline', label: 'Pipeline', icon: Kanban, roles: ['hr'] },
  { path: '/hr/interviews', label: 'Interviews', icon: Calendar, roles: ['hr'] },
  { path: '/hr/analytics', label: 'Analytics', icon: BarChart3, roles: ['hr'] },
  { path: '/hr/news', label: 'News & Culture', icon: Newspaper, roles: ['hr'] },
  { path: '/hr/surveys', label: 'Surveys', icon: ClipboardList, roles: ['hr'] },

  // Hiring Manager items
  { path: '/hiring-manager', label: 'Manager Dashboard', icon: LayoutDashboard, roles: ['hiring-manager'] },
  { path: '/hiring-manager/mpp', label: 'MPP Request', icon: FileText, roles: ['hiring-manager'] },
  { path: '/hiring-manager/recruitment', label: 'Recruitment', icon: Users, roles: ['hiring-manager'] },
  { path: '/hiring-manager/inbox', label: 'Inbox', icon: Inbox, roles: ['hiring-manager'] },

  // Admin items
  { path: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { path: '/admin/users', label: 'User Management', icon: Users, roles: ['admin'] },
  { path: '/admin/departments', label: 'Departments', icon: Building2, roles: ['admin'] },
  { path: '/admin/settings', label: 'Settings', icon: Settings, roles: ['admin'] },
];

const roleSections: { role: AppRole; label: string; icon: React.ElementType }[] = [
  { role: 'hr', label: 'HR Portal', icon: Users },
  { role: 'hiring-manager', label: 'Hiring Manager', icon: Building2 },
  { role: 'admin', label: 'Admin', icon: Shield },
];

export default function InternalLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasRole } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isActive = (path: string) => {
    // Exact match for dashboard roots
    if (path === '/hr' || path === '/hiring-manager' || path === '/admin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const userRoles = user.roles;
  const visibleSections = roleSections.filter((s) => userRoles.includes(s.role));

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b z-50 flex items-center px-4">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <img src={logoWowrack} alt="Wowrack" className="h-7 ml-3" />
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 bg-background border-r z-50 transition-transform duration-300',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b">
            <Link to="/">
              <img src={logoWowrack} alt="Wowrack" className="h-8" />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>
                  {user.name.split(' ').map((n) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.position}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {user.roles.map((role) => (
                <Badge key={role} variant="secondary" className="text-[10px] px-1.5 py-0">
                  {role === 'hr' ? 'HR' : role === 'hiring-manager' ? 'Manager' : 'Admin'}
                </Badge>
              ))}
            </div>
          </div>

          {/* Navigation grouped by role */}
          <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
            {visibleSections.map((section, idx) => {
              const sectionItems = navItems.filter((item) => item.roles.includes(section.role));
              const SectionIcon = section.icon;
              return (
                <div key={section.role}>
                  {idx > 0 && <Separator className="mb-4" />}
                  <div className="flex items-center gap-2 px-3 mb-2">
                    <SectionIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {section.label}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {sectionItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                            isActive(item.path)
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          {item.label}
                          {item.badge && (
                            <Badge variant="secondary" className="ml-auto">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen overflow-y-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
