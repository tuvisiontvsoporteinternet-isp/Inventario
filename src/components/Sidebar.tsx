import React, { useState } from 'react';
import {
  Home,
  Boxes,
  Truck,
  Users,
  Wrench,
  FileText,
  Settings,
  HelpCircle,
  Gift,
  UserPlus,
  ChevronRight,
  Info,
  Building2,
  Download,
  Upload,
  RotateCcw,
  X,
  Sparkles,
  Shield,
  LogIn,
  LogOut,
  UserCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { StorageService, CompanyInfo } from '../services/storage';
import { NavTab } from './Navbar';
import { AuthUser, ROLE_LABELS } from '../types/auth';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  lowStockCount: number;
  onOpenNewDispatch: () => void;
  onRefreshData: () => void;
  isBodegaOpen: boolean;
  setIsBodegaOpen: (open: boolean) => void;
  companyInfo: CompanyInfo;
  setCompanyInfo: (company: CompanyInfo) => void;
  onOpenDailyClosing: () => void;
  onOpenGoogleSheets?: () => void;
  onOpenResetModal?: () => void;
  currentUser?: AuthUser | null;
  onOpenAuth?: (mode?: 'login' | 'register' | 'users') => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  setIsOpenMobile,
  lowStockCount,
  onOpenNewDispatch,
  onRefreshData,
  isBodegaOpen,
  setIsBodegaOpen,
  companyInfo,
  setCompanyInfo,
  onOpenDailyClosing,
  onOpenGoogleSheets,
  onOpenResetModal,
  currentUser,
  onOpenAuth,
  onLogout,
}) => {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [tempCompanyInfo, setTempCompanyInfo] = useState<CompanyInfo>(companyInfo);

  const handleExport = () => {
    const jsonStr = StorageService.exportDatabase();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_inventario_isp_${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (StorageService.importDatabase(content)) {
        alert('Copia de seguridad importada con éxito.');
        onRefreshData();
      } else {
        alert('Error al importar el archivo JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetDemo = () => {
    if (confirm('¿Restaurar los datos de demostración iniciales? Se reemplazarán los cambios actuales.')) {
      StorageService.resetToDemo();
      onRefreshData();
      alert('Datos restaurados correctamente.');
    }
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveCompanyInfo(tempCompanyInfo);
    setCompanyInfo(tempCompanyInfo);
    setShowConfigModal(false);
    alert(`Nombre de empresa actualizado a "${tempCompanyInfo.name}".`);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Lateral Sidebar (Fina Partner Style with Dynamic Company Name) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2 space-y-4 scrollbar-thin">
          {/* Top Brand on Mobile */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex items-center -space-x-1 shrink-0">
                <span className="w-1.5 h-5 bg-rose-500 rounded-full transform -skew-x-12"></span>
                <span className="w-1.5 h-5 bg-fuchsia-500 rounded-full transform -skew-x-12"></span>
                <span className="w-1.5 h-5 bg-purple-600 rounded-full transform -skew-x-12"></span>
                <span className="w-1.5 h-5 bg-indigo-500 rounded-full transform -skew-x-12"></span>
              </div>
              <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight truncate max-w-[140px]">
                {companyInfo.name || 'TuVisión'}
              </span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 shrink-0">
                isp
              </span>
            </div>
            <button
              onClick={() => setIsOpenMobile(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Top Switch Card: "Abrir Bodega / Turno ⓘ" + Cierre del Día Button */}
          <div className="p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <span>Abrir Bodega</span>
                <span title="Habilita el turno de recepción y despacho de equipos">
                  <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsBodegaOpen(!isBodegaOpen)}
                className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  isBodegaOpen ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span className="sr-only">Estado Bodega</span>
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center text-[9px] font-bold ${
                    isBodegaOpen ? 'translate-x-6 text-emerald-600' : 'translate-x-0 text-slate-400'
                  }`}
                >
                  {isBodegaOpen ? 'I' : 'O'}
                </span>
              </button>
            </div>

            {/* Quick Cierre del Día Button right in the switch card */}
            <button
              onClick={() => {
                onOpenDailyClosing();
                setIsOpenMobile(false);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900 rounded-xl transition border border-purple-200/60 dark:border-purple-800/60"
            >
              <span>📄 Cierre Diario (PDF)</span>
            </button>
          </div>

          {/* SECTION: MÓDULOS */}
          <div className="space-y-1">
            <p className="px-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              MÓDULOS
            </p>

            <nav className="space-y-0.5 pt-1">
              {/* Home / Dashboard */}
              <button
                onClick={() => {
                  setActiveTab('dashboard');
                  setIsOpenMobile(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'dashboard'
                    ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Home className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
                  <span>Home</span>
                </div>
              </button>

              {/* Inventario FTTH */}
              <button
                onClick={() => {
                  setActiveTab('inventory');
                  setIsOpenMobile(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'inventory'
                    ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Boxes className={`w-4 h-4 ${activeTab === 'inventory' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
                  <span>Inventario</span>
                </div>
                <div className="flex items-center gap-1">
                  {lowStockCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
                      {lowStockCount}
                    </span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </button>

              {/* Entradas & Salidas (Despachos) */}
              <button
                onClick={() => {
                  setActiveTab('dispatches');
                  setIsOpenMobile(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'dispatches'
                    ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Truck className={`w-4 h-4 ${activeTab === 'dispatches' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
                  <span>Entradas y Salidas</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Clientes */}
              <button
                onClick={() => {
                  setActiveTab('customers');
                  setIsOpenMobile(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'customers'
                    ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className={`w-4 h-4 ${activeTab === 'customers' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
                  <span>Clientes</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Técnicos & Cuadrillas */}
              <button
                onClick={() => {
                  setActiveTab('technicians');
                  setIsOpenMobile(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'technicians'
                    ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Wrench className={`w-4 h-4 ${activeTab === 'technicians' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
                  <span>Técnicos</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              </button>

              {/* Reportes PDF */}
              <button
                onClick={() => {
                  setActiveTab('reports');
                  setIsOpenMobile(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'reports'
                    ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className={`w-4 h-4 ${activeTab === 'reports' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
                  <span>Reportes PDF</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                    Nuevo 🚀
                  </span>
                </div>
              </button>
            </nav>
          </div>

          {/* SECTION: CONFIGURACIÓN */}
          <div className="space-y-1 pt-2">
            <p className="px-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              CONFIGURACIÓN
            </p>

            <nav className="space-y-0.5 pt-1">
              <button
                onClick={() => setShowConfigModal(true)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Configuración ISP</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Gestión de Usuarios Link */}
              <button
                onClick={() => {
                  onOpenAuth?.('users');
                  setIsOpenMobile(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Usuarios & Personal</span>
                </div>
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 px-1.5 py-0.2 rounded-md bg-purple-50 dark:bg-purple-950/60">
                  {currentUser?.role === 'admin' ? '👑 Admin (Eliminar)' : 'Ver Perfiles'}
                </span>
              </button>

              {/* Sincronización Google Sheets Link */}
              <button
                onClick={() => {
                  onOpenGoogleSheets?.();
                  setIsOpenMobile(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Google Sheets Sync</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800">
                  Sheets API
                </span>
              </button>

              <button
                onClick={() => setShowHelpModal(true)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  <span>Centro de ayuda FTTH</span>
                </div>
              </button>

              {/* Restablecer Registros desde Cero Link */}
              <button
                onClick={() => {
                  onOpenResetModal?.();
                  setIsOpenMobile(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition group"
              >
                <div className="flex items-center gap-3">
                  <RotateCcw className="w-4 h-4 text-red-500 group-hover:rotate-180 transition-transform duration-500" />
                  <span>Restablecer Registros</span>
                </div>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-300">
                  A Cero
                </span>
              </button>
            </nav>
          </div>

          {/* FINA STYLE PROMO BUTTONS (Exact to Fina Partner screenshot) */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-100/70 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-950/80 rounded-2xl transition"
            >
              <Gift className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Copia de Seguridad</span>
            </button>

            <button
              onClick={() => {
                onOpenNewDispatch();
                setIsOpenMobile(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-100/70 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-950/80 rounded-2xl transition"
            >
              <UserPlus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>+ Nuevo Despacho</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500 text-white ml-0.5">
                Rápido
              </span>
            </button>
          </div>
        </div>

        {/* Footer: User profile and company details */}
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60 space-y-2">
          {currentUser ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Sesión Activa:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onOpenAuth?.('users');
                    setIsOpenMobile(false);
                  }}
                  className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Cambiar
                </button>
              </div>

              <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                <div
                  className={`w-7 h-7 rounded-full ${
                    currentUser.avatarColor || 'bg-purple-600'
                  } text-white font-bold text-[10px] flex items-center justify-center shrink-0`}
                >
                  {currentUser.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold truncate">
                    {ROLE_LABELS[currentUser.role]?.label || 'Usuario'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    onOpenAuth?.('register');
                    setIsOpenMobile(false);
                  }}
                  className="text-purple-600 dark:text-purple-400 hover:underline font-semibold flex items-center gap-1"
                >
                  <span>+ Crear Usuario</span>
                </button>
                <button
                  type="button"
                  onClick={() => onLogout?.()}
                  className="text-slate-400 hover:text-red-500 font-medium flex items-center gap-0.5"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Salir</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-1">
              <button
                type="button"
                onClick={() => {
                  onOpenAuth?.('login');
                  setIsOpenMobile(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl shadow-xs transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Iniciar Sesión / Registro</span>
              </button>
            </div>
          )}

          <div className="pt-1 border-t border-slate-200/50 dark:border-slate-800 text-[10px] text-slate-400 truncate">
            <span>ISP: </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {companyInfo.name || 'TuVisión'}
            </span>
          </div>
        </div>
      </aside>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-purple-600" />
              Centro de Ayuda FTTH & Guía Rápida
            </h3>
            <div className="mt-4 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl">
                <span className="font-bold text-purple-800 dark:text-purple-300 block mb-1">
                  📦 Salidas a Técnicos & Clientes:
                </span>
                Cada salida descuenta automáticamente el stock y genera un Acta de Entrega con firmas descargable en PDF.
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                  📥 Entradas de Proveedores:
                </span>
                Permite sumar cantidades y cargar números de serie (S/N y MAC) de ONUs recibidas.
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                <span className="font-bold text-blue-800 dark:text-blue-300 block mb-1">
                  📄 Reportes Automáticos:
                </span>
                Desde la pestaña Reportes PDF puedes generar actas de entrega, inventario físico o balance de movimientos en 1 clic.
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Config / Company Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowConfigModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              Configuración del ISP & Respaldos
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Personaliza los membretes de tus reportes PDF y gestiona copias de seguridad del sistema.
            </p>

            <form onSubmit={handleSaveCompany} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de la Empresa / ISP (Aparece en logo, cabeceras y reportes) *
                </label>
                <input
                  type="text"
                  required
                  value={tempCompanyInfo.name}
                  onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500 dark:text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    NIT / RUC / Cédula Jurídica
                  </label>
                  <input
                    type="text"
                    value={tempCompanyInfo.nit}
                    onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, nit: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono Soporte
                  </label>
                  <input
                    type="text"
                    value={tempCompanyInfo.phone}
                    onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={tempCompanyInfo.email}
                    onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ciudad / Región
                  </label>
                  <input
                    type="text"
                    value={tempCompanyInfo.city}
                    onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, city: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dirección Base / Bodega
                </label>
                <input
                  type="text"
                  value={tempCompanyInfo.address}
                  onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition"
                >
                  Guardar Datos de Empresa
                </button>
              </div>
            </form>

            <hr className="my-5 border-slate-200 dark:border-slate-800" />

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Respaldo y Restauración de Datos
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={handleExport}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  <Download className="w-4 h-4 text-emerald-500" />
                  Descargar Copia (JSON)
                </button>

                <label className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition">
                  <Upload className="w-4 h-4 text-purple-600" />
                  Restaurar Copia (JSON)
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfigModal(false);
                    onOpenResetModal?.();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 rounded-xl transition shadow-md shadow-red-500/20"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restablecer desde Cero Todos los Registros
                </button>

                <button
                  type="button"
                  onClick={handleResetDemo}
                  className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Restaurar Datos de Demostración (Demo Inicial)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
