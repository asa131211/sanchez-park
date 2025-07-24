'use client';

import { useState, useEffect } from 'react';
import SalesView from './sales-view';
import ProductsView from './products-view';
import UsersView from './users-view';
import ReportsView from './reports-view';
import SettingsView from './settings-view';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  ShoppingCart,
  Home,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { db } from '@/lib/database';

interface ViewProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

// Vista de Dashboard (Solo Admin)
function DashboardView() {
  const [dashboardData, setDashboardData] = useState({
    todaySales: 0,
    totalTransactions: 0,
    totalProducts: 0,
    totalUsers: 0,
    cashAmount: 0,
    transferAmount: 0,
    salesByDay: [] as Array<{date: string, amount: number, count: number}>,
    topProducts: [] as Array<{name: string, count: number}>,
    paymentMethodsData: { cash: 0, transfer: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [sales, products, users] = await Promise.all([
        db.sales.toArray(),
        db.products.toArray(),
        db.users.toArray(),
      ]);

      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      // Ventas de hoy
      const todaySales = sales
        .filter(sale => sale.createdAt >= startOfToday)
        .reduce((total, sale) => total + sale.total, 0);

      // Efectivo vs Transferencia
      const cashSales = sales.filter(s => s.paymentMethod === 'efectivo');
      const transferSales = sales.filter(s => s.paymentMethod === 'transferencia');
      const cashAmount = cashSales.reduce((total, sale) => total + sale.total, 0);
      const transferAmount = transferSales.reduce((total, sale) => total + sale.total, 0);

      // Ventas por día (últimos 7 días)
      const salesByDay = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

        const daySales = sales.filter(sale =>
          sale.createdAt >= startOfDay && sale.createdAt < endOfDay
        );

        salesByDay.push({
          date: date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
          amount: daySales.reduce((total, sale) => total + sale.total, 0),
          count: daySales.length
        });
      }

      // Productos más vendidos
      const productSales = new Map<string, number>();
      sales.forEach(sale => {
        sale.products.forEach(product => {
          const current = productSales.get(product.productName) || 0;
          productSales.set(product.productName, current + product.quantity);
        });
      });

      const topProducts = Array.from(productSales.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setDashboardData({
        todaySales,
        totalTransactions: sales.length,
        totalProducts: products.length,
        totalUsers: users.length,
        cashAmount,
        transferAmount,
        salesByDay,
        topProducts,
        paymentMethodsData: {
          cash: cashSales.length,
          transfer: transferSales.length
        }
      });
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const maxSaleAmount = Math.max(...dashboardData.salesByDay.map(d => d.amount), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Hoy</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/{dashboardData.todaySales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Ingresos del día actual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transacciones</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Total de ventas realizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              En catálogo actual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Administradores y vendedores
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos y estadísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas por día */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas por Día (Última Semana)</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.salesByDay.length === 0 || maxSaleAmount === 1 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No hay ventas registradas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData.salesByDay.map((day, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{day.date}</span>
                      <span className="font-medium">S/{day.amount.toFixed(2)} ({day.count} ventas)</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${(day.amount / maxSaleAmount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Métodos de pago */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas por Método de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.cashAmount === 0 && dashboardData.transferAmount === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No hay ventas registradas</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      Efectivo
                    </span>
                    <span className="font-semibold">S/{dashboardData.cashAmount.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${dashboardData.cashAmount + dashboardData.transferAmount > 0
                          ? (dashboardData.cashAmount / (dashboardData.cashAmount + dashboardData.transferAmount)) * 100
                          : 0}%`
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground">{dashboardData.paymentMethodsData.cash} transacciones</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      Transferencia
                    </span>
                    <span className="font-semibold">S/{dashboardData.transferAmount.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${dashboardData.cashAmount + dashboardData.transferAmount > 0
                          ? (dashboardData.transferAmount / (dashboardData.cashAmount + dashboardData.transferAmount)) * 100
                          : 0}%`
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground">{dashboardData.paymentMethodsData.transfer} transacciones</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Productos más vendidos */}
      <Card>
        <CardHeader>
          <CardTitle>Productos Más Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardData.topProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay productos vendidos aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboardData.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    {product.name}
                  </span>
                  <Badge variant="secondary">{product.count} vendidos</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Vista de Productos (Solo Admin)
function ProductsViewTemp() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Productos</h1>
        <Button>
          <Package className="w-4 h-4 mr-2" />
          Agregar Producto
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestión de Productos</CardTitle>
          <CardDescription>
            Administra el catálogo de juegos disponibles para la venta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Funcionalidad en desarrollo...</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Vista de Usuarios (Solo Admin)
function UsersViewTemp() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Usuarios</h1>
        <Button>
          <Users className="w-4 h-4 mr-2" />
          Agregar Usuario
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestión de Usuarios</CardTitle>
          <CardDescription>
            Administra los usuarios del sistema y sus roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Funcionalidad en desarrollo...</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Vista de Reportes (Solo Admin)
function ReportsViewTemp() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Reportes</h1>

      <Card>
        <CardHeader>
          <CardTitle>Reportes de Ventas</CardTitle>
          <CardDescription>
            Análisis detallado de las ventas por período, vendedor y método de pago
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Funcionalidad en desarrollo...</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Vista de Configuración
function SettingsViewTemp() {
  const { currentUser, darkMode, toggleDarkMode } = useAppStore();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configuración</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Perfil de Usuario</CardTitle>
            <CardDescription>
              Personaliza tu información personal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-sm font-medium">Nombre:</span>
              <p className="text-muted-foreground">{currentUser?.name}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Usuario:</span>
              <p className="text-muted-foreground">{currentUser?.username}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Rol:</span>
              <p className="text-muted-foreground capitalize">{currentUser?.role}</p>
            </div>
            <Button variant="outline">Editar Perfil</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferencias</CardTitle>
            <CardDescription>
              Configura la apariencia y comportamiento del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Modo Oscuro</span>
              <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
            </div>
            <div>
              <span className="text-sm font-medium">Atajos Personalizados</span>
              <p className="text-muted-foreground text-sm">Configura atajos de teclado personalizados</p>
              <Button variant="outline" className="mt-2">Configurar Atajos</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AppViews({ activeView, setActiveView }: ViewProps) {
  const { currentUser } = useAppStore();

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return currentUser?.role === 'admin' ? <DashboardView /> : <SalesView />;
      case 'sales':
        return <SalesView />;
      case 'products':
        return currentUser?.role === 'admin' ? <ProductsView /> : <SalesView />;
      case 'users':
        return currentUser?.role === 'admin' ? <UsersView /> : <SalesView />;
      case 'reports':
        return currentUser?.role === 'admin' ? <ReportsView /> : <SalesView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <SalesView />;
    }
  };

  return renderView();
}
