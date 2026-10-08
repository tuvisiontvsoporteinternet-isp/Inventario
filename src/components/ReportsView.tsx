import React, { useState } from 'react';
import {
  FileText,
  Download,
  Boxes,
  Truck,
  AlertTriangle,
  Calendar,
  CheckCircle,
  FileCheck,
  Printer,
  ChevronRight,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { EquipmentItem, DispatchOrder } from '../types/inventory';
import { PdfService } from '../services/pdfGenerator';
import { StorageService } from '../services/storage';

interface ReportsViewProps {
  equipment: EquipmentItem[];
  orders: DispatchOrder[];
  onOpenDailyClosing?: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  equipment,
  orders,
  onOpenDailyClosing,
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const company = StorageService.getCompanyInfo();
  const pastClosings = StorageService.getDailyClosings();

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);
  const criticalItems = equipment.filter((eq) => eq.stock <= eq.minStock);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
            <FileCheck className="w-3.5 h-3.5" />
            Centro de Emisión Documental • {company.name}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Generación de Reportes Automáticos en PDF
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Generación de actas oficiales de entrega a técnicos con firmas, cierres de jornada diaria y balances de bodega.
          </p>
        </div>

        {onOpenDailyClosing && (
          <button
            onClick={onOpenDailyClosing}
            className="flex items-center gap-2 px-4 py-3 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-2xl shadow-xs transition shrink-0"
          >
            <Clock className="w-4 h-4" />
            <span>Cierre Diario de Hoy (PDF)</span>
          </button>
        )}
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Report 0: Cierre Diario de Bodega (Featured) */}
        <div className="bg-gradient-to-br from-purple-50/70 via-white to-indigo-50/70 dark:from-purple-950/20 dark:via-slate-900 dark:to-slate-900 rounded-2xl border border-purple-200 dark:border-purple-900/60 p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                <Clock className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-purple-600 text-white">
                CIERRE DIARIO
              </span>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Acta de Cierre Diario de Bodega & Turno
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Genera el balance oficial de la jornada de hoy o de días anteriores con firmas de bodega y supervisión, detalle de todas las salidas a técnicos y entradas recibidas.
              </p>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-purple-100 dark:border-purple-900/40 text-xs space-y-1">
              <p className="font-semibold text-purple-900 dark:text-purple-300">
                Historial de cierres registrados: {pastClosings.length}
              </p>
              {pastClosings.length > 0 ? (
                <p className="text-[11px] text-slate-500">
                  Último cierre: {pastClosings[0].closingNumber} ({pastClosings[0].date})
                </p>
              ) : (
                <p className="text-[11px] text-slate-400">
                  Aún no se ha emitido el cierre de hoy. Haz clic para generarlo.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={onOpenDailyClosing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:scale-98 rounded-xl shadow-xs transition"
            >
              <Clock className="w-4 h-4" />
              <span>Ejecutar Cierre Diario & PDF</span>
            </button>
          </div>
        </div>
        {/* Report 1: Acta de Entrega / Despacho a Técnico y Cliente */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Acta de Entrega de Materiales & Equipos
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Documento oficial con espacio para firma del técnico receptor, firma de bodega y firma del abonado. Incluye seriales de ONUs y detalle de pasivos.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Selecciona la orden de despacho a imprimir:
              </label>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
              >
                {orders.map((ord) => (
                  <option key={ord.id} value={ord.id}>
                    {ord.orderNumber} ({ord.date}) - {ord.technicianName || ord.supplier} -&gt; {ord.customerName || 'Bodega'}
                  </option>
                ))}
              </select>

              {selectedOrder && (
                <div className="text-[11px] text-slate-600 dark:text-slate-300 pt-1 space-y-1">
                  <p>
                    <span className="font-semibold">Receptor:</span> {selectedOrder.technicianName || 'N/A'}
                  </p>
                  <p>
                    <span className="font-semibold">Cliente:</span> {selectedOrder.customerName || 'N/A'} (
                    {selectedOrder.customerAddress || 'Planta'})
                  </p>
                  <p>
                    <span className="font-semibold">Ítems:</span>{' '}
                    {selectedOrder.items.map((i) => `${i.quantity}x ${i.equipmentName}`).join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              if (selectedOrder) {
                PdfService.generateDispatchReceipt(selectedOrder);
              }
            }}
            disabled={!selectedOrder}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-xs transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Descargar Acta Firmable en PDF
          </button>
        </div>

        {/* Report 2: Balance General de Inventario Físico */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Informe General de Stock & Bodega
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Inventario consolidado con todas las referencias: Cajas NAP, Mangas FOSC, ONUs, Conectores SC-APC/UPC, bobinas de fibra drop, splitters y herrajes.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Referencias</span>
                <p className="text-base font-bold text-slate-900 dark:text-white">{equipment.length} productos</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Unidades / Metros</span>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {equipment.reduce((acc, curr) => acc + curr.stock, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => PdfService.generateInventoryReport(equipment)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 rounded-xl shadow-xs transition"
          >
            <Download className="w-4 h-4" />
            Descargar Reporte de Inventario en PDF
          </button>
        </div>

        {/* Report 3: Reporte de Movimientos (Entradas vs Salidas) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Historial de Movimientos: Entradas & Salidas
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Resumen cronológico de todas las transferencias de materiales a cuadrillas y compras ingresadas por proveedores.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Salidas a Técnicos</span>
                <p className="text-base font-bold text-amber-600 dark:text-amber-400">
                  {orders.filter((o) => o.type === 'salida').length} despachos
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Entradas de Almacén</span>
                <p className="text-base font-bold text-blue-600 dark:text-blue-400">
                  {orders.filter((o) => o.type === 'entrada').length} recepciones
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => PdfService.generateMovementsReport(orders)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-98 rounded-xl shadow-xs transition"
          >
            <Download className="w-4 h-4" />
            Descargar Reporte de Movimientos en PDF
          </button>
        </div>

        {/* Report 4: Reporte de Stock Crítico / Sugerido de Compras */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Reporte de Stock Crítico & Pedido a Proveedores
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Filtra exclusivamente los materiales con niveles iguales o menores al umbral de seguridad para emitir orden de compra a mayoristas.
              </p>
            </div>

            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-xs space-y-1">
              <span className="font-bold text-red-700 dark:text-red-300 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {criticalItems.length} materiales requieren compra urgente:
              </span>
              <p className="text-[11px] text-red-600 dark:text-red-400 truncate">
                {criticalItems.map((c) => `${c.name} (${c.stock} u)`).join(', ') || 'Ninguno bajo mínimo.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => PdfService.generateInventoryReport(criticalItems.length > 0 ? criticalItems : equipment)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-98 rounded-xl shadow-xs transition"
          >
            <Download className="w-4 h-4" />
            Descargar Reporte Crítico en PDF
          </button>
        </div>
      </div>
    </div>
  );
};
