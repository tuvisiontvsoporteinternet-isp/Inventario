import React, { useState } from 'react';
import {
  Wrench,
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Truck,
  CheckCircle2,
  XCircle,
  Boxes,
  X,
  User,
  Download,
} from 'lucide-react';
import { Technician, DispatchOrder } from '../types/inventory';
import { ConfirmModal } from './ConfirmModal';
import { PdfService } from '../services/pdfGenerator';

interface TechniciansViewProps {
  technicians: Technician[];
  orders: DispatchOrder[];
  onAddTechnician: (tech: Technician) => void;
  onUpdateTechnician: (tech: Technician) => void;
  onDeleteTechnician: (id: string) => void;
  onNewDispatchForTech: (tech: Technician) => void;
}

export const TechniciansView: React.FC<TechniciansViewProps> = ({
  technicians,
  orders,
  onAddTechnician,
  onUpdateTechnician,
  onDeleteTechnician,
  onNewDispatchForTech,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);
  const [techToDelete, setTechToDelete] = useState<Technician | null>(null);
  const [viewingHistoryTech, setViewingHistoryTech] = useState<Technician | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Technician>>({
    code: '',
    fullName: '',
    documentId: '',
    phone: '',
    crewName: '',
    vehiclePlate: '',
    active: true,
    notes: '',
  });

  const filteredTechs = technicians.filter((tech) => {
    const q = searchQuery.toLowerCase();
    return (
      tech.fullName.toLowerCase().includes(q) ||
      tech.code.toLowerCase().includes(q) ||
      tech.documentId.toLowerCase().includes(q) ||
      tech.crewName.toLowerCase().includes(q) ||
      (tech.vehiclePlate && tech.vehiclePlate.toLowerCase().includes(q))
    );
  });

  const handleOpenAdd = () => {
    setEditingTech(null);
    setFormData({
      code: `TEC-${String(technicians.length + 1).padStart(2, '0')}`,
      fullName: '',
      documentId: '',
      phone: '',
      crewName: `Cuadrilla #${technicians.length + 1} - FTTH`,
      vehiclePlate: '',
      active: true,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tech: Technician) => {
    setEditingTech(tech);
    setFormData({ ...tech });
    setIsModalOpen(true);
  };

  const handleSaveTechnician = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone) {
      alert('Nombre y teléfono son obligatorios.');
      return;
    }

    if (editingTech) {
      onUpdateTechnician({
        ...editingTech,
        ...(formData as Technician),
      });
    } else {
      const newTech: Technician = {
        id: `tec-${Date.now()}`,
        code: formData.code || `TEC-${Date.now()}`,
        fullName: formData.fullName || '',
        documentId: formData.documentId || 'S/N',
        phone: formData.phone || '',
        crewName: formData.crewName || 'Cuadrilla General',
        vehiclePlate: formData.vehiclePlate || '',
        active: formData.active ?? true,
        notes: formData.notes || '',
      };
      onAddTechnician(newTech);
    }
    setIsModalOpen(false);
  };

  const getTechDispatches = (tech: Technician) => {
    return orders.filter(
      (o) =>
        o.technicianId === tech.id ||
        (o.technicianName &&
          o.technicianName.toLowerCase().trim() === tech.fullName.toLowerCase().trim())
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Wrench className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            Técnicos de Campo & Cuadrillas FTTH
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Control de personal técnico receptor de materiales, asignación de vehículos y actas de entrega.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-95 rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          Registrar Nuevo Técnico
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar técnico por nombre, cédula, cuadrilla o placa del vehículo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
          />
        </div>
      </div>

      {/* Technicians Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTechs.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            No se encontraron técnicos registrados.
          </div>
        ) : (
          filteredTechs.map((tech) => {
            const techDispatches = getTechDispatches(tech);
            const totalDispatchedUnits = techDispatches.reduce(
              (acc, o) => acc + o.items.reduce((s, itm) => s + itm.quantity, 0),
              0
            );

            return (
              <div
                key={tech.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                        {tech.code}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        {tech.fullName}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-mono">
                        C.C: {tech.documentId}
                      </p>
                    </div>

                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full flex items-center gap-1 ${
                        tech.active
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {tech.active ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {tech.crewName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Vehículo: {tech.vehiclePlate || 'A pie / Sin vehículo asignado'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{tech.phone}</span>
                    </div>

                    {tech.notes && (
                      <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 italic">
                        {tech.notes}
                      </p>
                    )}
                  </div>

                  {/* Dispatches summary bar */}
                  <div className="mt-4 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Despachos Realizados
                      </span>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {techDispatches.length} órdenes
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Materiales Entregados
                      </span>
                      <p className="font-bold text-blue-600 dark:text-blue-400">
                        {totalDispatchedUnits} piezas
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => setViewingHistoryTech(tech)}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Boxes className="w-3.5 h-3.5" />
                    <span>Ver Entregas ({techDispatches.length})</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onNewDispatchForTech(tech)}
                      title="Entregar materiales a este técnico"
                      className="p-1.5 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                    >
                      <Truck className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleOpenEdit(tech)}
                      title="Editar técnico"
                      className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setTechToDelete(tech)}
                      title="Eliminar técnico"
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

      {/* Modal: Add or Edit Technician */}
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
              <Wrench className="w-5 h-5 text-blue-600" />
              {editingTech ? 'Editar Técnico' : 'Registrar Nuevo Técnico / Cuadrilla'}
            </h3>

            <form onSubmit={handleSaveTechnician} className="mt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Código Interno *
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
                    Cédula / Documento *
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
                  Nombre Completo del Técnico *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: Carlos Eduardo Ramírez"
                  value={formData.fullName || ''}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono Móvil *
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
                    Nombre de la Cuadrilla *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Cuadrilla #1 - Instalaciones"
                    value={formData.crewName || ''}
                    onChange={(e) => setFormData({ ...formData, crewName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vehículo / Placa
                  </label>
                  <input
                    type="text"
                    placeholder="ej: FTH-402 (Moto Cargo)"
                    value={formData.vehiclePlate || ''}
                    onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estado Operativo
                  </label>
                  <select
                    value={formData.active ? 'true' : 'false'}
                    onChange={(e) =>
                      setFormData({ ...formData, active: e.target.value === 'true' })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                  >
                    <option value="true">Activo en Terreno</option>
                    <option value="false">Inactivo / Permiso</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Especialidad / Observaciones
                </label>
                <textarea
                  rows={2}
                  placeholder="ej: Certificado en fusiones, empalmes de manga y conectorización..."
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
                  {editingTech ? 'Guardar Cambios' : 'Registrar Técnico'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Technician Dispatches */}
      {viewingHistoryTech && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setViewingHistoryTech(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Boxes className="w-5 h-5 text-blue-600" />
              Historial de Entregas al Técnico: {viewingHistoryTech.fullName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {viewingHistoryTech.crewName} | C.C: {viewingHistoryTech.documentId}
            </p>

            <div className="mt-4 space-y-3">
              {getTechDispatches(viewingHistoryTech).length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs">
                  No hay órdenes despachadas a este técnico todavía.
                </div>
              ) : (
                getTechDispatches(viewingHistoryTech).map((order) => (
                  <div
                    key={order.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white font-mono">
                          {order.orderNumber}
                        </span>
                        <span className="text-[10px] text-slate-500 capitalize">
                          {order.workType?.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">{order.date}</span>
                        <button
                          onClick={() => PdfService.generateDispatchReceipt(order)}
                          className="px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 rounded-md"
                        >
                          PDF
                        </button>
                      </div>
                    </div>

                    <div className="text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Destino / Cliente:
                      </span>{' '}
                      {order.customerName || 'Stock de Cuadrilla'} ({order.customerAddress || 'Mantenimiento'})
                    </div>

                    <div className="space-y-1">
                      {order.items.map((itm, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-1.5 bg-white dark:bg-slate-800 rounded-lg text-[11px]"
                        >
                          <span className="text-slate-800 dark:text-slate-200 font-medium">
                            {itm.quantity} {itm.unit} - {itm.equipmentName}
                          </span>
                          {itm.serialNumbers && itm.serialNumbers.length > 0 && (
                            <span className="font-mono text-blue-600 dark:text-blue-400">
                              SN: {itm.serialNumbers.join(', ')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setViewingHistoryTech(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Tech */}
      <ConfirmModal
        isOpen={!!techToDelete}
        title="¿Eliminar este técnico?"
        message={`Esta acción eliminará a "${techToDelete?.fullName}" (${techToDelete?.code}).`}
        confirmText="Eliminar Técnico"
        onConfirm={() => {
          if (techToDelete) {
            onDeleteTechnician(techToDelete.id);
            setTechToDelete(null);
          }
        }}
        onCancel={() => setTechToDelete(null)}
      />
    </div>
  );
};
