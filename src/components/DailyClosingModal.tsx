import React, { useState } from 'react';
import {
  X,
  Calendar,
  CheckCircle2,
  Download,
  AlertCircle,
  Clock,
  User,
  Wrench,
  Truck,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  History,
} from 'lucide-react';
import { DispatchOrder, EquipmentItem, DailyClosing } from '../types/inventory';
import { StorageService, CompanyInfo } from '../services/storage';
import { PdfService } from './../services/pdfGenerator';

interface DailyClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: DispatchOrder[];
  equipment: EquipmentItem[];
  companyInfo: CompanyInfo;
  onClosingSuccess: (closing: DailyClosing) => void;
}

export const DailyClosingModal: React.FC<DailyClosingModalProps> = ({
  isOpen,
  onClose,
  orders,
  equipment,
  companyInfo,
  onClosingSuccess,
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().substring(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [closedBy, setClosedBy] = useState<string>('Jefe de Bodega / Almacén');
  const [supervisorName, setSupervisorName] = useState<string>('Coordinador Técnico');
  const [notes, setNotes] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'nuevo' | 'historial'>('nuevo');

  // Filter orders matching selected date
  const dayOrders = orders.filter((o) => o.date.startsWith(selectedDate));
  const exitOrders = dayOrders.filter((o) => o.type === 'salida');
  const entryOrders = dayOrders.filter((o) => o.type === 'entrada');

  const totalExitsUnits = exitOrders.reduce(
    (acc, ord) => acc + ord.items.reduce((s, itm) => s + itm.quantity, 0),
    0
  );
  const totalEntriesUnits = entryOrders.reduce(
    (acc, ord) => acc + ord.items.reduce((s, itm) => s + itm.quantity, 0),
    0
  );

  const pastClosings = StorageService.getDailyClosings();

  const handleConfirmAndDownload = (e: React.FormEvent) => {
    e.preventDefault();

    const closingNumber = `CIE-${selectedDate.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const nowTime = new Date().toTimeString().substring(0, 5);

    const newClosing: DailyClosing = {
      id: `closing-${Date.now()}`,
      closingNumber,
      date: selectedDate,
      closedAt: `${selectedDate} ${nowTime}`,
      closedBy: closedBy || 'Encargado de Almacén',
      supervisorName: supervisorName || 'Coordinador de Terreno',
      totalEntriesCount: entryOrders.length,
      totalEntriesUnits,
      totalExitsCount: exitOrders.length,
      totalExitsUnits,
      orders: dayOrders,
      criticalItemsCount: equipment.filter((eq) => eq.stock <= eq.minStock).length,
      notes,
    };

    StorageService.recordDailyClosing(newClosing);
    PdfService.generateDailyClosingReport(newClosing);
    onClosingSuccess(newClosing);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Cierre Diario de Bodega & Descarga PDF
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Consolida las operaciones del día para {companyInfo.name || 'la empresa'} y descarga el acta firmable.
            </p>
          </div>
        </div>

        {/* Tab switch (Nuevo Cierre vs Historial de Cierres) */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mt-4 max-w-xs">
          <button
            type="button"
            onClick={() => setActiveTab('nuevo')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition ${
              activeTab === 'nuevo'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Cierre del Día
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('historial')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 ${
              activeTab === 'historial'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historial ({pastClosings.length})</span>
          </button>
        </div>

        {activeTab === 'nuevo' ? (
          <form onSubmit={handleConfirmAndDownload} className="mt-4 space-y-4">
            {/* Date selection & metrics preview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fecha a Cerrar
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Responsable Almacén *
                </label>
                <input
                  type="text"
                  required
                  value={closedBy}
                  onChange={(e) => setClosedBy(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supervisor Operaciones
                </label>
                <input
                  type="text"
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>
            </div>

            {/* Quick summary of today's activity */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700">
              <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-2xs">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Salidas a Técnicos
                </span>
                <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                  {exitOrders.length} órdenes ({totalExitsUnits} u.)
                </p>
              </div>

              <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-2xs">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ArrowDownLeft className="w-3.5 h-3.5" /> Entradas Compras
                </span>
                <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                  {entryOrders.length} facturas ({totalEntriesUnits} u.)
                </p>
              </div>

              <div className="col-span-2 sm:col-span-1 p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-2xs">
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                  Total Movimientos
                </span>
                <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                  {dayOrders.length} registros hoy
                </p>
              </div>
            </div>

            {/* Detail list of today's movements */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                Órdenes registradas para el {selectedDate}:
              </span>
              <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/70 dark:border-slate-700">
                {dayOrders.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-3">
                    No se registran movimientos en la fecha seleccionada. Puedes generar el cierre en blanco o seleccionar otra fecha.
                  </p>
                ) : (
                  dayOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            ord.type === 'salida' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                        />
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {ord.orderNumber}
                        </span>
                        <span className="text-slate-600 dark:text-slate-300">
                          {ord.technicianName || ord.supplier} -&gt; {ord.customerName || 'Bodega'}
                        </span>
                      </div>
                      <span className="font-semibold text-purple-600 dark:text-purple-400">
                        {ord.items.reduce((s, itm) => s + itm.quantity, 0)} u.
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Novedades u Observaciones del Cierre de Jornada
              </label>
              <textarea
                rows={2}
                placeholder="ej: Cuadrilla 1 reporta entrega conforme, bobina drop restante 420m en bodega..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl shadow-xs transition"
              >
                <Download className="w-4 h-4" />
                <span>Confirmar Cierre & Descargar PDF</span>
              </button>
            </div>
          </form>
        ) : (
          /* Historial Tab */
          <div className="mt-4 space-y-3">
            {pastClosings.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Aún no has registrado cierres diarios previos.
              </div>
            ) : (
              pastClosings.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                        {c.closingNumber}
                      </span>
                      <span className="text-[10px] text-slate-400">({c.closedAt})</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium mt-0.5">
                      Fecha: {c.date} • Salidas: {c.totalExitsCount} ({c.totalExitsUnits} u.) • Entradas: {c.totalEntriesCount} ({c.totalEntriesUnits} u.)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Cerrado por: {c.closedBy}
                    </p>
                  </div>

                  <button
                    onClick={() => PdfService.generateDailyClosingReport(c)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/80 hover:bg-purple-200 rounded-xl transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                </div>
              ))
            )}

            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
