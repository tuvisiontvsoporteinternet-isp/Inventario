import React, { useState, useMemo } from 'react';
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
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { EquipmentItem, DispatchOrder, EquipmentCategory } from '../types/inventory';
import { CATEGORIES_CONFIG } from '../data/initialData';
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
  const [activeTab, setActiveTab] = useState<'graficas' | 'documentos'>('graficas');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [timeFilter, setTimeFilter] = useState<'30d' | '90d' | 'all'>('all');

  const company = StorageService.getCompanyInfo();
  const pastClosings = StorageService.getDailyClosings();
  const selectedOrder = orders.find((o) => o.id === selectedOrderId);
  const criticalItems = equipment.filter((eq) => eq.stock <= eq.minStock);

  // 1. Calculations for KPIs
  const totalStockUnits = useMemo(
    () => equipment.reduce((sum, item) => sum + item.stock, 0),
    [equipment]
  );

  const totalExitsCount = useMemo(
    () => orders.filter((o) => o.type === 'salida').length,
    [orders]
  );

  const totalEntriesCount = useMemo(
    () => orders.filter((o) => o.type === 'entrada').length,
    [orders]
  );

  const totalExitsUnits = useMemo(
    () =>
      orders
        .filter((o) => o.type === 'salida')
        .reduce((sum, ord) => sum + ord.items.reduce((s, itm) => s + itm.quantity, 0), 0),
    [orders]
  );

  const totalEntriesUnits = useMemo(
    () =>
      orders
        .filter((o) => o.type === 'entrada')
        .reduce((sum, ord) => sum + ord.items.reduce((s, itm) => s + itm.quantity, 0), 0),
    [orders]
  );

  // Estimated inventory monetary valuation
  const totalValuation = useMemo(
    () =>
      equipment.reduce(
        (sum, item) => sum + item.stock * (item.unitPrice || 15),
        0
      ),
    [equipment]
  );

  // 2. Calculations for Category Distribution Chart (NAPs, Mangas, ONUs, Conectores, etc.)
  const categoryStats = useMemo(() => {
    const stats: Record<string, { count: number; units: number; name: string; color: string }> = {};

    const categoryColors: Record<EquipmentCategory, string> = {
      nap: '#3b82f6', // blue-500
      manga: '#f59e0b', // amber-500
      onu_ont: '#10b981', // emerald-500
      conector_upc: '#06b6d4', // cyan-500
      conector_apc: '#22c55e', // green-500
      fibra_drop: '#a855f7', // purple-500
      splitter: '#6366f1', // indigo-500
      herraje: '#f97316', // orange-500
      otro: '#64748b', // slate-500
    };

    equipment.forEach((item) => {
      const cat = item.category;
      if (!stats[cat]) {
        stats[cat] = {
          count: 0,
          units: 0,
          name: CATEGORIES_CONFIG[cat]?.name || cat,
          color: categoryColors[cat] || '#6366f1',
        };
      }
      stats[cat].count += 1;
      stats[cat].units += item.stock;
    });

    return Object.entries(stats)
      .map(([key, val]) => ({
        key,
        ...val,
        percentage: totalStockUnits > 0 ? (val.units / totalStockUnits) * 100 : 0,
      }))
      .sort((a, b) => b.units - a.units);
  }, [equipment, totalStockUnits]);

  // 3. Technician Dispatches Ranking Chart
  const technicianStats = useMemo(() => {
    const techMap: Record<string, { name: string; ordersCount: number; unitsCount: number }> = {};

    orders
      .filter((o) => o.type === 'salida' && o.technicianName)
      .forEach((ord) => {
        const name = ord.technicianName || 'Sin Asignar';
        if (!techMap[name]) {
          techMap[name] = { name, ordersCount: 0, unitsCount: 0 };
        }
        techMap[name].ordersCount += 1;
        techMap[name].unitsCount += ord.items.reduce((s, itm) => s + itm.quantity, 0);
      });

    const list = Object.values(techMap).sort((a, b) => b.unitsCount - a.unitsCount);
    const maxUnits = list.length > 0 ? Math.max(...list.map((t) => t.unitsCount), 1) : 1;

    return { list, maxUnits };
  }, [orders]);

  // 4. Monthly/Periodic Movements Chart (Entradas vs Salidas)
  const periodicMovements = useMemo(() => {
    // Group orders by month
    const monthsMap: Record<string, { label: string; entradas: number; salidas: number; entradasUnits: number; salidasUnits: number }> = {};

    orders.forEach((ord) => {
      const rawDate = ord.date || '';
      // Format YYYY-MM
      const key = rawDate.length >= 7 ? rawDate.substring(0, 7) : '2026-10';
      if (!monthsMap[key]) {
        const [year, month] = key.split('-');
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const label = `${monthNames[parseInt(month, 10) - 1] || month} ${year}`;
        monthsMap[key] = { label, entradas: 0, salidas: 0, entradasUnits: 0, salidasUnits: 0 };
      }

      const units = ord.items.reduce((s, itm) => s + itm.quantity, 0);
      if (ord.type === 'entrada') {
        monthsMap[key].entradas += 1;
        monthsMap[key].entradasUnits += units;
      } else {
        monthsMap[key].salidas += 1;
        monthsMap[key].salidasUnits += units;
      }
    });

    const sortedKeys = Object.keys(monthsMap).sort();
    // Default to at least last 4 months if sparse
    const defaultData = sortedKeys.length > 0 ? sortedKeys.map((k) => ({ key: k, ...monthsMap[k] })) : [
      { key: '2026-07', label: 'Jul 2026', entradas: 4, salidas: 8, entradasUnits: 120, salidasUnits: 75 },
      { key: '2026-08', label: 'Ago 2026', entradas: 6, salidas: 12, entradasUnits: 250, salidasUnits: 140 },
      { key: '2026-09', label: 'Sep 2026', entradas: 8, salidas: 18, entradasUnits: 380, salidasUnits: 210 },
      { key: '2026-10', label: 'Oct 2026', entradas: 11, salidas: 24, entradasUnits: 510, salidasUnits: 330 },
    ];

    const maxUnitsValue = Math.max(
      ...defaultData.map((d) => Math.max(d.entradasUnits, d.salidasUnits)),
      1
    );

    return { data: defaultData, maxUnitsValue };
  }, [orders]);

  // 5. Top 5 Most Dispatched Equipment items
  const topDispatchedItems = useMemo(() => {
    const itemMap: Record<string, { name: string; category: EquipmentCategory; units: number }> = {};

    orders
      .filter((o) => o.type === 'salida')
      .forEach((ord) => {
        ord.items.forEach((itm) => {
          if (!itemMap[itm.equipmentName]) {
            itemMap[itm.equipmentName] = {
              name: itm.equipmentName,
              category: itm.category,
              units: 0,
            };
          }
          itemMap[itm.equipmentName].units += itm.quantity;
        });
      });

    const list = Object.values(itemMap)
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);

    const maxQty = list.length > 0 ? Math.max(...list.map((i) => i.units), 1) : 1;

    return { list, maxQty };
  }, [orders]);

  // Inventory Health calculation
  const inventoryHealth = useMemo(() => {
    const total = equipment.length || 1;
    const critical = criticalItems.length;
    const warning = equipment.filter(
      (e) => e.stock > e.minStock && e.stock <= e.minStock * 1.3
    ).length;
    const healthy = total - critical - warning;

    return {
      healthy,
      healthyPct: Math.round((healthy / total) * 100),
      warning,
      warningPct: Math.round((warning / total) * 100),
      critical,
      criticalPct: Math.round((critical / total) * 100),
    };
  }, [equipment, criticalItems]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Módulo de Analítica & Reportes • {company.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Reportes & Gráficas de Inventario ISP
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Monitoreo en tiempo real de entradas vs. salidas, rotación de equipos (NAPs, Mangas, ONUs, Conectores) y emisión de actas PDF.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {onOpenDailyClosing && (
            <button
              onClick={onOpenDailyClosing}
              className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-2xl shadow-xs transition"
            >
              <Clock className="w-4 h-4" />
              <span>Cierre Diario de Bodega</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-2xl transition"
            title="Imprimir vista de reporte"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
        </div>
      </div>

      {/* Main Mode Toggle: Gráficas vs Documentos PDF */}
      <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl max-w-md border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('graficas')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
            activeTab === 'graficas'
              ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Gráficas & Indicadores</span>
          <span className="px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-[9px] font-extrabold">
            En vivo
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('documentos')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
            activeTab === 'documentos'
              ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Actas & Descarga PDF</span>
          <span className="px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[9px] font-extrabold">
            5 Reportes
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: GRÁFICAS & BUSINESS INTELLIGENCE ISP           */}
      {/* ========================================================= */}
      {activeTab === 'graficas' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top 4 KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Unidades en Bodega
                </span>
                <Boxes className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {totalStockUnits.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <span>{equipment.length} referencias FTTH</span>
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Salidas a Técnicos
                </span>
                <ArrowUpRight className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {totalExitsUnits.toLocaleString()}
              </p>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                {totalExitsCount} actas de despacho
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Entradas Almacén
                </span>
                <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {totalEntriesUnits.toLocaleString()}
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                {totalEntriesCount} compras registradas
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Salud de Stock
                </span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {inventoryHealth.healthyPct}%
              </p>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                {criticalItems.length} materiales bajo umbral
              </p>
            </div>
          </div>

          {/* Gráfica 1: Balance Temporal de Entradas vs Salidas (Bar Chart SVG) */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <span>Flujo Mensual: Entradas (Compras) vs. Salidas (Técnicos)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Volumen acumulado de materiales ingresados por proveedores vs. despachados para instalación a clientes
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-emerald-500"></span>
                  <span className="text-slate-700 dark:text-slate-300">Entradas (Recepción)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-purple-600"></span>
                  <span className="text-slate-700 dark:text-slate-300">Salidas (Técnicos)</span>
                </div>
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div className="pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                {periodicMovements.data.map((period) => {
                  const entradaHeight = Math.max(
                    Math.round((period.entradasUnits / periodicMovements.maxUnitsValue) * 160),
                    8
                  );
                  const salidaHeight = Math.max(
                    Math.round((period.salidasUnits / periodicMovements.maxUnitsValue) * 160),
                    8
                  );

                  return (
                    <div
                      key={period.key}
                      className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-end space-y-3"
                    >
                      {/* Metric numbers on top */}
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-emerald-600 dark:text-emerald-400">
                          +{period.entradasUnits} u
                        </span>
                        <span className="text-purple-600 dark:text-purple-400">
                          -{period.salidasUnits} u
                        </span>
                      </div>

                      {/* Side-by-side vertical bars */}
                      <div className="h-44 flex items-end justify-center gap-3 pt-2">
                        {/* Entrada bar */}
                        <div className="flex-1 flex flex-col items-center">
                          <div
                            style={{ height: `${entradaHeight}px` }}
                            className="w-full max-w-[28px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg transition-all duration-500 shadow-xs hover:brightness-110"
                            title={`Entradas: ${period.entradasUnits} unidades (${period.entradas} compras)`}
                          />
                        </div>

                        {/* Salida bar */}
                        <div className="flex-1 flex flex-col items-center">
                          <div
                            style={{ height: `${salidaHeight}px` }}
                            className="w-full max-w-[28px] bg-gradient-to-t from-purple-600 to-indigo-500 rounded-t-lg transition-all duration-500 shadow-xs hover:brightness-110"
                            title={`Salidas: ${period.salidasUnits} unidades (${period.salidas} órdenes)`}
                          />
                        </div>
                      </div>

                      {/* Month Label */}
                      <div className="text-center pt-1 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {period.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Gráfica 2 & Gráfica 3: Grid de 2 Columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfica 2: Distribución de Stock por Categoría FTTH (NAPs, Mangas, ONUs, Conectores) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-indigo-600" />
                    <span>Distribución de Equipos FTTH en Stock</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Proporción de inventario físico por categoría de red
                  </p>
                </div>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                  {totalStockUnits.toLocaleString()} u.
                </span>
              </div>

              {/* Stacked Progress Bar visualization */}
              <div className="h-5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                {categoryStats.map((cat) => (
                  <div
                    key={cat.key}
                    style={{
                      width: `${Math.max(cat.percentage, 2)}%`,
                      backgroundColor: cat.color,
                    }}
                    className="h-full transition-all duration-300 hover:opacity-85"
                    title={`${cat.name}: ${cat.units} unidades (${cat.percentage.toFixed(1)}%)`}
                  />
                ))}
              </div>

              {/* Categorías Breakdown List */}
              <div className="space-y-2.5 pt-1 max-h-72 overflow-y-auto pr-1">
                {categoryStats.map((cat) => (
                  <div
                    key={cat.key}
                    className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {cat.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {cat.units.toLocaleString()} u.
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 w-12 text-right">
                        {cat.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gráfica 3: Despachos por Técnico / Cuadrilla */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-500" />
                    <span>Equipos Despachados por Técnico</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ranking de técnicos según la cantidad de materiales retirados de bodega
                  </p>
                </div>
              </div>

              {technicianStats.list.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                  No hay órdenes de salida a técnicos registradas todavía.
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {technicianStats.list.map((tech, index) => {
                    const pct = Math.round((tech.unitsCount / technicianStats.maxUnits) * 100);

                    return (
                      <div key={tech.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-black text-[10px] flex items-center justify-center shrink-0">
                              {index + 1}
                            </span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                              {tech.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({tech.ordersCount} órdenes)
                            </span>
                          </div>
                          <span className="font-mono font-extrabold text-amber-600 dark:text-amber-400">
                            {tech.unitsCount} unidades
                          </span>
                        </div>

                        {/* Horizontal Bar */}
                        <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.max(pct, 5)}%` }}
                            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Gráfica 4 & Gráfica 5: Top Materiales Más Rotados & Estado de Abastecimiento */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 5 Materiales con Mayor Salida */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  <span>Top 5 Materiales con Mayor Rotación en Terreno</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Equipos e insumos FTTH con mayor consumo por las cuadrillas
                </p>
              </div>

              <div className="space-y-3 pt-1">
                {topDispatchedItems.list.map((item, index) => {
                  const pct = Math.round((item.units / topDispatchedItems.maxQty) * 100);

                  return (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                          {index + 1}. {item.name}
                        </span>
                        <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                          {item.units} despachados
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.max(pct, 5)}%` }}
                          className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Salud de Abastecimiento y Stock Crítico */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                  <span>Nivel de Cobertura & Alertas de Reabastecimiento</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Monitoreo de seguridad preventiva para evitar quiebre de stock en despliegues
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-emerald-900 dark:text-emerald-200">
                        Stock Óptimo / Normal
                      </p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        {inventoryHealth.healthy} referencias con stock seguro
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">
                    {inventoryHealth.healthyPct}%
                  </span>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <p className="font-bold text-amber-900 dark:text-amber-200">
                        Umbral Preventivo de Reorden
                      </p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">
                        {inventoryHealth.warning} referencias cerca de stock mínimo
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-amber-700 dark:text-amber-300">
                    {inventoryHealth.warningPct}%
                  </span>
                </div>

                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <div>
                      <p className="font-bold text-rose-900 dark:text-rose-200">
                        Stock Crítico / Compra Urgente
                      </p>
                      <p className="text-[11px] text-rose-700 dark:text-rose-400">
                        {criticalItems.length} referencias requieren orden de compra
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-rose-700 dark:text-rose-300">
                    {inventoryHealth.criticalPct}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: ACTAS & DESCARGA DE REPORTES PDF               */}
      {/* ========================================================= */}
      {activeTab === 'documentos' && (
        <div className="space-y-6 animate-in fade-in duration-200">
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
                        <span className="font-semibold">Cliente:</span> {selectedOrder.customerName || 'N/A'} ({selectedOrder.customerAddress || 'Planta'})
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
      )}
    </div>
  );
};
