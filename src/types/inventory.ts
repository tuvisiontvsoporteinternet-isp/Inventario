export type EquipmentCategory =
  | 'nap'
  | 'manga'
  | 'onu_ont'
  | 'conector_upc'
  | 'conector_apc'
  | 'fibra_drop'
  | 'splitter'
  | 'herraje'
  | 'otro';

export interface CategoryInfo {
  id: EquipmentCategory;
  name: string;
  description: string;
  badgeColor: string;
  iconName: string;
}

export interface EquipmentItem {
  id: string;
  code: string;
  name: string;
  category: EquipmentCategory;
  brand: string;
  model: string;
  stock: number;
  minStock: number;
  unit: 'unidades' | 'metros' | 'cajas' | 'piezas' | 'bobinas';
  location: string; // e.g. "Bodega Central - Estante A-2"
  unitPrice?: number;
  description?: string;
  requiresSerial?: boolean; // ONUs usually require serial/MAC
  serialsAvailable?: string[]; // Available serials in stock for tracking
  updatedAt: string;
}

export interface Customer {
  id: string;
  code: string; // e.g. "CLI-1042"
  fullName: string;
  documentId: string; // DNI / Cédula / RUT
  phone: string;
  email?: string;
  address: string;
  neighborhood?: string;
  plan: string; // e.g. "Fibra Óptica 300 Mbps"
  status: 'activo' | 'instalacion_pendiente' | 'suspendido' | 'baja';
  notes?: string;
  createdAt: string;
}

export interface Technician {
  id: string;
  code: string; // e.g. "TEC-01"
  fullName: string;
  documentId: string;
  phone: string;
  crewName: string; // e.g. "Cuadrilla Móvil #1"
  vehiclePlate?: string;
  active: boolean;
  notes?: string;
}

export type MovementType = 'entrada' | 'salida' | 'devolucion' | 'ajuste';

export interface DispatchItem {
  equipmentId: string;
  equipmentName: string;
  category: EquipmentCategory;
  quantity: number;
  unit: string;
  serialNumbers?: string[]; // e.g. ["SN-ZTE482910"] for ONUs
}

export interface DispatchOrder {
  id: string;
  orderNumber: string; // e.g. "DSP-2026-0042" or "ENT-2026-0018"
  type: MovementType;
  date: string;
  technicianId?: string;
  technicianName?: string;
  customerId?: string;
  customerName?: string;
  customerAddress?: string;
  workType?: 'instalacion_nueva' | 'mantenimiento' | 'migracion' | 'garantia_cambio' | 'retiro' | 'ingreso_proveedor' | 'ajuste_inventario';
  status: 'completada' | 'en_progreso' | 'anulada';
  items: DispatchItem[];
  notes?: string;
  supplier?: string; // For 'entrada'
  invoiceNumber?: string; // For 'entrada'
  registeredBy: string; // User who logged the dispatch
  createdAt: string;
}

export interface DashboardStats {
  totalItemsCount: number;
  totalUniqueProducts: number;
  lowStockCount: number;
  entriesThisMonth: number;
  exitsThisMonth: number;
  activeTechniciansCount: number;
  activeCustomersCount: number;
}

export interface DailyClosing {
  id: string;
  closingNumber: string; // e.g. "CIE-2026-10-08"
  date: string; // YYYY-MM-DD
  closedAt: string; // YYYY-MM-DD HH:mm
  closedBy: string;
  supervisorName?: string;
  totalEntriesCount: number;
  totalEntriesUnits: number;
  totalExitsCount: number;
  totalExitsUnits: number;
  orders: DispatchOrder[];
  criticalItemsCount: number;
  notes?: string;
}

