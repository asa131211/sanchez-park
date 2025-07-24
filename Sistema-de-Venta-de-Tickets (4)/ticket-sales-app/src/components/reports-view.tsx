'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Calendar,
  Download,
  Filter,
  CreditCard,
  Banknote,
} from 'lucide-react';
import { db, type Sale, type User, type CashBox } from '@/lib/database';
import { useAppStore } from '@/lib/store';
import { format, startOfDay, endOfDay, startOfWeek, startOfMonth } from 'date-fns';

interface SaleReport {
  id: number;
  date: Date;
  user: string;
  total: number;
  paymentMethod: string;
  products: string;
  cashBoxId: number;
}

interface UserSalesReport {
  userId: number;
  userName: string;
  totalSales: number;
  totalAmount: number;
  cashSales: number;
  cashAmount: number;
  transferSales: number;
  transferAmount: number;
  avgSale: number;
}

export default function ReportsView() {
  const { currentUser } = useAppStore();
  const [sales, setSales] = useState<Sale[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [cashBoxes, setCashBoxes] = useState<CashBox[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [dateFilter, setDateFilter] = useState('today');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReportData();
  }, []);

  useEffect(() => {
    filterSalesByDate();
  }, [sales, dateFilter]);

  const loadReportData = async () => {
    try {
      const [salesData, usersData, cashBoxesData] = await Promise.all([
        db.sales.orderBy('createdAt').reverse().toArray(),
        db.users.toArray(),
        db.cashBoxes.toArray(),
      ]);

      setSales(salesData);
      setUsers(usersData);
      setCashBoxes(cashBoxesData);
    } catch (error) {
      console.error('Error cargando datos de reportes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterSalesByDate = () => {
    const now = new Date();
    let filtered: Sale[] = [];

    switch (dateFilter) {
      case 'today':
        filtered = sales.filter(sale =>
          sale.createdAt >= startOfDay(now) && sale.createdAt <= endOfDay(now)
        );
        break;
      case 'week':
        filtered = sales.filter(sale =>
          sale.createdAt >= startOfWeek(now) && sale.createdAt <= now
        );
        break;
      case 'month':
        filtered = sales.filter(sale =>
          sale.createdAt >= startOfMonth(now) && sale.createdAt <= now
        );
        break;
      default:
        filtered = sales;
    }

    setFilteredSales(filtered);
  };

  const generateSalesReport = (): SaleReport[] => {
    return filteredSales.map(sale => {
      const user = users.find(u => u.id === sale.userId);
      return {
        id: sale.id!,
        date: sale.createdAt,
        user: user?.name || 'Usuario desconocido',
        total: sale.total,
        paymentMethod: sale.paymentMethod === 'efectivo' ? 'Efectivo' : 'Transferencia',
        products: sale.products.map(p => `${p.quantity}x ${p.productName}`).join(', '),
        cashBoxId: sale.cashBoxId,
      };
    });
  };

  const generateUserSalesReport = () => {
    const userSales = new Map<number, {
      totalSales: number;
      totalAmount: number;
      cashSales: number;
      cashAmount: number;
      transferSales: number;
      transferAmount: number;
    }>();

    filteredSales.forEach(sale => {
      const existing = userSales.get(sale.userId) || {
        totalSales: 0,
        totalAmount: 0,
        cashSales: 0,
        cashAmount: 0,
        transferSales: 0,
        transferAmount: 0
      };

      const isCash = sale.paymentMethod === 'efectivo';

      userSales.set(sale.userId, {
        totalSales: existing.totalSales + 1,
        totalAmount: existing.totalAmount + sale.total,
        cashSales: existing.cashSales + (isCash ? 1 : 0),
        cashAmount: existing.cashAmount + (isCash ? sale.total : 0),
        transferSales: existing.transferSales + (isCash ? 0 : 1),
        transferAmount: existing.transferAmount + (isCash ? 0 : sale.total),
      });
    });

    return Array.from(userSales.entries()).map(([userId, data]) => {
      const user = users.find(u => u.id === userId);
      return {
        userId,
        userName: user?.name || 'Usuario desconocido',
        ...data,
        avgSale: data.totalSales > 0 ? data.totalAmount / data.totalSales : 0,
      };
    }).sort((a, b) => b.totalAmount - a.totalAmount);
  };

  const getTotalStats = () => {
    const totalSales = filteredSales.length;
    const totalAmount = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const avgSale = totalSales > 0 ? totalAmount / totalSales : 0;

    const cashSales = filteredSales.filter(s => s.paymentMethod === 'efectivo');
    const transferSales = filteredSales.filter(s => s.paymentMethod === 'transferencia');

    return {
      totalSales,
      totalAmount,
      avgSale,
      cashSales: cashSales.length,
      cashAmount: cashSales.reduce((sum, sale) => sum + sale.total, 0),
      transferSales: transferSales.length,
      transferAmount: transferSales.reduce((sum, sale) => sum + sale.total, 0),
    };
  };

  const stats = getTotalStats();
  const salesReport = generateSalesReport();
  const userSalesReport = generateUserSalesReport();

  const exportToCSV = () => {
    const headers = ['Fecha', 'Vendedor', 'Total', 'Método de Pago', 'Productos'];
    const rows = salesReport.map(sale => [
      format(sale.date, 'dd/MM/yyyy HH:mm'),
      sale.user,
      `S/${sale.total.toFixed(2)}`,
      sale.paymentMethod,
      sale.products,
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-ventas-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reportes</h1>

        <div className="flex items-center gap-4">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="all">Todo el período</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
            <p className="text-xs text-muted-foreground">
              Promedio: S/{stats.avgSale.toFixed(2)} por venta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/{stats.totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {dateFilter === 'today' ? 'Hoy' :
               dateFilter === 'week' ? 'Esta semana' :
               dateFilter === 'month' ? 'Este mes' : 'Total'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efectivo</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/{stats.cashAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.cashSales} ventas en efectivo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transferencias</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/{stats.transferAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.transferSales} transferencias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de reportes */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Detalle de Ventas</TabsTrigger>
          <TabsTrigger value="users">Por Vendedor</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Ventas</CardTitle>
              <CardDescription>
                Detalle de todas las ventas realizadas en el período seleccionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {salesReport.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                  <p>No hay ventas en el período seleccionado</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Vendedor</TableHead>
                      <TableHead>Productos</TableHead>
                      <TableHead>Método de Pago</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesReport.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="text-muted-foreground">
                          {format(sale.date, 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                        <TableCell>{sale.user}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {sale.products}
                        </TableCell>
                        <TableCell>
                          <Badge variant={sale.paymentMethod === 'Efectivo' ? 'default' : 'secondary'}>
                            {sale.paymentMethod === 'Efectivo' ? (
                              <Banknote className="w-3 h-3 mr-1" />
                            ) : (
                              <CreditCard className="w-3 h-3 mr-1" />
                            )}
                            {sale.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          S/{sale.total.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por Vendedor</CardTitle>
              <CardDescription>
                Análisis de ventas agrupadas por cada vendedor
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userSalesReport.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4" />
                  <p>No hay datos de vendedores en el período seleccionado</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {userSalesReport.map((userReport) => (
                    <Card key={userReport.userId} className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold">{userReport.userName}</h4>
                        <Badge variant="outline" className="text-lg px-3 py-1">
                          {userReport.totalSales} ventas totales
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Total General */}
                        <div className="bg-primary/10 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-primary">
                            S/{userReport.totalAmount.toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">Total Vendido</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Promedio: S/{userReport.avgSale.toFixed(2)}
                          </div>
                        </div>

                        {/* Efectivo */}
                        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Banknote className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-green-800 dark:text-green-200">Efectivo</span>
                          </div>
                          <div className="text-xl font-bold text-green-700 dark:text-green-300">
                            S/{userReport.cashAmount.toFixed(2)}
                          </div>
                          <div className="text-sm text-green-600 dark:text-green-400">
                            {userReport.cashSales} ventas
                          </div>
                          <div className="text-xs text-green-500 dark:text-green-500 mt-1">
                            {userReport.totalSales > 0 ? Math.round((userReport.cashSales / userReport.totalSales) * 100) : 0}% del total
                          </div>
                        </div>

                        {/* Transferencia */}
                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <CreditCard className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-blue-800 dark:text-blue-200">Transferencia</span>
                          </div>
                          <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                            S/{userReport.transferAmount.toFixed(2)}
                          </div>
                          <div className="text-sm text-blue-600 dark:text-blue-400">
                            {userReport.transferSales} ventas
                          </div>
                          <div className="text-xs text-blue-500 dark:text-blue-500 mt-1">
                            {userReport.totalSales > 0 ? Math.round((userReport.transferSales / userReport.totalSales) * 100) : 0}% del total
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
