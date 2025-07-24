'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  activeView: string;
  setActiveView: (view: string) => void;
}

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  adminOnly?: boolean;
}

const menuItems: MenuItem[] = [
  { icon: Home, label: 'Inicio', value: 'dashboard', adminOnly: true },
  { icon: ShoppingCart, label: 'Ventas', value: 'sales' },
  { icon: Package, label: 'Productos', value: 'products', adminOnly: true },
  { icon: Users, label: 'Usuarios', value: 'users', adminOnly: true },
  { icon: BarChart3, label: 'Reportes', value: 'reports', adminOnly: true },
  { icon: Settings, label: 'Configuración', value: 'settings' },
];

export default function AppLayout({ children, activeView, setActiveView }: AppLayoutProps) {
  const {
    currentUser,
    darkMode,
    sidebarOpen,
    isOnline,
    logout,
    toggleDarkMode,
    toggleSidebar,
  } = useAppStore();

  // Aplicar tema oscuro
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Monitorear estado de conexión
  useEffect(() => {
    const handleOnline = () => useAppStore.getState().setOnlineStatus(true);
    const handleOffline = () => useAppStore.getState().setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const filteredMenuItems = menuItems.filter(
    item => !item.adminOnly || currentUser?.role === 'admin'
  );

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Barra Superior */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="lg:hidden"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg">SistemaVentas</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Indicador de conexión */}
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <Badge variant={isOnline ? 'default' : 'destructive'} className="text-xs">
                {isOnline ? 'En línea' : 'Sin conexión'}
              </Badge>
            </div>

            {/* Menú de usuario */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUser?.profilePhoto || ""} alt={currentUser?.name} />
                    <AvatarFallback>
                      {currentUser?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">{currentUser?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {currentUser?.username} • {currentUser?.role}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center justify-between">
                  <div className="flex items-center">
                    {darkMode ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
                    Modo {darkMode ? 'oscuro' : 'claro'}
                  </div>
                  <Switch
                    checked={darkMode}
                    onCheckedChange={toggleDarkMode}
                  />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Barra Lateral */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 top-16 z-40 w-64 bg-background border-r transition-transform duration-300',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            'lg:relative lg:top-0 lg:translate-x-0'
          )}
        >
          <nav className="flex flex-col gap-2 p-4">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.value}
                  variant={activeView === item.value ? 'default' : 'ghost'}
                  className="justify-start gap-3 h-11"
                  onClick={() => setActiveView(item.value)}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </aside>

        {/* Contenido Principal */}
        <main className="flex-1 min-h-screen">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}
