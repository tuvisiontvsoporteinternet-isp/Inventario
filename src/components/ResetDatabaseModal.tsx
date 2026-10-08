import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  AlertTriangle,
  Download,
  Trash2,
  CheckCircle2,
  Boxes,
  ClipboardList,
  FileText,
  Users,
  Wrench,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { StorageService } from '../services/storage';

interface ResetDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetSuccess: (message: string) => void;
}

export type ResetMode = 'all_zero' | 'stock_zero' | 'orders_only';

export const ResetDatabaseModal: React.FC<ResetDatabaseModalProps> = ({
  isOpen,
  onClose,
  onResetSuccess,
}) => {
  const [mode, setMode] = useState<ResetMode>('all_zero');
  const [resetCustomers, setResetCustomers] = useState(true);
  const [resetTechnicians, setResetTechnicians] = useState(true);
  const [confirmationConfirmed, setConfirmationConfirmed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [backupDownloaded, setBackupDownloaded] = useState(false);

  if (!isOpen) return null;

  const stats = StorageService.getRecordStats();

  const handleDownloadBackup = () => {
    const jsonStr = StorageService.exportDatabase();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_seguridad_antes_de_restablecer_${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupDownloaded(true);
  };

  const handleExecuteReset = () => {
    if (!confirmationConfirmed) return;

    setIsProcessing(true);
    try {
      const result = StorageService.resetRecords({
        mode,
        resetCustomers: mode === 'all_zero' ? resetCustomers : false,
        resetTechnicians: mode === 'all_zero' ? resetTechnicians : false,
      });

      if (result.success) {
        onResetSuccess(result.message);
        onClose();
      } else {
        alert(result.message);
      }
    } catch (e: any) {
      alert(`Error al restablecer: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetToDemo = () => {
    setIsProcessing(true);
    try {
      StorageService.resetToDemo();
      onResetSuccess('Se han restaurado los datos de demostración iniciales.');
      onClose();
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-red-500 text-white shadow-md shadow-red-500/20 shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                Restablecer Registros desde Cero
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Limpia los datos del sistema para iniciar operaciones reales
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-white/80 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
          {/* Current Records Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
              Registros actuales en el sistema:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-purple-600" />
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white">{stats.ordersCount}</span>
                  <span className="text-slate-500 text-[11px] block">Despachos/Órdenes</span>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-emerald-600" />
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white">{stats.equipmentCount}</span>
                  <span className="text-slate-500 text-[11px] block">Equipos ({stats.totalStockUnits} uds)</span>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white">{stats.closingsCount}</span>
                  <span className="text-slate-500 text-[11px] block">Cierres Diarios</span>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-600" />
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white">{stats.customersCount}</span>
                  <span className="text-slate-500 text-[11px] block">Clientes</span>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-orange-600" />
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white">{stats.techniciansCount}</span>
                  <span className="text-slate-500 text-[11px] block">Técnicos</span>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <div>
                  <span className="font-extrabold text-purple-700 dark:text-purple-300">Nuevo Ciclo</span>
                  <span className="text-slate-500 text-[11px] block">Listo a operar</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mode Selector Options */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Selecciona el nivel de restablecimiento:
            </p>

            {/* Option 1: Full Wipe (Zero Records) */}
            <label
              onClick={() => setMode('all_zero')}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                mode === 'all_zero'
                  ? 'border-red-500 bg-red-50/70 dark:bg-red-950/30 dark:border-red-500'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="reset_mode"
                checked={mode === 'all_zero'}
                onChange={() => setMode('all_zero')}
                className="mt-1 text-red-600 focus:ring-red-500"
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    Limpieza Total Absoluta (0 Registros en Todo)
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300">
                    Desde Cero
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Borra todos los despachos, entradas/salidas, cierres diarios y vacía el inventario por completo (0 equipos). Ideal para comenzar a registrar tu catálogo propio desde el principio.
                </p>

                {mode === 'all_zero' && (
                  <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-300 border-t border-red-200/60 dark:border-red-900/40 mt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={resetCustomers}
                        onChange={(e) => setResetCustomers(e.target.checked)}
                        className="rounded text-red-600 focus:ring-red-500"
                      />
                      <span>Vaciar también clientes</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={resetTechnicians}
                        onChange={(e) => setResetTechnicians(e.target.checked)}
                        className="rounded text-red-600 focus:ring-red-500"
                      />
                      <span>Vaciar también técnicos</span>
                    </label>
                  </div>
                )}
              </div>
            </label>

            {/* Option 2: Stock to Zero (Keep FTTH catalog template) */}
            <label
              onClick={() => setMode('stock_zero')}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                mode === 'stock_zero'
                  ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 dark:border-amber-500'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="reset_mode"
                checked={mode === 'stock_zero'}
                onChange={() => setMode('stock_zero')}
                className="mt-1 text-amber-600 focus:ring-amber-500"
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    Stock en Cero (Conservar Catálogo de Materiales FTTH)
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                    Recomendado ISP
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Elimina todos los despachos y cierres diarios. Mantiene las fichas de productos (Cajas NAP, Splitters, ONUs, Drop, etc.) pero resetea el <strong>Stock a 0 unidades</strong> y series vacías, listo para registrar tu inventario físico real.
                </p>
              </div>
            </label>

            {/* Option 3: Orders Only */}
            <label
              onClick={() => setMode('orders_only')}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                mode === 'orders_only'
                  ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/30 dark:border-indigo-500'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="reset_mode"
                checked={mode === 'orders_only'}
                onChange={() => setMode('orders_only')}
                className="mt-1 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    Solo Historial de Movimientos y Cierres (0 Despachos)
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Limpia únicamente las órdenes de despacho y los cierres diarios. Mantiene los productos y los niveles de stock actuales intactos.
                </p>
              </div>
            </label>
          </div>

          {/* One-click Safety Backup Bar */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  {backupDownloaded ? '¡Copia descargada con éxito!' : 'Copia de seguridad preventiva'}
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Descarga un archivo JSON con los datos actuales antes de restablecer.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl transition shadow-xs shrink-0 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{backupDownloaded ? 'Volver a Descargar' : 'Descargar Backup'}</span>
            </button>
          </div>

          {/* Safety Confirmation Checkbox */}
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 space-y-2">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-extrabold text-red-900 dark:text-red-200">
                  Advertencia de seguridad irreversible
                </p>
                <p className="text-xs text-red-700 dark:text-red-300">
                  Esta acción no se puede deshacer. Los registros seleccionados serán eliminados permanentemente del almacenamiento local.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2.5 pt-1 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmationConfirmed}
                onChange={(e) => setConfirmationConfirmed(e.target.checked)}
                className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300 dark:border-slate-600"
              />
              <span>Confirmo que deseo restablecer estos registros desde cero</span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Quick Demo Reset option */}
          <button
            type="button"
            onClick={handleResetToDemo}
            disabled={isProcessing}
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline transition order-2 sm:order-1"
          >
            Restaurar a datos de prueba (Demo inicial)
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleExecuteReset}
              disabled={!confirmationConfirmed || isProcessing}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-md shadow-red-500/20 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Restableciendo...' : 'Restablecer Registros a Cero'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
