import React from 'react';
import {
  Menu,
  Moon,
  Sun,
  Search,
  CheckCircle2,
  Bell,
  X,
} from 'lucide-react';
import { NavTab } from './Navbar';

interface TopHeaderProps {
  activeTab: NavTab;
  onOpenMobileMenu: () => void;
  isDark: boolean;
  toggleTheme: () => void;
  searchGlobal: string;
  setSearchGlobal: (query: string) => void;
  toastMessage?: { text: string; type: 'success' | 'error' } | null;
  onCloseToast?: () => void;
  companyName?: string;
  onOpenDailyClosing?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  onOpenMobileMenu,
  isDark,
  toggleTheme,
  searchGlobal,
  setSearchGlobal,
  toastMessage,
  onCloseToast,
  companyName = 'TuVisión',
  onOpenDailyClosing,
}) => {
  // Get initials for avatar
  const initials = companyName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'ISP';

  return (
    <header className="sticky top-0 z-30 w-full bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 transition-colors">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Hamburger & Dynamic Brand Logo configured in Ajustes */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenMobileMenu}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Dynamic Company Logo */}
          <div className="flex items-center gap-2 select-none cursor-pointer">
            <div className="flex items-center -space-x-1 shrink-0">
              <span className="w-1.5 h-6 bg-rose-500 rounded-full transform -skew-x-12"></span>
              <span className="w-1.5 h-6 bg-fuchsia-500 rounded-full transform -skew-x-12"></span>
              <span className="w-1.5 h-6 bg-purple-600 rounded-full transform -skew-x-12"></span>
              <span className="w-1.5 h-6 bg-indigo-500 rounded-full transform -skew-x-12"></span>
            </div>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate max-w-[180px] sm:max-w-[280px]">
              {companyName}
            </span>
            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 shrink-0">
              isp
            </span>
          </div>
        </div>

        {/* Center: Search Input (Rounded pill as seen in Fina header) */}
        <div className="flex-1 max-w-md mx-auto hidden sm:block">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar en inventario, clientes, órdenes..."
              value={searchGlobal}
              onChange={(e) => setSearchGlobal(e.target.value)}
              className="w-full pl-4 pr-10 py-2 text-xs bg-slate-100/80 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-transparent focus:border-purple-500 focus:bg-white dark:focus:bg-slate-850 focus:outline-hidden transition placeholder:text-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Right Controls: Cierre Diario, Theme Toggle & Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Cierre Diario Button */}
          {onOpenDailyClosing && (
            <button
              onClick={onOpenDailyClosing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-100/80 hover:bg-purple-200 dark:bg-purple-950/80 dark:hover:bg-purple-900 rounded-xl transition shadow-2xs"
              title="Realizar Cierre de Bodega del Día y Descargar PDF"
            >
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
              <span className="hidden md:inline">Cierre Diario PDF</span>
              <span className="md:hidden">Cierre PDF</span>
            </button>
          )}

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Oscuro</span>
              </>
            )}
          </button>

          {/* User Avatar Circle */}
          <div
            className="w-9 h-9 rounded-full bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-800 flex items-center justify-center text-cyan-700 dark:text-cyan-300 font-bold text-xs select-none shadow-xs"
            title={companyName}
          >
            {initials}
          </div>
        </div>
      </div>

      {/* Floating Success Notification (exact to Fina screenshot hqdefault.jpg) */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-start gap-3 p-3.5 bg-emerald-50 dark:bg-emerald-950/90 border border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-xl max-w-sm animate-in slide-in-from-top-3">
          <div className="p-1 rounded-full bg-emerald-500 text-white shrink-0 mt-0.5">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-emerald-900 dark:text-emerald-200">Operación exitosa</p>
            <p className="text-emerald-700 dark:text-emerald-300 mt-0.5">{toastMessage.text}</p>
          </div>
          {onCloseToast && (
            <button
              onClick={onCloseToast}
              className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </header>
  );
};
