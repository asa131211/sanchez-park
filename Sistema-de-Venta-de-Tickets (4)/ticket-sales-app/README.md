# 🎮 Sistema de Ventas de Tickets

Sistema completo de punto de venta (POS) diseñado específicamente para la venta de tickets y productos digitales, con funcionalidades avanzadas de gestión, reportes y modo offline.

## 🚀 **Acceso Directo**
**🔗 [https://same-ps19ddubpaq-latest.netlify.app](https://same-ps19ddubpaq-latest.netlify.app)**

**Credenciales de Administrador:**
- Usuario: `admin`
- Contraseña: `admin123`

---

## ✨ **Características Principales**

### 🛒 **Sistema de Ventas**
- ✅ Productos en formato tarjeta con imágenes
- ✅ Carrito lateral funcional
- ✅ Selector de método de pago (Efectivo/Transferencia)
- ✅ Sistema de caja automático (abrir/cerrar sin montos)
- ✅ **Impresión automática** de tickets individuales por producto
- ✅ Tickets optimizados para impresoras POS80 (80mm)

### 👥 **Gestión de Usuarios y Roles**
- ✅ **Administradores**: Acceso completo al sistema
- ✅ **Vendedores**: Solo acceso a ventas y configuración personal
- ✅ Sistema de autenticación seguro
- ✅ Gestión completa de usuarios

### 📊 **Reportes y Analytics**
- ✅ Dashboard con métricas en tiempo real
- ✅ Reportes de ventas por vendedor
- ✅ Análisis por método de pago
- ✅ Filtros por fecha (hoy, semana, mes)
- ✅ Exportación a CSV
- ✅ Historial completo de transacciones

### 🛠️ **Gestión de Productos**
- ✅ CRUD completo de productos
- ✅ Carga de imágenes (máx. 10MB)
- ✅ Precios en soles (S/.)
- ✅ Búsqueda y filtros

### ⚙️ **Configuración Avanzada**
- ✅ Modo oscuro/claro
- ✅ Atajos de teclado personalizables
- ✅ Logo de empresa personalizable
- ✅ Configuración de perfil

### 🌐 **Tecnología Offline**
- ✅ Base de datos local (IndexedDB)
- ✅ Funcionamiento sin conexión a internet
- ✅ Sincronización automática
- ✅ Indicador de estado de conexión

---

## 🏗️ **Arquitectura Técnica**

### **Frontend**
- **Next.js 15** con TypeScript
- **React 19** con hooks modernos
- **Tailwind CSS** para estilos
- **shadcn/ui** para componentes
- **Zustand** para gestión de estado

### **Base de Datos**
- **Dexie.js** (IndexedDB wrapper)
- **Persistencia local** sin dependencias externas
- **Esquema optimizado** para rendimiento

### **Funcionalidades**
- **React Hook Form** con validación Zod
- **Lucide React** para iconografía
- **date-fns** para manejo de fechas
- **Modo offline** completo

---

## 📱 **Diseño Responsive**

### **Barra Superior**
- Logo personalizable
- Indicador online/offline
- Menú de perfil con modo oscuro
- Logout seguro

### **Barra Lateral Inteligente**
**Para Administradores:**
- 🏠 Inicio (Dashboard)
- 🛒 Ventas
- 📦 Productos
- 👥 Usuarios
- 📊 Reportes
- ⚙️ Configuración

**Para Vendedores:**
- 🛒 Ventas
- ⚙️ Configuración

---

## 🖨️ **Sistema de Impresión POS80**

### **Características de Impresión**
- ✅ **Impresión automática** al procesar venta
- ✅ **Tickets separados** por cada producto
- ✅ **Formato optimizado** para 80mm
- ✅ **Información completa** en cada ticket:
  - Datos del vendedor
  - Fecha y hora
  - Detalles del producto
  - Método de pago
  - Total de la venta
  - Numeración de tickets

### **Flujo de Impresión**
1. Agregar productos al carrito
2. Seleccionar método de pago
3. Presionar "Procesar Venta"
4. Confirmar en modal
5. **¡Impresión automática de todos los tickets!**

---

## 🔧 **Instalación Local**

```bash
# Clonar repositorio
git clone [URL_DEL_REPO]
cd ticket-sales-app

# Instalar dependencias
bun install

# Ejecutar en desarrollo
bun run dev

# Construir para producción
bun run build
```

---

## 🎯 **Configuración Inicial**

### **1. Primer Acceso**
1. Accede con `admin` / `admin123`
2. El sistema iniciará completamente limpio

### **2. Configurar Productos**
1. Ve a **"Productos"**
2. Agrega tu catálogo de juegos/productos
3. Sube imágenes y configura precios

### **3. Crear Usuarios**
1. Ve a **"Usuarios"**
2. Crea cuentas para vendedores
3. Asigna roles apropiados

### **4. Personalizar Sistema**
1. Ve a **"Configuración"**
2. Sube logo de empresa
3. Configura atajos de teclado
4. Ajusta modo oscuro/claro

---

## 📊 **Métricas y Reportes**

### **Dashboard (Solo Admin)**
- Ventas del día/semana/mes
- Número de transacciones
- Productos más vendidos
- Rendimiento por vendedor

### **Reportes Detallados**
- Historial completo de ventas
- Filtros por fecha y vendedor
- Análisis por método de pago
- Exportación a CSV

---

## 🔒 **Seguridad**

- ✅ Autenticación basada en roles
- ✅ Sesiones persistentes seguras
- ✅ Validación de datos con Zod
- ✅ Protección de rutas por rol
- ✅ Datos almacenados localmente

---

## 🌟 **Ventajas Competitivas**

1. **100% Offline** - Funciona sin internet
2. **Impresión Inteligente** - Tickets automáticos por producto
3. **Cero Configuración** - Sistema listo para usar
4. **Interfaz Moderna** - UX optimizada para velocidad
5. **Escalable** - Fácil adición de nuevas funcionalidades
6. **Responsive** - Funciona en móviles, tablets y desktop

---

## 📞 **Soporte**

Sistema desarrollado con tecnologías modernas y mantenibles.
Completamente funcional y listo para uso comercial.

**🚀 ¡Comienza a vender ahora!**

---

*Sistema de Ventas de Tickets v5.0 - Listo para Producción*
