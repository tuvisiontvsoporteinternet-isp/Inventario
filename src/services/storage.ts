import {
  EquipmentItem,
  Customer,
  Technician,
  DispatchOrder,
  DailyClosing,
  InvoiceDataExtracted,
  InvoicePurchaseRecord,
  DispatchItem,
} from '../types/inventory';
import { INITIAL_EQUIPMENT, INITIAL_CUSTOMERS, INITIAL_TECHNICIANS, INITIAL_ORDERS } from '../data/initialData';

const KEYS = {
  EQUIPMENT: 'netstock_isp_equipment_v1',
  CUSTOMERS: 'netstock_isp_customers_v1',
  TECHNICIANS: 'netstock_isp_technicians_v1',
  ORDERS: 'netstock_isp_orders_v1',
  COMPANY: 'netstock_isp_company_v1',
  CLOSINGS: 'netstock_isp_closings_v1',
  INVOICES: 'netstock_isp_invoices_v1',
};

export interface CompanyInfo {
  name: string;
  nit: string;
  phone: string;
  email: string;
  address: string;
  city: string;
}

const DEFAULT_COMPANY: CompanyInfo = {
  name: 'TuVisión Telecomunicaciones ISP',
  nit: 'NIT: 901.442.890-3',
  phone: '+57 (601) 745-9000 / +57 310 999 0011',
  email: 'soporte@tuvisiontvsoporteinternet.com',
  address: 'Calle 100 # 19A - 45, Edificio Tech Park',
  city: 'Bogotá D.C. / Cobertura Nacional',
};

export const StorageService = {
  getCompanyInfo(): CompanyInfo {
    try {
      const data = localStorage.getItem(KEYS.COMPANY);
      return data ? JSON.parse(data) : DEFAULT_COMPANY;
    } catch {
      return DEFAULT_COMPANY;
    }
  },

  saveCompanyInfo(company: CompanyInfo): void {
    localStorage.setItem(KEYS.COMPANY, JSON.stringify(company));
  },

  getEquipment(): EquipmentItem[] {
    try {
      const data = localStorage.getItem(KEYS.EQUIPMENT);
      return data !== null ? JSON.parse(data) : INITIAL_EQUIPMENT;
    } catch {
      return INITIAL_EQUIPMENT;
    }
  },

  saveEquipment(items: EquipmentItem[]): void {
    localStorage.setItem(KEYS.EQUIPMENT, JSON.stringify(items));
  },

  getCustomers(): Customer[] {
    try {
      const data = localStorage.getItem(KEYS.CUSTOMERS);
      return data !== null ? JSON.parse(data) : INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  },

  saveCustomers(customers: Customer[]): void {
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
  },

  getTechnicians(): Technician[] {
    try {
      const data = localStorage.getItem(KEYS.TECHNICIANS);
      return data !== null ? JSON.parse(data) : INITIAL_TECHNICIANS;
    } catch {
      return INITIAL_TECHNICIANS;
    }
  },

  saveTechnicians(techs: Technician[]): void {
    localStorage.setItem(KEYS.TECHNICIANS, JSON.stringify(techs));
  },

  getOrders(): DispatchOrder[] {
    try {
      const data = localStorage.getItem(KEYS.ORDERS);
      return data !== null ? JSON.parse(data) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  },

  saveOrders(orders: DispatchOrder[]): void {
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
  },

  // Save new dispatch or entry, updating equipment stock accordingly
  createOrder(order: DispatchOrder, shouldUpdateStock: boolean = true): { success: boolean; error?: string } {
    const orders = this.getOrders();
    const equipment = this.getEquipment();

    if (shouldUpdateStock) {
      // Validate stock availability for exits
      if (order.type === 'salida') {
        for (const item of order.items) {
          const currentEq = equipment.find((e) => e.id === item.equipmentId);
          if (!currentEq) {
            return { success: false, error: `El producto "${item.equipmentName}" no existe en inventario.` };
          }
          if (currentEq.stock < item.quantity) {
            return {
              success: false,
              error: `Stock insuficiente para "${item.equipmentName}". Disponible: ${currentEq.stock} ${currentEq.unit}, Requerido: ${item.quantity} ${currentEq.unit}.`,
            };
          }
        }

        // Deduct stock and remove serials if used
        for (const item of order.items) {
          const eqIdx = equipment.findIndex((e) => e.id === item.equipmentId);
          if (eqIdx !== -1) {
            equipment[eqIdx].stock -= item.quantity;
            if (item.serialNumbers && item.serialNumbers.length > 0 && equipment[eqIdx].serialsAvailable) {
              equipment[eqIdx].serialsAvailable = equipment[eqIdx].serialsAvailable?.filter(
                (s) => !item.serialNumbers?.includes(s)
              );
            }
            equipment[eqIdx].updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
          }
        }
      } else if (order.type === 'entrada') {
        // Add stock
        for (const item of order.items) {
          const eqIdx = equipment.findIndex((e) => e.id === item.equipmentId);
          if (eqIdx !== -1) {
            equipment[eqIdx].stock += item.quantity;
            if (item.serialNumbers && item.serialNumbers.length > 0) {
              const currentSerials = equipment[eqIdx].serialsAvailable || [];
              equipment[eqIdx].serialsAvailable = [...currentSerials, ...item.serialNumbers];
            }
            equipment[eqIdx].updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
          }
        }
      }
      this.saveEquipment(equipment);
    }

    orders.unshift(order);
    this.saveOrders(orders);
    return { success: true };
  },

  deleteOrder(orderId: string, revertStock: boolean = true): boolean {
    const orders = this.getOrders();
    const orderIndex = orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) return false;

    const orderToDelete = orders[orderIndex];

    if (revertStock && orderToDelete.status !== 'anulada') {
      const equipment = this.getEquipment();
      if (orderToDelete.type === 'salida') {
        // Return back to stock
        for (const item of orderToDelete.items) {
          const eqIdx = equipment.findIndex((e) => e.id === item.equipmentId);
          if (eqIdx !== -1) {
            equipment[eqIdx].stock += item.quantity;
            if (item.serialNumbers && item.serialNumbers.length > 0) {
              const currentSerials = equipment[eqIdx].serialsAvailable || [];
              equipment[eqIdx].serialsAvailable = [...currentSerials, ...item.serialNumbers];
            }
          }
        }
      } else if (orderToDelete.type === 'entrada') {
        // Subtract back
        for (const item of orderToDelete.items) {
          const eqIdx = equipment.findIndex((e) => e.id === item.equipmentId);
          if (eqIdx !== -1) {
            equipment[eqIdx].stock = Math.max(0, equipment[eqIdx].stock - item.quantity);
          }
        }
      }
      this.saveEquipment(equipment);
    }

    orders.splice(orderIndex, 1);
    this.saveOrders(orders);
    return true;
  },

  getDailyClosings(): DailyClosing[] {
    try {
      const data = localStorage.getItem(KEYS.CLOSINGS);
      return data !== null ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveDailyClosings(closings: DailyClosing[]): void {
    localStorage.setItem(KEYS.CLOSINGS, JSON.stringify(closings));
  },

  recordDailyClosing(closing: DailyClosing): void {
    const list = this.getDailyClosings();
    list.unshift(closing);
    this.saveDailyClosings(list);
  },

  getRecordStats(): {
    ordersCount: number;
    equipmentCount: number;
    totalStockUnits: number;
    customersCount: number;
    techniciansCount: number;
    closingsCount: number;
  } {
    const orders = this.getOrders();
    const equipment = this.getEquipment();
    const customers = this.getCustomers();
    const technicians = this.getTechnicians();
    const closings = this.getDailyClosings();

    return {
      ordersCount: orders.length,
      equipmentCount: equipment.length,
      totalStockUnits: equipment.reduce((sum, item) => sum + (item.stock || 0), 0),
      customersCount: customers.length,
      techniciansCount: technicians.length,
      closingsCount: closings.length,
    };
  },

  /**
   * Restablecer desde cero todos los registros o partes seleccionadas
   */
  resetRecords(options: {
    mode: 'all_zero' | 'stock_zero' | 'orders_only';
    resetCustomers?: boolean;
    resetTechnicians?: boolean;
  }): { success: boolean; message: string } {
    try {
      // 1. Despachos y cierres siempre se restablecen a 0
      this.saveOrders([]);
      this.saveDailyClosings([]);

      if (options.mode === 'all_zero') {
        // Vaciar completamente catálogo de equipos (0 equipos)
        this.saveEquipment([]);
        if (options.resetCustomers !== false) {
          this.saveCustomers([]);
        }
        if (options.resetTechnicians !== false) {
          this.saveTechnicians([]);
        }
        return {
          success: true,
          message: 'Todos los registros (despachos, inventario, cierres, clientes y técnicos) han sido restablecidos a cero.',
        };
      } else if (options.mode === 'stock_zero') {
        // Mantener catálogo pero con stock en 0 y series vacías
        const equipment = this.getEquipment();
        const zeroStockEquipment = equipment.map((eq) => ({
          ...eq,
          stock: 0,
          serialsAvailable: [],
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        }));
        this.saveEquipment(zeroStockEquipment);

        if (options.resetCustomers) this.saveCustomers([]);
        if (options.resetTechnicians) this.saveTechnicians([]);

        return {
          success: true,
          message: 'Despachos y cierres reiniciados a cero. Catálogo de equipos conservado con stock en 0 unidades.',
        };
      } else {
        // Solo historial de despachos y cierres
        if (options.resetCustomers) this.saveCustomers([]);
        if (options.resetTechnicians) this.saveTechnicians([]);

        return {
          success: true,
          message: 'Historial de despachos y cierres diarios restablecido a cero. Inventario y stock conservados.',
        };
      }
    } catch (e: any) {
      console.error('Error al restablecer registros:', e);
      return { success: false, message: e.message || 'Error al restablecer los registros.' };
    }
  },

  exportDatabase(): string {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      company: this.getCompanyInfo(),
      equipment: this.getEquipment(),
      customers: this.getCustomers(),
      technicians: this.getTechnicians(),
      orders: this.getOrders(),
      closings: this.getDailyClosings(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importDatabase(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.equipment && Array.isArray(data.equipment)) {
        this.saveEquipment(data.equipment);
      }
      if (data.customers && Array.isArray(data.customers)) {
        this.saveCustomers(data.customers);
      }
      if (data.technicians && Array.isArray(data.technicians)) {
        this.saveTechnicians(data.technicians);
      }
      if (data.orders && Array.isArray(data.orders)) {
        this.saveOrders(data.orders);
      }
      if (data.closings && Array.isArray(data.closings)) {
        this.saveDailyClosings(data.closings);
      }
      if (data.company) {
        this.saveCompanyInfo(data.company);
      }
      return true;
    } catch (e) {
      console.error('Failed to import database:', e);
      return false;
    }
  },

  resetToDemo(): void {
    localStorage.removeItem(KEYS.EQUIPMENT);
    localStorage.removeItem(KEYS.CUSTOMERS);
    localStorage.removeItem(KEYS.TECHNICIANS);
    localStorage.removeItem(KEYS.ORDERS);
    localStorage.removeItem(KEYS.COMPANY);
    localStorage.removeItem(KEYS.CLOSINGS);
  },
};
