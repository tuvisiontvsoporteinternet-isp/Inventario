import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Moon,
  Sun,
  Search,
  CheckCircle2,
  Bell,
  X,
  User,
  LogIn,
  UserPlus,
  LogOut,
  Users,
  ChevronDown,
  Shield,
  FileSpreadsheet,
  RotateCcw,
} from 'lucide-react';
import { NavTab } from './Navbar';
import { AuthUser, ROLE_LABELS } from '../types/auth';
import { isGoogleConnected } from '../services/googleAuth';

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
  onOpenGoogleSheets?: () => void;
  onOpenResetModal?: () => void;
  currentUser?: AuthUser | null;
  onOpenAuth?: (mode?: 'login' | 'register' | 'users') => void;
  onLogout?: () => void;
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
  onOpenGoogleSheets,
  onOpenResetModal,
  currentUser,
  onOpenAuth,
  onLogout,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initials for avatar
  const userInitials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('')
    : 'U';

  const roleConfig = currentUser?.role ? ROLE_LABELS[currentUser.role] : null;

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
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate max-w-[160px] sm:max-w-[280px]">
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

        {/* Right Controls: Cierre Diario, Theme Toggle & User Auth */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Google Sheets Sync Button */}
          {onOpenGoogleSheets && (
            <button
              onClick={onOpenGoogleSheets}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl transition shadow-2xs border ${
                isGoogleConnected()
                  ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/70 dark:hover:bg-emerald-900 border-emerald-300 dark:border-emerald-700'
                  : 'text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700'
              }`}
              title={
                isGoogleConnected()
                  ? 'Google Sheets Conectado • Sincronización activa'
                  : 'Conectar y Sincronizar con Google Sheets'
              }
            >
              {isGoogleConnected() && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              )}
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="hidden md:inline">
                {isGoogleConnected() ? 'Sheets Conectado' : 'Google Sheets'}
              </span>
              <span className="md:hidden">Sheets</span>
            </button>
          )}

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
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
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

          {/* User Auth Profile Dropdown */}
          <div className="relative" ref={userMenuRef}>
            {currentUser ? (
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                <div
                  className={`w-8 h-8 rounded-full ${
                    currentUser.avatarColor || 'bg-purple-600'
                  } text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0`}
                >
                  {userInitials}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[110px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium truncate max-w-[110px]">
                    {roleConfig?.label || 'Usuario'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuth?.('login')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl shadow-xs transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Ingresar</span>
              </button>
            )}

            {/* Dropdown Menu */}
            {isUserMenuOpen && currentUser && (
              <div className="absolute right-0 mt-2 w-56 p-1.5 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 text-xs animate-in fade-in zoom-in-95">
                <div className="p-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <p className="font-bold text-slate-900 dark:text-white truncate">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
                  <span
                    className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded-md mt-1.5 ${
                      roleConfig?.bg || 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {roleConfig?.label || 'Usuario'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onOpenAuth?.('register');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-xl transition font-medium"
                >
                  <UserPlus className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>+ Crear Nuevo Usuario</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onOpenAuth?.('users');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-xl transition font-medium"
                >
                  <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Directorio de Usuarios</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onOpenAuth?.('login');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-xl transition font-medium"
                >
                  <LogIn className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Cambiar de Usuario</span>
                </button>

                {onOpenResetModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenResetModal();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition font-medium"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-red-500" />
                    <span>Restablecer Registros a Cero</span>
                  </button>
                )}

                <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout?.();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
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
