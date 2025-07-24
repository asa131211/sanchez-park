'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Printer,
  X,
  DoorOpen,
  DoorClosed,
  AlertCircle,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { db, type Product, type Sale } from '@/lib/database';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

export default function SalesView() {
  const {
    cart,
    currentUser,
    currentCashBox,
    products,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    openCashBox,
    closeCashBox,
    setProducts,
  } = useAppStore();

  const [showProcessModal, setShowProcessModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [isProcessing, setIsProcessing] = useState(false);

  // Cargar productos
  useEffect(() => {
    loadProducts();
  }, [setProducts]);

  // Atajos de teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Solo funcionar si no estamos escribiendo en un input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'enter':
          e.preventDefault();
          if (showProcessModal) {
            // Si el modal está abierto, confirmar venta (segundo ENTER)
            if (!isProcessing) {
              handleProcessSale();
            }
          } else if (cart.length > 0 && currentCashBox) {
            // Si hay productos en carrito, procesar venta (primer ENTER)
            setShowProcessModal(true);
          }
          break;
        case 'x':
          // Limpiar carrito
          if (cart.length > 0) {
            clearCart();
          }
          break;
        case 'p':
          // Abrir/cerrar caja
          if (currentCashBox) {
            handleCloseCashBox();
          } else {
            handleOpenCashBox();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [cart, currentCashBox, showProcessModal, isProcessing]);

  // Atajos personalizados de productos
  useEffect(() => {
    const handleProductShortcuts = async (e: KeyboardEvent) => {
      // Solo funcionar si no estamos escribiendo en un input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (!currentUser || !currentCashBox) return;

      try {
        // Obtener atajos del usuario actual
        const user = await db.users.get(currentUser.id!);
        if (!user?.shortcuts) return;

        // Parsear atajos: "key:productId:productName"
        for (const shortcutString of user.shortcuts) {
          const [key, productIdStr, productName] = shortcutString.split(':');
          const productId = parseInt(productIdStr);

          if (e.key.toLowerCase() === key.toLowerCase()) {
            // Encontrar el producto
            const product = products.find(p => p.id === productId);
            if (product) {
              addToCart(product);
              e.preventDefault();
              break;
            }
          }
        }
      } catch (error) {
        console.error('Error procesando atajos:', error);
      }
    };

    window.addEventListener('keydown', handleProductShortcuts);
    return () => window.removeEventListener('keydown', handleProductShortcuts);
  }, [currentUser, currentCashBox, products, addToCart]);

  const loadProducts = async () => {
    try {
      const productsData = await db.products.toArray();
      setProducts(productsData);
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  };

  const cartTotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);

  const handleOpenCashBox = async () => {
    if (!currentUser) return;

    try {
      const newCashBox = await db.cashBoxes.add({
        userId: currentUser.id!,
        openedAt: new Date(),
        isOpen: true,
      });

      const cashBox = await db.cashBoxes.get(newCashBox);
      if (cashBox) {
        openCashBox(cashBox);
      }
    } catch (error) {
      console.error('Error abriendo caja:', error);
    }
  };

  const handleCloseCashBox = async () => {
    if (!currentCashBox) return;

    try {
      await db.cashBoxes.update(currentCashBox.id!, {
        closedAt: new Date(),
        isOpen: false,
      });
      closeCashBox();
    } catch (error) {
      console.error('Error cerrando caja:', error);
    }
  };

  const handleProcessSale = async () => {
    if (!currentUser || !currentCashBox || cart.length === 0) return;

    setIsProcessing(true);
    try {
      const sale: Omit<Sale, 'id'> = {
        userId: currentUser.id!,
        products: cart.map(item => ({
          productId: item.product.id!,
          productName: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
        })),
        total: cartTotal,
        paymentMethod,
        cashBoxId: currentCashBox.id!,
        createdAt: new Date(),
      };

      await db.sales.add(sale);

      // Imprimir automáticamente
      handlePrintSeparateTickets();

      clearCart();
      setShowProcessModal(false);
      toast.success('Venta procesada e impresa exitosamente', {
        description: 'Los tickets se han generado automáticamente'
      });
    } catch (error) {
      console.error('Error procesando venta:', error);
      toast.error('Error al procesar la venta', {
        description: 'Inténtalo nuevamente'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintSeparateTickets = () => {
    // Crear tickets individuales por cada unidad de producto
    const individualTickets: Array<{product: Product, unitNumber: number, totalUnits: number}> = [];

    cart.forEach(item => {
      for (let i = 1; i <= item.quantity; i++) {
        individualTickets.push({
          product: item.product,
          unitNumber: i,
          totalUnits: item.quantity
        });
      }
    });

    const allTicketsContent = individualTickets.map((ticket, index) => `
      <div class="ticket" style="font-family: monospace; font-size: 12px; width: 80mm; padding: 10px; margin: 0 auto; ${index < individualTickets.length - 1 ? 'page-break-after: always;' : ''}">
        <div style="text-align: center; margin-bottom: 10px;">
          <h3 style="margin: 0; padding: 0;">TICKET DE VENTA</h3>
          <p style="margin: 2px 0;">Fecha: ${new Date().toLocaleString()}</p>
          <p style="margin: 2px 0;">Vendedor: ${currentUser?.name}</p>
          <p style="margin: 2px 0;">Ticket ${index + 1} de ${individualTickets.length}</p>
        </div>
        <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
        <div style="margin: 10px 0;">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px;">${ticket.product.name}</div>
          <div style="margin: 3px 0;">
            <span>Unidad: ${ticket.unitNumber} de ${ticket.totalUnits}</span>
          </div>
          <div style="margin: 3px 0;">
            <span>Precio: S/${ticket.product.price.toFixed(2)}</span>
          </div>
        </div>
        <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
        <div style="text-align: center; font-size: 10px;">
          <p style="margin: 2px 0;">Método de pago: ${paymentMethod === 'efectivo' ? 'Efectivo' : 'Transferencia'}</p>
          <p style="margin: 2px 0;">Total de la venta: S/${cartTotal.toFixed(2)}</p>
          <p style="margin: 5px 0;">¡Gracias por su compra!</p>
        </div>
      </div>
    `).join('');

    const printContent = `
      <html>
        <head>
          <title>Tickets de Venta</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
              .ticket {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          ${allTicketsContent}
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
      // Cerrar la ventana después de imprimir
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    }
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Área de productos */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Ventas</h1>

          {/* Control de caja */}
          <div className="flex items-center gap-4">
            {currentCashBox ? (
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-500">
                  <DoorOpen className="w-3 h-3 mr-1" />
                  Caja Abierta
                </Badge>
                <Button variant="outline" size="sm" onClick={handleCloseCashBox}>
                  <DoorClosed className="w-4 h-4 mr-2" />
                  Cerrar Caja
                </Button>
              </div>
            ) : (
              <Button onClick={handleOpenCashBox}>
                <DoorOpen className="w-4 h-4 mr-2" />
                Abrir Caja
              </Button>
            )}
          </div>
        </div>

        {!currentCashBox && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Debes abrir la caja antes de realizar ventas.
            </AlertDescription>
          </Alert>
        )}

        {currentCashBox && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Atajos:</strong> 2x Enter (venta completa) • X (limpiar carrito) • P (cerrar caja) • Atajos personalizados (configuración)
            </p>
          </div>
        )}

        {/* Grid de productos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="p-4">
                <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg mb-2 flex items-center justify-center">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-4xl">🎮</div>
                  )}
                </div>
                <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                <CardDescription className="text-xl font-bold text-primary">
                  S/{product.price.toFixed(2)}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Button
                  className="w-full"
                  onClick={() => addToCart(product)}
                  disabled={!currentCashBox}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay productos disponibles</p>
          </div>
        )}
      </div>

      {/* Carrito lateral */}
      <div className="w-80 bg-card border rounded-lg p-4 h-fit sticky top-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Carrito ({cartItemsCount})
          </h2>
          {cart.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearCart}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
          {cart.map((item) => (
            <div key={item.product.id} className="flex items-center gap-3 p-2 border rounded">
              <div className="flex-1">
                <p className="font-medium text-sm">{item.product.name}</p>
                <p className="text-sm text-muted-foreground">
                  S/{item.product.price.toFixed(2)} c/u
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => updateCartQuantity(item.product.id!, item.quantity - 1)}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="w-8 text-center text-sm">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => updateCartQuantity(item.product.id!, item.quantity + 1)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-red-500"
                  onClick={() => removeFromCart(item.product.id!)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {cart.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>El carrito está vacío</p>
          </div>
        )}

        {cart.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-4">
              {/* Selector de método de pago */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Método de pago</Label>
                <Select value={paymentMethod} onValueChange={(value: 'efectivo' | 'transferencia') => setPaymentMethod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">
                      <div className="flex items-center">
                        <Banknote className="w-4 h-4 mr-2" />
                        Efectivo
                      </div>
                    </SelectItem>
                    <SelectItem value="transferencia">
                      <div className="flex items-center">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Transferencia
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>S/{cartTotal.toFixed(2)}</span>
              </div>
              <Button
                className="w-full"
                onClick={() => setShowProcessModal(true)}
                disabled={!currentCashBox}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Procesar Venta
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Modal de procesamiento */}
      <Dialog open={showProcessModal} onOpenChange={setShowProcessModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Venta</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Resumen de productos */}
            <div className="border rounded-lg p-3">
              <h4 className="font-semibold mb-2">Productos:</h4>
              <div className="space-y-1 text-sm">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex justify-between">
                    <span>{item.quantity}x {item.product.name}</span>
                    <span>S/{(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>S/{cartTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Método de pago seleccionado */}
            <div className="border rounded-lg p-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Método de pago:</span>
                <Badge variant={paymentMethod === 'efectivo' ? 'default' : 'secondary'}>
                  {paymentMethod === 'efectivo' ? (
                    <><Banknote className="w-3 h-3 mr-1" />Efectivo</>
                  ) : (
                    <><CreditCard className="w-3 h-3 mr-1" />Transferencia</>
                  )}
                </Badge>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                ℹ️ Al confirmar, se procesará la venta y se imprimirán automáticamente los tickets individuales para cada producto.
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowProcessModal(false)}
                disabled={isProcessing}
              >
                <X className="w-4 h-4 mr-2" />
                Cerrar
              </Button>
              <Button
                className="flex-1"
                onClick={handleProcessSale}
                disabled={isProcessing}
              >
                {isProcessing ? 'Procesando...' : 'Confirmar Venta'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
