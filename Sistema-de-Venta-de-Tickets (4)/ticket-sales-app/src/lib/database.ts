import Dexie, { type EntityTable } from 'dexie';

// Tipos de datos
export interface User {
  id?: number;
  username: string;
  name: string;
  password: string;
  role: 'admin' | 'vendedor';
  shortcuts?: string[];
  profilePhoto?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id?: number;
  name: string;
  price: number;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sale {
  id?: number;
  userId: number;
  products: SaleItem[];
  total: number;
  paymentMethod: 'efectivo' | 'transferencia';
  cashBoxId: number;
  createdAt: Date;
}

export interface SaleItem {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
}

export interface CashBox {
  id?: number;
  userId: number;
  openedAt: Date;
  closedAt?: Date;
  isOpen: boolean;
}

export interface AppSettings {
  id: 'settings';
  darkMode: boolean;
  companyLogo?: string;
  lastSync?: Date;
}

// Configuración de la base de datos
export class TicketSalesDB extends Dexie {
  users!: EntityTable<User, 'id'>;
  products!: EntityTable<Product, 'id'>;
  sales!: EntityTable<Sale, 'id'>;
  cashBoxes!: EntityTable<CashBox, 'id'>;
  settings!: EntityTable<AppSettings, 'id'>;

  constructor() {
    super('TicketSalesDB');

    this.version(1).stores({
      users: '++id, username, role, profilePhoto',
      products: '++id, name',
      sales: '++id, userId, cashBoxId, createdAt',
      cashBoxes: '++id, userId, isOpen, openedAt',
      settings: 'id'
    });
  }
}

export const db = new TicketSalesDB();

// Inicializar datos por defecto
export async function initializeDefaultData() {
  try {
    // Verificar si ya hay usuarios
    const userCount = await db.users.count();

    if (userCount === 0) {
      // Crear usuario administrador por defecto
      await db.users.add({
        username: 'admin',
        name: 'Administrador',
        password: 'admin123', // En producción esto debería estar hasheado
        role: 'admin',
        shortcuts: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log('Usuario administrador creado por defecto');
    }

    // Verificar configuración
    const settings = await db.settings.get('settings');
    if (!settings) {
      await db.settings.add({
        id: 'settings',
        darkMode: false,
        lastSync: new Date()
      });
    }

    // Sistema iniciado sin productos predefinidos

  } catch (error) {
    console.error('Error inicializando datos por defecto:', error);
  }
}
