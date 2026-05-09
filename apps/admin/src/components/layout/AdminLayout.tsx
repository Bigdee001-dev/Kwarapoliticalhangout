import React from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  FileText, 
  Users, 
  Settings, 
  Mail, 
  AlertTriangle, 
  Database, 
  LayoutDashboard, 
  ChevronRight,
  LogOut,
  Menu,
  User,
  Tags,
  MessageSquare,
  Search,
  Bell,
  Megaphone
} from 'lucide-react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup,
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '../../store/authStore';
import { Separator } from '@/components/ui/separator';

const navSections = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    ]
  },
  {
    label: 'Content',
    items: [
      { label: 'Articles', icon: FileText, path: '/admin/articles' },
      { label: 'People', icon: User, path: '/admin/people' },
      { label: 'Categories', icon: Tags, path: '/admin/categories' },
    ]
  },
  {
    label: 'Community',
    items: [
      { label: 'Writers', icon: Users, path: '/admin/writers' },
      { label: 'Tips & Leads', icon: MessageSquare, path: '/admin/tips' },
    ]
  },
  {
    label: 'Distribution',
    items: [
      { label: 'Newsletter', icon: Mail, path: '/admin/newsletter' },
      { label: 'Ad Manager', icon: Megaphone, path: '/admin/ads' },
    ]
  },
  {
    label: 'System',
    items: [
      { label: 'Errors', icon: AlertTriangle, path: '/admin/errors' },
      { label: 'Settings', icon: Settings, path: '/admin/settings' },
    ]
  }
];

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/admin') return 'Dashboard';
    const item = navSections.flatMap(s => s.items).find(i => i.path === path);
    return item?.label || 'Editor';
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar className="border-r border-white/10 bg-zinc-950 dark" collapsible="icon">
          <SidebarHeader className="h-16 flex items-center justify-center border-b border-white/5 px-6">
            <Link to="/admin" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-kph-red text-xs font-black text-white shadow-lg shadow-kph-red/20 text-shadow-sm">
                KPH
              </div>
              <span className="font-serif text-lg font-bold text-white group-data-[collapsible=icon]:hidden">
                Admin <span className="text-kph-red">Portal</span>
              </span>
            </Link>
          </SidebarHeader>

          <SidebarContent className="px-3 py-6 custom-scrollbar space-y-4">
            {navSections.map((section) => (
              <SidebarGroup key={section.label} className="py-0">
                <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80 px-3 py-1 mb-2 group-data-[collapsible=icon]:hidden">
                  {section.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-1">
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton 
                          render={<Link to={item.path} />}
                          isActive={location.pathname === item.path}
                          className={`
                            w-full transition-all duration-200 group/item relative h-10 px-3 rounded-lg
                            ${location.pathname === item.path 
                              ? 'bg-white/15 text-white font-black shadow-lg shadow-black/40 ring-1 ring-white/20' 
                              : 'text-zinc-200/90 hover:text-white hover:bg-white/10 font-bold'}
                          `}
                        >
                          {location.pathname === item.path && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-kph-red shadow-[0_0_12px_rgba(255,0,0,0.6)]" />
                          )}
                          <item.icon className={`h-5 w-5 shrink-0 transition-colors ${location.pathname === item.path ? 'text-kph-red' : 'group-hover/item:text-white'}`} />
                          <span className="truncate">{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter className="border-t border-white/5 p-4 bg-zinc-950/50">
            <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center px-2">
              <Avatar className="h-8 w-8 border border-white/10">
                <AvatarImage src={user?.photoURL || ''} />
                <AvatarFallback className="bg-kph-charcoal text-white text-[10px]">
                  {user?.displayName?.substring(0, 2).toUpperCase() || 'AD'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
                <span className="text-xs font-bold text-white truncate">{user?.displayName || 'Admin User'}</span>
                <span className="text-[9px] uppercase tracking-wider text-kph-red font-black">{userRole}</span>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1 min-w-0 bg-white">
          <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-white/80 backdrop-blur-md px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-kph-charcoal" />
              <Separator orientation="vertical" className="h-4" />
              <div className="flex flex-col">
                <h1 className="font-serif text-lg font-bold text-kph-charcoal leading-none">{getPageTitle()}</h1>
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-500">KPH Intelligence</span>
                  <ChevronRight className="h-3 w-3 text-neutral-400 stroke-[3px]" />
                  <span className="text-[10px] font-black text-kph-red uppercase tracking-[0.15em]">{getPageTitle()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-kph-charcoal/60" />
                <input 
                  type="text" 
                  placeholder="Search intelligence, articles..." 
                  className="h-10 w-80 rounded-lg border-neutral-300 bg-neutral-50 pl-10 pr-4 text-xs font-bold text-kph-charcoal placeholder:text-neutral-500 placeholder:font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-kph-red/20 border-2 transition-all shadow-sm"
                />
              </div>

              <Button variant="ghost" size="icon" className="relative text-kph-charcoal">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-kph-red border-2 border-white" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      className="h-8 w-8 rounded-full p-0 overflow-hidden outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black/10 transition-all"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.photoURL || ''} />
                        <AvatarFallback className="bg-kph-charcoal text-white text-xs">U</AvatarFallback>
                      </Avatar>
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-56 mt-2">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" /> Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" /> System Config
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 p-6 lg:p-8 bg-neutral-50 overflow-y-auto">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
