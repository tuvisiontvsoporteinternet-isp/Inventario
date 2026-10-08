import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { NavTab } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { InventoryView } from './components/InventoryView';
import { DispatchesView } from './components/DispatchesView';
import { CustomersView } from './components/CustomersView';
import { TechniciansView } from './components/TechniciansView';
import { ReportsView } from './components/ReportsView';
import { DailyClosingModal } from './components/DailyClosingModal';
import { StorageService, CompanyInfo } from './services/storage';
import { EquipmentItem, Customer, Technician, DispatchOrder, MovementType } from './types/inventory';

export default function App() {
  // Theme state: defaults to light mode so the crisp Fina white design is shown immediately!
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('netstock_theme');
      if (saved) return saved === 'dark';
      return false; // Default to light mode
    } catch {
      return false;
    }
  });

  // Apply dark mode class to html element
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('netstock_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('netstock_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  // Dynamic Company info configured in Ajustes
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() =>
    StorageService.getCompanyInfo()
  );

  // App Navigation (Left Lateral Sidebar)
  const [activeTab, setActiveTab] = useState<NavTab>('inventory');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isBodegaOpen, setIsBodegaOpen] = useState(true);
  const [searchGlobal, setSearchGlobal] = useState('');

  // Daily Closing Modal state
  const [isDailyClosingModalOpen, setIsDailyClosingModalOpen] = useState(false);

  // Core Data State
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [orders, setOrders] = useState<DispatchOrder[]>([]);

  // Dispatch Modal Trigger state
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchModalInitialType, setDispatchModalInitialType] = useState<MovementType>('salida');

  // Toast notifications (exact to Fina screenshot hqdefault.jpg)
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const loadAllData = () => {
    setEquipment(StorageService.getEquipment());
    setCustomers(StorageService.getCustomers());
    setTechnicians(StorageService.getTechnicians());
    setOrders(StorageService.getOrders());
    setCompanyInfo(StorageService.getCompanyInfo());
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const lowStockCount = equipment.filter((eq) => eq.stock <= eq.minStock).length;

  // CRUD Handlers for Equipment
  const handleAddEquipment = (item: EquipmentItem) => {
    const updated = [item, ...equipment];
    StorageService.saveEquipment(updated);
    setEquipment(updated);
    showToast(`Equipo "${item.name}" registrado correctamente en inventario.`);
  };

  const handleUpdateEquipment = (item: EquipmentItem) => {
    const updated = equipment.map((eq) => (eq.id === item.id ? item : eq));
    StorageService.saveEquipment(updated);
    setEquipment(updated);
    showToast(`Equipo "${item.name}" actualizado con éxito.`);
  };

  const handleDeleteEquipment = (id: string) => {
    const target = equipment.find((e) => e.id === id);
    const updated = equipment.filter((eq) => eq.id !== id);
    StorageService.saveEquipment(updated);
    setEquipment(updated);
    showToast(`Equipo "${target?.name || ''}" eliminado del inventario.`);
  };

  const handleQuickAdjustStock = (id: string, newStock: number) => {
    const updated = equipment.map((eq) => {
      if (eq.id === id) {
        return {
          ...eq,
          stock: newStock,
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
      }
      return eq;
    });
    StorageService.saveEquipment(updated);
    setEquipment(updated);
    showToast('Ajuste de inventario aplicado con éxito.');
  };

  // CRUD Handlers for Customers
  const handleAddCustomer = (customer: Customer) => {
    const updated = [customer, ...customers];
    StorageService.saveCustomers(updated);
    setCustomers(updated);
    showToast(`Cliente "${customer.fullName}" registrado con éxito.`);
  };

  const handleUpdateCustomer = (customer: Customer) => {
    const updated = customers.map((c) => (c.id === customer.id ? customer : c));
    StorageService.saveCustomers(updated);
    setCustomers(updated);
    showToast(`Datos de "${customer.fullName}" actualizados.`);
  };

  const handleDeleteCustomer = (id: string) => {
    const target = customers.find((c) => c.id === id);
    const updated = customers.filter((c) => c.id !== id);
    StorageService.saveCustomers(updated);
    setCustomers(updated);
    showToast(`Cliente "${target?.fullName || ''}" eliminado.`);
  };

  // CRUD Handlers for Technicians
  const handleAddTechnician = (tech: Technician) => {
    const updated = [tech, ...technicians];
    StorageService.saveTechnicians(updated);
    setTechnicians(updated);
    showToast(`Técnico "${tech.fullName}" registrado.`);
  };

  const handleUpdateTechnician = (tech: Technician) => {
    const updated = technicians.map((t) => (t.id === tech.id ? tech : t));
    StorageService.saveTechnicians(updated);
    setTechnicians(updated);
    showToast(`Técnico "${tech.fullName}" actualizado.`);
  };

  const handleDeleteTechnician = (id: string) => {
    const target = technicians.find((t) => t.id === id);
    const updated = technicians.filter((t) => t.id !== id);
    StorageService.saveTechnicians(updated);
    setTechnicians(updated);
    showToast(`Técnico "${target?.fullName || ''}" eliminado.`);
  };

  // Modal triggers
  const handleOpenNewDispatch = () => {
    setDispatchModalInitialType('salida');
    setIsDispatchModalOpen(true);
    setActiveTab('dispatches');
  };

  const handleOpenNewEntry = () => {
    setDispatchModalInitialType('entrada');
    setIsDispatchModalOpen(true);
    setActiveTab('dispatches');
  };

  const handleDispatchToCustomer = (customer: Customer) => {
    setDispatchModalInitialType('salida');
    setIsDispatchModalOpen(true);
    setActiveTab('dispatches');
  };

  const handleNewDispatchForTech = (tech: Technician) => {
    setDispatchModalInitialType('salida');
    setIsDispatchModalOpen(true);
    setActiveTab('dispatches');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 font-sans transition-colors flex">
      {/* Lateral Left Sidebar (Fina Partner Style with Dynamic Company Name) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpenMobile={isMobileSidebarOpen}
        setIsOpenMobile={setIsMobileSidebarOpen}
        lowStockCount={lowStockCount}
        onOpenNewDispatch={handleOpenNewDispatch}
        onRefreshData={() => {
          loadAllData();
          showToast('Datos sincronizados.');
        }}
        isBodegaOpen={isBodegaOpen}
        setIsBodegaOpen={setIsBodegaOpen}
        companyInfo={companyInfo}
        setCompanyInfo={(c) => {
          setCompanyInfo(c);
          showToast(`Nombre actualizado a "${c.name}".`);
        }}
        onOpenDailyClosing={() => setIsDailyClosingModalOpen(true)}
      />

      {/* Main Content Layout with Left Offset on Desktop (w-64) */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen transition-all">
        {/* Top Header with Dynamic Company Name */}
        <TopHeader
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          isDark={isDark}
          toggleTheme={toggleTheme}
          searchGlobal={searchGlobal}
          setSearchGlobal={setSearchGlobal}
          toastMessage={toastMessage}
          onCloseToast={() => setToastMessage(null)}
          companyName={companyInfo.name}
          onOpenDailyClosing={() => setIsDailyClosingModalOpen(true)}
        />

        {/* Dynamic View Body */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              equipment={equipment}
              orders={orders}
              customers={customers}
              technicians={technicians}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenNewDispatch={handleOpenNewDispatch}
              onOpenNewEntry={handleOpenNewEntry}
              isBodegaOpen={isBodegaOpen}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              equipment={equipment}
              onAddEquipment={handleAddEquipment}
              onUpdateEquipment={handleUpdateEquipment}
              onDeleteEquipment={handleDeleteEquipment}
              onQuickAdjustStock={handleQuickAdjustStock}
              onOpenNewDispatch={handleOpenNewDispatch}
              onOpenNewEntry={handleOpenNewEntry}
              searchFilterGlobal={searchGlobal}
            />
          )}

          {activeTab === 'dispatches' && (
            <DispatchesView
              orders={orders}
              equipment={equipment}
              customers={customers}
              technicians={technicians}
              onRefreshData={loadAllData}
              isCreateModalOpen={isDispatchModalOpen}
              setIsCreateModalOpen={setIsDispatchModalOpen}
              initialType={dispatchModalInitialType}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersView
              customers={customers}
              orders={orders}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onDispatchToCustomer={handleDispatchToCustomer}
            />
          )}

          {activeTab === 'technicians' && (
            <TechniciansView
              technicians={technicians}
              orders={orders}
              onAddTechnician={handleAddTechnician}
              onUpdateTechnician={handleUpdateTechnician}
              onDeleteTechnician={handleDeleteTechnician}
              onNewDispatchForTech={handleNewDispatchForTech}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              equipment={equipment}
              orders={orders}
              onOpenDailyClosing={() => setIsDailyClosingModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Daily Closing & PDF Download Modal */}
      <DailyClosingModal
        isOpen={isDailyClosingModalOpen}
        onClose={() => setIsDailyClosingModalOpen(false)}
        orders={orders}
        equipment={equipment}
        companyInfo={companyInfo}
        onClosingSuccess={(closing) => {
          showToast(`Cierre N° ${closing.closingNumber} ejecutado y PDF descargado.`);
        }}
      />
    </div>
  );
}
