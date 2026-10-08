import React from 'react';
import {
  Boxes,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Users,
  Wrench,
  Download,
  PlusCircle,
  Truck,
  Layers,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Wallet,
  Activity,
  FileText,
} from 'lucide-react';
import { EquipmentItem, DispatchOrder, Customer, Technician } from '../types/inventory';
import { CATEGORIES_CONFIG } from '../data/initialData';
import { PdfService } from '../services/pdfGenerator';
import { NavTab } from './Navbar';

interface DashboardProps {
  equipment: EquipmentItem[];
  orders: DispatchOrder[];
  customers: Customer[];
  technicians: Technician[];
  onNavigate: (tab: NavTab) => void;
  onOpenNewDispatch: () => void;
  onOpenNewEntry: () => void;
  isBodegaOpen: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  equipment,
  orders,
  customers,
  technicians,
  onNavigate,
  onOpenNewDispatch,
  onOpenNewEntry,
  isBodegaOpen,
}) => {
  const totalStockUnits = equipment.reduce((acc, curr) => acc + curr.stock, 0);
  const criticalItems = equipment.filter((eq) => eq.stock <= eq.minStock);
  const exitOrders = orders.filter((o) => o.type === 'salida');
  const entryOrders = orders.filter((o) => o.type === 'entrada');

  const totalValuation = equipment.reduce(
    (acc, itm) => acc + itm.stock * (itm.unitPrice || 15),
    0
  );

  const totalUnitsDispatched = exitOrders.reduce(
    (acc, ord) => acc + ord.items.reduce((sum, itm) => sum + itm.quantity, 0),
    0
  );

  const totalUnitsReceived = entryOrders.reduce(
    (acc, ord) => acc + ord.items.reduce((sum, itm) => sum + itm.quantity, 0),
    0
  );

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner (Fina Partner Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 uppercase tracking-wide">
              PANEL GENERAL • PARTNER ISP
            </span>
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isBodegaOpen
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {isBodegaOpen ? '● Bodega Operativa' : '○ Bodega Cerrada'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Gestión Integral de Red FTTH & Bodega
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-xl">
            Control de materiales pasivos y activos, despachos a cuadrillas y trazabilidad de abonados en tiempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenNewDispatch}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-95 text-white rounded-xl shadow-xs transition"
          >
            <Truck className="w-4 h-4" />
            <span>Despacho a Técnico</span>
          </button>

          <button
            onClick={onOpenNewEntry}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 active:scale-95 text-white rounded-xl shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Ingreso de Inventario</span>
          </button>
        </div>
      </div>

      {/* 4 Financial & Operational Cards (exact style to Fina hqdefault.jpg) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Valorización del Inventario */}
        <div
          onClick={() => onNavigate('inventory')}
          className="group cursor-pointer p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-purple-400 transition"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded-full">
              ACTIVOS
            </span>
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Valor Total en Bodega
          </p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            ${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            {totalStockUnits.toLocaleString()} unidades en {equipment.length} referencias
          </p>
        </div>

        {/* Card 2: Salidas / Despachos */}
        <div
          onClick={() => onNavigate('dispatches')}
          className="group cursor-pointer p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-amber-400 transition"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full">
              A TERRENO
            </span>
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Equipos Despachados
          </p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            {totalUnitsDispatched.toLocaleString()} u.
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            En {exitOrders.length} actas de entrega
          </p>
        </div>

        {/* Card 3: Entradas de Proveedor */}
        <div
          onClick={() => onNavigate('dispatches')}
          className="group cursor-pointer p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-emerald-400 transition"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
              COMPRAS
            </span>
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Ingresos a Bodega
          </p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            {totalUnitsReceived.toLocaleString()} u.
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            {entryOrders.length} recepciones con factura
          </p>
        </div>

        {/* Card 4: Alertas de Stock Crítico */}
        <div
          onClick={() => onNavigate('inventory')}
          className="group cursor-pointer p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-red-400 transition"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                criticalItems.length > 0
                  ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 animate-pulse'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
              }`}
            >
              {criticalItems.length > 0 ? 'URGENTE' : 'OK'}
            </span>
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Materiales Críticos
          </p>
          <p
            className={`text-2xl font-black mt-0.5 ${
              criticalItems.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'
            }`}
          >
            {criticalItems.length}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Por debajo del stock mínimo de seguridad
          </p>
        </div>
      </div>

      {/* Grid: Flujo de Materiales + Categorías FTTH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entradas vs Salidas Balance */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Balance de Movimientos
            </h3>
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded-full">
              FLUX
            </span>
          </div>

          <div className="space-y-4 pt-1">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Salidas a Terreno
                </span>
                <span className="text-slate-800 dark:text-slate-200">{totalUnitsDispatched} u.</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      totalUnitsReceived + totalUnitsDispatched > 0
                        ? (totalUnitsDispatched / (totalUnitsReceived + totalUnitsDispatched)) * 100
                        : 50
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ArrowDownLeft className="w-3.5 h-3.5" /> Entradas a Bodega
                </span>
                <span className="text-slate-800 dark:text-slate-200">{totalUnitsReceived} u.</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      totalUnitsReceived + totalUnitsDispatched > 0
                        ? (totalUnitsReceived / (totalUnitsReceived + totalUnitsDispatched)) * 100
                        : 50
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div
              onClick={() => onNavigate('technicians')}
              className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Wrench className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs font-semibold">Técnicos</span>
              </div>
              <p className="text-lg font-black text-slate-900 dark:text-white">{technicians.length}</p>
            </div>

            <div
              onClick={() => onNavigate('customers')}
              className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Users className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-xs font-semibold">Clientes</span>
              </div>
              <p className="text-lg font-black text-slate-900 dark:text-white">{customers.length}</p>
            </div>
          </div>

          <button
            onClick={() => PdfService.generateMovementsReport(orders)}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-950 rounded-xl transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Balance en PDF</span>
          </button>
        </div>

        {/* Categorías de Equipos ISP */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              Equipos ISP Disponibles por Categoría
            </h3>

            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
            >
              Ver Catálogo <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {Object.entries(CATEGORIES_CONFIG).map(([key, cfg]) => {
              const items = equipment.filter((eq) => eq.category === key);
              const count = items.reduce((sum, itm) => sum + itm.stock, 0);

              return (
                <div
                  key={key}
                  onClick={() => onNavigate('inventory')}
                  className="p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-purple-50/50 dark:hover:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer transition"
                >
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                    {cfg.name}
                  </p>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {count}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {items.length} {items.length === 1 ? 'modelo' : 'modelos'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {criticalItems.length > 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">
                  {criticalItems.length} materiales en stock crítico (NAPs, Mangas o ONUs)
                </span>
              </div>
              <button
                onClick={onOpenNewEntry}
                className="px-3 py-1 bg-red-600 text-white font-bold rounded-lg shrink-0 hover:bg-red-700 transition"
              >
                Reabastecer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Dispatches Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-purple-600" />
              Últimas Entregas a Técnicos & Clientes
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Registro trazable de quién recibió los equipos y para qué abonado se destinaron.
            </p>
          </div>

          <button
            onClick={() => onNavigate('dispatches')}
            className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
          >
            Ver Todos <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold bg-slate-50/50 dark:bg-slate-900">
              <tr>
                <th className="py-3 px-5">Folio</th>
                <th className="py-3 px-5">Técnico Receptor</th>
                <th className="py-3 px-5">Cliente Asignado</th>
                <th className="py-3 px-5">Materiales</th>
                <th className="py-3 px-5">Fecha</th>
                <th className="py-3 px-5 text-right">Acta PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentOrders.map((order) => {
                const isExit = order.type === 'salida';
                return (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-5 whitespace-nowrap font-mono font-bold text-slate-900 dark:text-white">
                      {order.orderNumber}
                    </td>

                    <td className="py-3 px-5 whitespace-nowrap">
                      {isExit ? (
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                          <Wrench className="w-3.5 h-3.5 text-blue-500" />
                          <span>{order.technicianName || 'Técnico Externo'}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">Prov: {order.supplier}</span>
                      )}
                    </td>

                    <td className="py-3 px-5">
                      {isExit ? (
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {order.customerName || 'Stock de Cuadrilla'}
                          </p>
                          {order.customerAddress && (
                            <p className="text-[10px] text-slate-500 truncate max-w-xs">
                              {order.customerAddress}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500">Recepción Almacén</span>
                      )}
                    </td>

                    <td className="py-3 px-5">
                      <div className="space-y-0.5">
                        {order.items.slice(0, 2).map((item, i) => (
                          <div key={i} className="text-slate-700 dark:text-slate-300">
                            <span className="font-bold">{item.quantity}x</span> {item.equipmentName}
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-5 whitespace-nowrap text-slate-500">
                      {order.date}
                    </td>

                    <td className="py-3 px-5 text-right whitespace-nowrap">
                      <button
                        onClick={() => PdfService.generateDispatchReceipt(order)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 rounded-lg transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
