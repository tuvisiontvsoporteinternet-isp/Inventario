import React, { useState } from 'react';
import {
  Boxes,
  LayoutDashboard,
  Truck,
  Users,
  Wrench,
  FileText,
  Moon,
  Sun,
  Menu,
  X,
  Download,
  Upload,
  RotateCcw,
  Building2,
} from 'lucide-react';
import { StorageService, CompanyInfo } from '../services/storage';

export type NavTab = 'dashboard' | 'inventory' | 'dispatches' | 'customers' | 'technicians' | 'reports';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isDark: boolean;
  toggleTheme: () => void;
  onOpenNewDispatch: () => void;
  onRefreshData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isDark,
  toggleTheme,
  onOpenNewDispatch,
  onRefreshData,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(StorageService.getCompanyInfo());

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'inventory', label: 'Inventario ISP', icon: <Boxes className="w-4 h-4" /> },
    { id: 'dispatches', label: 'Entradas & Salidas', icon: <Truck className="w-4 h-4" /> },
    { id: 'customers', label: 'Clientes', icon: <Users className="w-4 h-4" /> },
    { id: 'technicians', label: 'Técnicos', icon: <Wrench className="w-4 h-4" /> },
    { id: 'reports', label: 'Reportes PDF', icon: <FileText className="w-4 h-4" /> },
  ];

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
    StorageService.saveCompanyInfo(companyInfo);
    setShowConfigModal(false);
    alert('Información del ISP actualizada para los reportes PDF.');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">NetStock</span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 uppercase">ISP</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-none">Inventario & Despachos FTTH</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Quick Dispatch CTA */}
            <button
              onClick={onOpenNewDispatch}
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-sm transition"
            >
              <Truck className="w-4 h-4" />
              <span>+ Nuevo Despacho</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
            </button>

            {/* Settings & Backup Modal Button */}
            <button
              onClick={() => setShowConfigModal(true)}
              title="Ajustes de Empresa y Copias de Seguridad"
              className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Building2 className="w-5 h-5" />
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-2">
          <div className="grid grid-cols-2 gap-2 pt-2">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    active
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                onOpenNewDispatch();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl"
            >
              <Truck className="w-4 h-4" />
              + Registrar Despacho / Entrada
            </button>
          </div>
        </div>
      )}

      {/* Company & Backup Modal */}
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
              <Building2 className="w-5 h-5 text-blue-600" />
              Configuración del ISP & Respaldos
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Personaliza los membretes de tus reportes PDF y gestiona copias de seguridad del sistema.
            </p>

            <form onSubmit={handleSaveCompany} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de la Empresa / ISP
                </label>
                <input
                  type="text"
                  required
                  value={companyInfo.name}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    NIT / RUC / Cédula Jurídica
                  </label>
                  <input
                    type="text"
                    value={companyInfo.nit}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, nit: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono Soporte
                  </label>
                  <input
                    type="text"
                    value={companyInfo.phone}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 dark:text-white"
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
                    value={companyInfo.email}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ciudad / Región
                  </label>
                  <input
                    type="text"
                    value={companyInfo.city}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, city: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dirección Base / Bodega
                </label>
                <input
                  type="text"
                  value={companyInfo.address}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
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
                  <Upload className="w-4 h-4 text-blue-500" />
                  Restaurar Copia (JSON)
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
              </div>

              <button
                onClick={handleResetDemo}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/70 rounded-xl transition mt-2"
              >
                <RotateCcw className="w-4 h-4" />
                Restablecer a Datos de Demostración
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
