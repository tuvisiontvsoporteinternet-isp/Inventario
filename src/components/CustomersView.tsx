import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  Clock,
  Ban,
  Boxes,
  Truck,
  X,
  UserCheck,
} from 'lucide-react';
import { Customer, DispatchOrder } from '../types/inventory';
import { ConfirmModal } from './ConfirmModal';

interface CustomersViewProps {
  customers: Customer[];
  orders: DispatchOrder[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onDispatchToCustomer: (customer: Customer) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  orders,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onDispatchToCustomer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [viewingHistoryCustomer, setViewingHistoryCustomer] = useState<Customer | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Customer>>({
    code: '',
    fullName: '',
    documentId: '',
    phone: '',
    email: '',
    address: '',
    neighborhood: '',
    plan: 'Fibra Ultra 300 Mbps',
    status: 'activo',
    notes: '',
  });

  const filteredCustomers = customers.filter((cust) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      cust.fullName.toLowerCase().includes(q) ||
      cust.code.toLowerCase().includes(q) ||
      cust.documentId.toLowerCase().includes(q) ||
      cust.address.toLowerCase().includes(q) ||
      cust.phone.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || cust.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      code: `CLI-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: '',
      documentId: '',
      phone: '',
      email: '',
      address: '',
      neighborhood: '',
      plan: 'Fibra Ultra 300 Mbps Simétrico',
      status: 'instalacion_pendiente',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({ ...customer });
    setIsModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.address) {
      alert('Nombre y dirección son campos requeridos.');
      return;
    }

    if (editingCustomer) {
      onUpdateCustomer({
        ...editingCustomer,
        ...(formData as Customer),
      });
    } else {
      const newCust: Customer = {
        id: `cli-${Date.now()}`,
        code: formData.code || `CLI-${Date.now()}`,
        fullName: formData.fullName || '',
        documentId: formData.documentId || 'S/N',
        phone: formData.phone || '',
        email: formData.email || '',
        address: formData.address || '',
        neighborhood: formData.neighborhood || '',
        plan: formData.plan || 'Fibra 200 Mbps',
        status: (formData.status as Customer['status']) || 'instalacion_pendiente',
        notes: formData.notes || '',
        createdAt: new Date().toISOString().substring(0, 10),
      };
      onAddCustomer(newCust);
    }
    setIsModalOpen(false);
  };

  // Get orders assigned to a specific customer
  const getCustomerAssignedOrders = (customer: Customer) => {
    return orders.filter(
      (o) =>
        o.customerId === customer.id ||
        (o.customerName &&
          o.customerName.toLowerCase().trim() === customer.fullName.toLowerCase().trim())
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            Directorio de Clientes & Abonados FTTH
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gestión completa de suscriptores, direcciones de acometida y trazabilidad de equipos entregados.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-95 rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          Registrar Nuevo Cliente
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
              statusFilter === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Todos ({customers.length})
          </button>
          <button
            onClick={() => setStatusFilter('activo')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
              statusFilter === 'activo'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Activos ({customers.filter((c) => c.status === 'activo').length})
          </button>
          <button
            onClick={() => setStatusFilter('instalacion_pendiente')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
              statusFilter === 'instalacion_pendiente'
                ? 'bg-amber-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Pendientes ({customers.filter((c) => c.status === 'instalacion_pendiente').length})
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula, dirección o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            No se encontraron clientes con el criterio de búsqueda.
          </div>
        ) : (
          filteredCustomers.map((customer) => {
            const customerOrders = getCustomerAssignedOrders(customer);
            return (
              <div
                key={customer.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                        {customer.code}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        {customer.fullName}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Doc: {customer.documentId}
                      </p>
                    </div>

                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        customer.status === 'activo'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : customer.status === 'instalacion_pendiente'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                      }`}
                    >
                      {customer.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate">{customer.address}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{customer.phone}</span>
                    </div>

                    <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-[11px]">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Plan Contratado:
                      </span>{' '}
                      <span className="text-blue-600 dark:text-blue-400 font-bold">
                        {customer.plan}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => setViewingHistoryCustomer(customer)}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Boxes className="w-3.5 h-3.5" />
                    <span>Equipos ({customerOrders.length})</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onDispatchToCustomer(customer)}
                      title="Despachar material a este cliente"
                      className="p-1.5 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                    >
                      <Truck className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleOpenEdit(customer)}
                      title="Editar cliente"
                      className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setCustomerToDelete(customer)}
                      title="Eliminar cliente"
                      className="p-1.5 text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add or Edit Customer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              {editingCustomer ? 'Editar Datos del Cliente' : 'Registrar Nuevo Cliente / Abonado'}
            </h3>

            <form onSubmit={handleSaveCustomer} className="mt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Código de Abonado *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cédula / DNI / NIT *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.documentId || ''}
                    onChange={(e) => setFormData({ ...formData, documentId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Completo / Razón Social *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: Juan Carlos Pérez Gómez"
                  value={formData.fullName || ''}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono Celular *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dirección de Instalación *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Calle, Carrera, Manzana, Casa o Apto"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Barrio / Sector
                  </label>
                  <input
                    type="text"
                    value={formData.neighborhood || ''}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estado del Servicio
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                  >
                    <option value="instalacion_pendiente">Instalación Pendiente</option>
                    <option value="activo">Activo</option>
                    <option value="suspendido">Suspendido</option>
                    <option value="baja">Baja / Retirado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Plan Contratado
                </label>
                <input
                  type="text"
                  placeholder="ej: Fibra Óptica 400 Mbps Simétrico"
                  value={formData.plan || ''}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notas de Conexión / Puerto NAP
                </label>
                <textarea
                  rows={2}
                  placeholder="ej: Caja NAP-04 puerto 6, potencia -18 dBm"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
                >
                  {editingCustomer ? 'Guardar Cambios' : 'Registrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Equipment Assigned to Customer */}
      {viewingHistoryCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xl p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setViewingHistoryCustomer(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Boxes className="w-5 h-5 text-blue-600" />
              Equipos Asignados a: {viewingHistoryCustomer.fullName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Dirección: {viewingHistoryCustomer.address} ({viewingHistoryCustomer.code})
            </p>

            <div className="mt-4 space-y-3">
              {getCustomerAssignedOrders(viewingHistoryCustomer).length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs">
                  No hay órdenes de entrega registradas aún para este cliente.
                </div>
              ) : (
                getCustomerAssignedOrders(viewingHistoryCustomer).map((order) => (
                  <div
                    key={order.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700 pb-2">
                      <div className="font-bold text-slate-900 dark:text-white font-mono">
                        {order.orderNumber}
                      </div>
                      <div className="text-[11px] text-slate-500">{order.date}</div>
                    </div>

                    <div className="text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Entregado por el técnico:
                      </span>{' '}
                      {order.technicianName || 'No especificado'}
                    </div>

                    <div className="space-y-1">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                        Materiales y Seriales:
                      </span>
                      {order.items.map((itm, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-1.5 bg-white dark:bg-slate-800 rounded-lg text-[11px]"
                        >
                          <span className="text-slate-800 dark:text-slate-200 font-medium">
                            {itm.quantity} {itm.unit} - {itm.equipmentName}
                          </span>
                          {itm.serialNumbers && itm.serialNumbers.length > 0 && (
                            <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                              S/N: {itm.serialNumbers.join(', ')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <p className="text-[11px] text-slate-500 italic">Nota: {order.notes}</p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setViewingHistoryCustomer(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Customer */}
      <ConfirmModal
        isOpen={!!customerToDelete}
        title="¿Eliminar este cliente?"
        message={`Esta acción eliminará a "${customerToDelete?.fullName}" (${customerToDelete?.code}).`}
        confirmText="Eliminar Cliente"
        onConfirm={() => {
          if (customerToDelete) {
            onDeleteCustomer(customerToDelete.id);
            setCustomerToDelete(null);
          }
        }}
        onCancel={() => setCustomerToDelete(null)}
      />
    </div>
  );
};
