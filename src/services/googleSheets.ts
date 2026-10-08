import {
  EquipmentItem,
  DispatchOrder,
  Technician,
  DailyClosing,
  Customer,
  EquipmentCategory,
} from '../types/inventory';
import { getAccessToken } from './googleAuth';
import { StorageService } from './storage';

export interface SheetConfig {
  spreadsheetId: string;
  spreadsheetName: string;
  spreadsheetUrl: string;
  lastSync?: string;
  autoSync?: boolean;
}

const STORAGE_KEYS = {
  SHEET_CONFIG: 'netstock_google_sheets_config_v1',
};

export const GoogleSheetsService = {
  getConfig(): SheetConfig | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SHEET_CONFIG);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveConfig(config: SheetConfig): void {
    localStorage.setItem(STORAGE_KEYS.SHEET_CONFIG, JSON.stringify(config));
  },

  clearConfig(): void {
    localStorage.removeItem(STORAGE_KEYS.SHEET_CONFIG);
  },

  extractSpreadsheetId(input: string): string {
    const trimmed = input.trim();
    // Matches https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/...
    const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }
    return trimmed;
  },

  async verifySpreadsheet(spreadsheetId: string): Promise<{ valid: boolean; title?: string; sheets?: string[]; error?: string }> {
    const token = await getAccessToken();
    if (!token) {
      return { valid: false, error: 'No hay sesión de Google activa. Conecta tu cuenta de Google.' };
    }

    try {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties.title`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const msg = errorData.error?.message || `Error HTTP ${res.status}`;
        return { valid: false, error: msg };
      }

      const data = await res.json();
      const title = data.properties?.title || 'Hoja sin título';
      const sheets = (data.sheets || []).map((s: any) => s.properties?.title || '');

      return { valid: true, title, sheets };
    } catch (err: any) {
      return { valid: false, error: err.message || 'Error al conectar con la hoja de cálculo' };
    }
  },

  /**
   * Creates a new Google Spreadsheet with structured ISP tabs, styled headers and frozen rows.
   */
  async createIspSpreadsheet(companyName: string = 'TuVisión ISP'): Promise<{
    success: boolean;
    spreadsheetId?: string;
    spreadsheetUrl?: string;
    title?: string;
    error?: string;
  }> {
    const token = await getAccessToken();
    if (!token) {
      return { success: false, error: 'Se requiere iniciar sesión con Google para crear la hoja.' };
    }

    const todayStr = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
    const title = `${companyName} - Inventario & Operaciones (${todayStr})`;

    const tabs = [
      { title: 'Inventario_Equipos', frozenRow: 1 },
      { title: 'Movimientos_Ordenes', frozenRow: 1 },
      { title: 'Tecnicos_Cuadrillas', frozenRow: 1 },
      { title: 'Cierres_Diarios', frozenRow: 1 },
      { title: 'Clientes_ISP', frozenRow: 1 },
    ];

    try {
      // 1. Create spreadsheet with tabs
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            title,
            locale: 'es_CO',
          },
          sheets: tabs.map((tab) => ({
            properties: {
              title: tab.title,
              gridProperties: {
                frozenRowCount: tab.frozenRow,
              },
            },
          })),
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        throw new Error(err.error?.message || 'Error al crear la hoja en Google Sheets');
      }

      const created = await createRes.json();
      const spreadsheetId = created.spreadsheetId;
      const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

      // 2. Format headers
      await this.initializeHeaders(spreadsheetId, token);

      // 3. Save config
      this.saveConfig({
        spreadsheetId,
        spreadsheetName: title,
        spreadsheetUrl,
        lastSync: new Date().toISOString(),
      });

      return {
        success: true,
        spreadsheetId,
        spreadsheetUrl,
        title,
      };
    } catch (err: any) {
      console.error('Error creating spreadsheet:', err);
      return { success: false, error: err.message || 'Fallo al crear la hoja de cálculo' };
    }
  },

  /**
   * Initializes header rows
   */
  async initializeHeaders(spreadsheetId: string, token: string): Promise<void> {
    const headerData = [
      {
        range: 'Inventario_Equipos!A1:L1',
        values: [[
          'ID Equipo', 'Código', 'Nombre del Material / Equipo', 'Categoría',
          'Marca', 'Modelo / Ref', 'Stock Actual', 'Unidad', 'Stock Mínimo',
          'Ubicación Bodega', 'Precio Unitario USD', 'Seriales Disponibles'
        ]],
      },
      {
        range: 'Movimientos_Ordenes!A1:N1',
        values: [[
          'ID Orden', 'Número Orden', 'Tipo (Entrada/Salida)', 'Fecha', 'Técnico Responsable',
          'Cliente Asignado', 'Dirección Cliente', 'Tipo Trabajo', 'Estado',
          'Materiales y Cantidades', 'Seriales', 'Proveedor/Factura', 'Observaciones', 'Registrado Por'
        ]],
      },
      {
        range: 'Tecnicos_Cuadrillas!A1:H1',
        values: [[
          'ID Técnico', 'Código', 'Nombre Completo', 'Cédula / Identificación',
          'Teléfono', 'Cuadrilla / Zona', 'Vehículo / Placa', 'Estado Activo'
        ]],
      },
      {
        range: 'Cierres_Diarios!A1:H1',
        values: [[
          'ID Cierre', 'Número Cierre', 'Fecha Cierre', 'Hora / Fecha Exacta',
          'Responsable Almacén', 'Total Entradas (Unidades)', 'Total Salidas (Unidades)', 'Notas y Novedades'
        ]],
      },
      {
        range: 'Clientes_ISP!A1:I1',
        values: [[
          'ID Cliente', 'Código', 'Nombre Completo', 'Documento / NIT',
          'Teléfono', 'Dirección Instalación', 'Plan ISP', 'Estado', 'Fecha Registro'
        ]],
      },
    ];

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: headerData,
      }),
    });
  },

  /**
   * Exports all application data into Google Sheets (Equipment, Orders, Technicians, Closings, Customers)
   */
  async exportAllData(spreadsheetId: string): Promise<{ success: boolean; rowsCount: number; error?: string }> {
    const token = await getAccessToken();
    if (!token) {
      return { success: false, rowsCount: 0, error: 'Sesión de Google no autenticada.' };
    }

    try {
      const equipment = StorageService.getEquipment();
      const orders = StorageService.getOrders();
      const technicians = StorageService.getTechnicians();
      const closings = StorageService.getDailyClosings();
      const customers = StorageService.getCustomers();

      // Ensure headers
      await this.initializeHeaders(spreadsheetId, token);

      // Clear existing data rows before rewriting
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ranges: [
            'Inventario_Equipos!A2:L2000',
            'Movimientos_Ordenes!A2:N2000',
            'Tecnicos_Cuadrillas!A2:H2000',
            'Cierres_Diarios!A2:H2000',
            'Clientes_ISP!A2:I2000',
          ],
        }),
      });

      // Prepare payload rows
      const equipmentRows = equipment.map((e) => [
        e.id,
        e.code,
        e.name,
        e.category,
        e.brand,
        e.model,
        e.stock,
        e.unit,
        e.minStock,
        e.location,
        e.unitPrice ?? 15,
        (e.serialsAvailable || []).join(', '),
      ]);

      const orderRows = orders.map((o) => {
        const itemsSummary = o.items.map((i) => `${i.equipmentName} (${i.quantity} ${i.unit})`).join('; ');
        const serialsSummary = o.items
          .filter((i) => i.serialNumbers && i.serialNumbers.length > 0)
          .map((i) => `${i.equipmentName}: [${i.serialNumbers?.join(', ')}]`)
          .join('; ');

        return [
          o.id,
          o.orderNumber,
          o.type.toUpperCase(),
          o.date,
          o.technicianName || 'N/A',
          o.customerName || 'N/A',
          o.customerAddress || 'N/A',
          o.workType || 'General',
          o.status,
          itemsSummary,
          serialsSummary,
          o.supplier || o.invoiceNumber || '',
          o.notes || '',
          o.registeredBy || 'Sistema',
        ];
      });

      const techRows = technicians.map((t) => [
        t.id,
        t.code,
        t.fullName,
        t.documentId,
        t.phone,
        t.crewName,
        t.vehiclePlate || 'N/A',
        t.active ? 'ACTIVO' : 'INACTIVO',
      ]);

      const closingRows = closings.map((c) => [
        c.id,
        c.closingNumber,
        c.date,
        c.closedAt,
        c.closedBy,
        c.totalEntriesUnits,
        c.totalExitsUnits,
        c.notes || '',
      ]);

      const customerRows = customers.map((cu) => [
        cu.id,
        cu.code,
        cu.fullName,
        cu.documentId,
        cu.phone,
        cu.address,
        cu.plan,
        cu.status,
        cu.createdAt || '',
      ]);

      const valueData = [
        { range: 'Inventario_Equipos!A2', values: equipmentRows },
        { range: 'Movimientos_Ordenes!A2', values: orderRows },
        { range: 'Tecnicos_Cuadrillas!A2', values: techRows },
        { range: 'Cierres_Diarios!A2', values: closingRows },
        { range: 'Clientes_ISP!A2', values: customerRows },
      ];

      const updateRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            valueInputOption: 'USER_ENTERED',
            data: valueData,
          }),
        }
      );

      if (!updateRes.ok) {
        const err = await updateRes.json().catch(() => ({}));
        throw new Error(err.error?.message || 'Error al guardar filas en Google Sheets');
      }

      const totalRows = equipment.length + orders.length + technicians.length + closings.length + customers.length;

      // Update config last sync
      const currentConfig = this.getConfig();
      if (currentConfig && currentConfig.spreadsheetId === spreadsheetId) {
        currentConfig.lastSync = new Date().toISOString();
        this.saveConfig(currentConfig);
      }

      return { success: true, rowsCount: totalRows };
    } catch (err: any) {
      console.error('Error exporting data to Google Sheets:', err);
      return { success: false, rowsCount: 0, error: err.message || 'Error al exportar a Google Sheets' };
    }
  },

  /**
   * Imports data from Google Sheets into local storage (Equipment, Orders, Technicians, Closings, Customers)
   */
  async importAllData(spreadsheetId: string): Promise<{
    success: boolean;
    counts: { equipment: number; orders: number; technicians: number; closings: number; customers: number };
    error?: string;
  }> {
    const token = await getAccessToken();
    if (!token) {
      return {
        success: false,
        counts: { equipment: 0, orders: 0, technicians: 0, closings: 0, customers: 0 },
        error: 'Sesión de Google no autenticada.',
      };
    }

    try {
      const ranges = [
        'Inventario_Equipos!A2:L1000',
        'Movimientos_Ordenes!A2:N1000',
        'Tecnicos_Cuadrillas!A2:H1000',
        'Cierres_Diarios!A2:H1000',
        'Clientes_ISP!A2:I1000',
      ];

      const url =
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?` +
        ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join('&');

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || 'Error al leer datos desde Google Sheets');
      }

      const data = await res.json();
      const valueRanges = data.valueRanges || [];

      let importedEquipment: EquipmentItem[] = [];
      let importedOrders: DispatchOrder[] = [];
      let importedTechnicians: Technician[] = [];
      let importedClosings: DailyClosing[] = [];
      let importedCustomers: Customer[] = [];

      // 1. Parse Equipment
      const eqRange = valueRanges.find((vr: any) => vr.range?.includes('Inventario_Equipos'));
      if (eqRange && eqRange.values && eqRange.values.length > 0) {
        importedEquipment = eqRange.values
          .filter((row: any[]) => row && row[0] && row[2])
          .map((row: any[], index: number) => {
            const serialsRaw = row[11] ? String(row[11]).split(',').map((s) => s.trim()).filter(Boolean) : [];
            const stockNum = parseFloat(row[6]) || 0;
            const minStockNum = parseFloat(row[8]) || 5;

            return {
              id: String(row[0] || `eq-imp-${index + 1}`),
              code: String(row[1] || `EQ-${index + 1}`),
              name: String(row[2] || 'Equipo sin nombre'),
              category: (row[3] || 'otro') as EquipmentCategory,
              brand: String(row[4] || 'Genérico'),
              model: String(row[5] || ''),
              stock: stockNum,
              unit: (row[7] || 'unidades') as EquipmentItem['unit'],
              minStock: minStockNum,
              location: String(row[9] || 'Bodega Principal'),
              unitPrice: parseFloat(row[10]) || 15,
              requiresSerial: serialsRaw.length > 0,
              serialsAvailable: serialsRaw,
              updatedAt: new Date().toISOString().substring(0, 10),
            };
          });
      }

      // 2. Parse Orders
      const orderRange = valueRanges.find((vr: any) => vr.range?.includes('Movimientos_Ordenes'));
      if (orderRange && orderRange.values && orderRange.values.length > 0) {
        importedOrders = orderRange.values
          .filter((row: any[]) => row && row[0])
          .map((row: any[], index: number) => {
            const typeStr = String(row[2] || '').toLowerCase().includes('entrada') ? 'entrada' : 'salida';
            return {
              id: String(row[0] || `ORD-IMP-${index + 1}`),
              orderNumber: String(row[1] || `DSP-IMP-${index + 1}`),
              type: typeStr as 'entrada' | 'salida',
              date: String(row[3] || new Date().toISOString().substring(0, 10)),
              technicianName: String(row[4] || 'Técnico General'),
              customerName: row[5] && row[5] !== 'N/A' ? String(row[5]) : undefined,
              customerAddress: row[6] && row[6] !== 'N/A' ? String(row[6]) : undefined,
              workType: (row[7] || 'instalacion_nueva') as DispatchOrder['workType'],
              status: (row[8] || 'completada') as DispatchOrder['status'],
              items: [
                {
                  equipmentId: 'eq-item-gen',
                  equipmentName: String(row[9] || 'Materiales Despachados'),
                  category: 'otro',
                  quantity: 1,
                  unit: 'unidades',
                  serialNumbers: row[10] ? [String(row[10])] : [],
                },
              ],
              supplier: row[11] ? String(row[11]) : undefined,
              notes: String(row[12] || ''),
              registeredBy: String(row[13] || 'Google Sheets'),
              createdAt: new Date().toISOString(),
            };
          });
      }

      // 3. Parse Technicians
      const techRange = valueRanges.find((vr: any) => vr.range?.includes('Tecnicos_Cuadrillas'));
      if (techRange && techRange.values && techRange.values.length > 0) {
        importedTechnicians = techRange.values
          .filter((row: any[]) => row && row[0] && row[2])
          .map((row: any[], index: number) => ({
            id: String(row[0] || `tech-imp-${index + 1}`),
            code: String(row[1] || `TEC-${index + 1}`),
            fullName: String(row[2]),
            documentId: String(row[3] || ''),
            phone: String(row[4] || ''),
            crewName: String(row[5] || 'Cuadrilla #1'),
            vehiclePlate: String(row[6] || ''),
            active: String(row[7]).toUpperCase() !== 'INACTIVO',
          }));
      }

      // 4. Parse Closings
      const closingRange = valueRanges.find((vr: any) => vr.range?.includes('Cierres_Diarios'));
      if (closingRange && closingRange.values && closingRange.values.length > 0) {
        importedClosings = closingRange.values
          .filter((row: any[]) => row && row[0])
          .map((row: any[], index: number) => {
            const entUnits = parseInt(row[5]) || 0;
            const exitUnits = parseInt(row[6]) || 0;
            return {
              id: String(row[0] || `close-imp-${index + 1}`),
              closingNumber: String(row[1] || `CIE-IMP-${index + 1}`),
              date: String(row[2] || new Date().toISOString().substring(0, 10)),
              closedAt: String(row[3] || new Date().toISOString().substring(0, 16)),
              closedBy: String(row[4] || 'Administrador'),
              totalEntriesCount: entUnits > 0 ? 1 : 0,
              totalEntriesUnits: entUnits,
              totalExitsCount: exitUnits > 0 ? 1 : 0,
              totalExitsUnits: exitUnits,
              orders: [],
              criticalItemsCount: 0,
              notes: String(row[7] || ''),
            };
          });
      }

      // 5. Parse Customers
      const custRange = valueRanges.find((vr: any) => vr.range?.includes('Clientes_ISP'));
      if (custRange && custRange.values && custRange.values.length > 0) {
        importedCustomers = custRange.values
          .filter((row: any[]) => row && row[0] && row[2])
          .map((row: any[], index: number) => ({
            id: String(row[0] || `cust-imp-${index + 1}`),
            code: String(row[1] || `CLI-${index + 1}`),
            fullName: String(row[2]),
            documentId: String(row[3] || ''),
            phone: String(row[4] || ''),
            address: String(row[5] || ''),
            plan: String(row[6] || 'Fibra 200 Mbps'),
            status: (row[7] || 'activo') as Customer['status'],
            createdAt: String(row[8] || new Date().toISOString().substring(0, 10)),
          }));
      }

      // Save retrieved data into local storage if any rows found
      if (importedEquipment.length > 0) {
        StorageService.saveEquipment(importedEquipment);
      }
      if (importedOrders.length > 0) {
        StorageService.saveOrders(importedOrders);
      }
      if (importedTechnicians.length > 0) {
        StorageService.saveTechnicians(importedTechnicians);
      }
      if (importedClosings.length > 0) {
        StorageService.saveDailyClosings(importedClosings);
      }
      if (importedCustomers.length > 0) {
        StorageService.saveCustomers(importedCustomers);
      }

      const counts = {
        equipment: importedEquipment.length,
        orders: importedOrders.length,
        technicians: importedTechnicians.length,
        closings: importedClosings.length,
        customers: importedCustomers.length,
      };

      // Update config last sync
      const currentConfig = this.getConfig();
      if (currentConfig && currentConfig.spreadsheetId === spreadsheetId) {
        currentConfig.lastSync = new Date().toISOString();
        this.saveConfig(currentConfig);
      }

      return {
        success: true,
        counts,
      };
    } catch (err: any) {
      console.error('Error importing data from Google Sheets:', err);
      return {
        success: false,
        counts: { equipment: 0, orders: 0, technicians: 0, closings: 0, customers: 0 },
        error: err.message || 'Error al importar datos desde Google Sheets',
      };
    }
  },
};
