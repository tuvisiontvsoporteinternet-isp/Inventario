import React, { useState } from 'react';
import {
  Truck,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  Plus,
  Download,
  Calendar,
  Wrench,
  User,
  Trash2,
  Edit2,
  FileText,
  X,
  AlertCircle,
  PlusCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  DispatchOrder,
  EquipmentItem,
  Customer,
  Technician,
  DispatchItem,
  MovementType,
} from '../types/inventory';
import { PdfService } from '../services/pdfGenerator';
import { ConfirmModal } from './ConfirmModal';
import { StorageService } from '../services/storage';

interface DispatchesViewProps {
  orders: DispatchOrder[];
  equipment: EquipmentItem[];
  customers: Customer[];
  technicians: Technician[];
  onRefreshData: () => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  initialType?: MovementType;
}

export const DispatchesView: React.FC<DispatchesViewProps> = ({
  orders,
  equipment,
  customers,
  technicians,
  onRefreshData,
  isCreateModalOpen,
  setIsCreateModalOpen,
  initialType = 'salida',
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderToDelete, setOrderToDelete] = useState<DispatchOrder | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<DispatchOrder | null>(null);

  // Form State for New Dispatch / Entry
  const [movementType, setMovementType] = useState<MovementType>(initialType);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [selectedCustId, setSelectedCustId] = useState('');
  const [customTechName, setCustomTechName] = useState('');
  const [customCustName, setCustomCustName] = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [workType, setWorkType] = useState<DispatchOrder['workType']>('instalacion_nueva');
  const [supplierName, setSupplierName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [registeredBy, setRegisteredBy] = useState('Almacén Central (Admin)');

  // Dynamic Items in order
  const [itemsToDispatch, setItemsToDispatch] = useState<
    Array<{
      equipmentId: string;
      quantity: number;
      selectedSerials: string[];
    }>
  >([
    {
      equipmentId: equipment[0]?.id || '',
      quantity: 1,
      selectedSerials: [],
    },
  ]);

  const [formError, setFormError] = useState<string | null>(null);

  // Filtered orders
  const filteredOrders = orders.filter((order) => {
    const matchesType = filterType === 'all' || order.type === filterType;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(q) ||
      (order.technicianName && order.technicianName.toLowerCase().includes(q)) ||
      (order.customerName && order.customerName.toLowerCase().includes(q)) ||
      (order.customerAddress && order.customerAddress.toLowerCase().includes(q)) ||
      (order.notes && order.notes.toLowerCase().includes(q)) ||
      order.items.some((itm) => itm.equipmentName.toLowerCase().includes(q));

    return matchesType && matchesSearch;
  });

  const handleOpenCreateModal = (type: MovementType = 'salida') => {
    setMovementType(type);
    setSelectedTechId(technicians[0]?.id || '');
    setSelectedCustId(customers[0]?.id || '');
    setCustomTechName('');
    setCustomCustName('');
    setCustomAddress('');
    setWorkType('instalacion_nueva');
    setSupplierName('');
    setInvoiceNumber('');
    setOrderNotes('');
    setFormError(null);
    setItemsToDispatch([
      {
        equipmentId: equipment[0]?.id || '',
        quantity: 1,
        selectedSerials: [],
      },
    ]);
    setIsCreateModalOpen(true);
  };

  const handleAddItemRow = () => {
    setItemsToDispatch([
      ...itemsToDispatch,
      {
        equipmentId: equipment[0]?.id || '',
        quantity: 1,
        selectedSerials: [],
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (itemsToDispatch.length === 1) return;
    const next = [...itemsToDispatch];
    next.splice(index, 1);
    setItemsToDispatch(next);
  };

  const handleItemChange = (
    index: number,
    field: 'equipmentId' | 'quantity' | 'selectedSerials',
    value: any
  ) => {
    const next = [...itemsToDispatch];
    next[index] = { ...next[index], [field]: value };
    setItemsToDispatch(next);
  };

  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Resolve Technician
    const tech = technicians.find((t) => t.id === selectedTechId);
    const techName = tech ? tech.fullName : customTechName;

    // Resolve Customer
    const cust = customers.find((c) => c.id === selectedCustId);
    const custName = cust ? cust.fullName : customCustName;
    const custAddress = cust ? cust.address : customAddress;

    if (movementType === 'salida' && !techName) {
      setFormError('Debes seleccionar o especificar el técnico receptor del despacho.');
      return;
    }

    // Build Items
    const formattedItems: DispatchItem[] = [];
    for (const row of itemsToDispatch) {
      const eq = equipment.find((e) => e.id === row.equipmentId);
      if (!eq) continue;

      if (movementType === 'salida' && eq.stock < row.quantity) {
        setFormError(
          `Stock insuficiente para "${eq.name}". Hay ${eq.stock} en stock y solicitas ${row.quantity}.`
        );
        return;
      }

      formattedItems.push({
        equipmentId: eq.id,
        equipmentName: eq.name,
        category: eq.category,
        quantity: Number(row.quantity),
        unit: eq.unit,
        serialNumbers: row.selectedSerials.length > 0 ? row.selectedSerials : undefined,
      });
    }

    if (formattedItems.length === 0) {
      setFormError('Debes agregar al menos un material o equipo al despacho.');
      return;
    }

    const nextOrderNumber =
      movementType === 'salida'
        ? `DSP-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`
        : `ENT-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;

    const newOrder: DispatchOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: nextOrderNumber,
      type: movementType,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      technicianId: tech?.id,
      technicianName: techName,
      customerId: cust?.id,
      customerName: custName,
      customerAddress: custAddress,
      workType: movementType === 'salida' ? workType : 'ingreso_proveedor',
      status: 'completada',
      items: formattedItems,
      notes: orderNotes,
      supplier: supplierName,
      invoiceNumber: invoiceNumber,
      registeredBy: registeredBy || 'Almacén Central',
      createdAt: new Date().toISOString(),
    };

    const res = StorageService.createOrder(newOrder, true);
    if (!res.success) {
      setFormError(res.error || 'Ocurrió un error al procesar el despacho.');
      return;
    }

    setIsCreateModalOpen(false);
    onRefreshData();
  };

  const handleUpdateEditOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToEdit) return;

    const allOrders = StorageService.getOrders();
    const idx = allOrders.findIndex((o) => o.id === orderToEdit.id);
    if (idx !== -1) {
      allOrders[idx] = { ...orderToEdit };
      StorageService.saveOrders(allOrders);
      setOrderToEdit(null);
      onRefreshData();
    }
  };

  const handleConfirmDelete = () => {
    if (!orderToDelete) return;
    StorageService.deleteOrder(orderToDelete.id, true);
    setOrderToDelete(null);
    onRefreshData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Truck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            Control de Entradas y Salidas a Técnicos
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Registro con trazabilidad exacta: a qué técnico se le entregaron los materiales, para qué cliente y orden de trabajo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenCreateModal('entrada')}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 rounded-xl shadow-xs transition"
          >
            <ArrowDownLeft className="w-4 h-4 text-white" />
            + Registrar Entrada (Proveedor)
          </button>

          <button
            onClick={() => handleOpenCreateModal('salida')}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-95 rounded-xl shadow-xs transition"
          >
            <ArrowUpRight className="w-4 h-4 text-white" />
            + Nuevo Despacho a Técnico
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition ${
              filterType === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Todos ({orders.length})
          </button>

          <button
            onClick={() => setFilterType('salida')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition ${
              filterType === 'salida'
                ? 'bg-amber-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-500" />
            Salidas / Técnicos ({orders.filter((o) => o.type === 'salida').length})
          </button>

          <button
            onClick={() => setFilterType('entrada')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition ${
              filterType === 'entrada'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
            Entradas / Almacén ({orders.filter((o) => o.type === 'entrada').length})
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por folio, técnico, cliente o equipo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
          />
        </div>
      </div>

      {/* Orders List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Folio / Tipo</th>
                <th className="py-3 px-4">Fecha & Hora</th>
                <th className="py-3 px-4">Técnico Receptor</th>
                <th className="py-3 px-4">Cliente Asignado / Destino</th>
                <th className="py-3 px-4">Equipos Despachados</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No se encontraron registros de movimientos con el filtro aplicado.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isExit = order.type === 'salida';
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                    >
                      {/* Folio & Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1.5 rounded-lg ${
                              isExit
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            }`}
                          >
                            {isExit ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            )}
                          </span>
                          <div>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {order.orderNumber}
                            </span>
                            <span className="block text-[10px] text-slate-500 capitalize">
                              {isExit ? 'Despacho a Terreno' : 'Ingreso Almacén'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{order.date}</span>
                        </div>
                      </td>

                      {/* Técnico receptor */}
                      <td className="py-3.5 px-4">
                        {isExit ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
                              <Wrench className="w-3 h-3" />
                            </div>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {order.technicianName || 'Técnico Externo'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500">
                            Proveedor: {order.supplier || 'Bodega'}
                          </span>
                        )}
                      </td>

                      {/* Cliente receptor */}
                      <td className="py-3.5 px-4">
                        {isExit ? (
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-indigo-500" />
                              {order.customerName || 'Stock Móvil / Red Troncal'}
                            </p>
                            {order.customerAddress && (
                              <p className="text-[11px] text-slate-500 truncate max-w-xs">
                                {order.customerAddress}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">
                            Factura: {order.invoiceNumber || 'Sin número'}
                          </span>
                        )}
                      </td>

                      {/* Materials List */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {order.items.map((itm, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[11px]">
                              <span className="font-bold text-slate-900 dark:text-white px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 rounded-md">
                                {itm.quantity} {itm.unit}
                              </span>
                              <span className="text-slate-700 dark:text-slate-300 truncate max-w-xs">
                                {itm.equipmentName}
                              </span>
                              {itm.serialNumbers && itm.serialNumbers.length > 0 && (
                                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                                  [{itm.serialNumbers.join(', ')}]
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            order.status === 'completada'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : order.status === 'en_progreso'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                          }`}
                        >
                          {order.status.toUpperCase()}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => PdfService.generateDispatchReceipt(order)}
                            title="Descargar Acta de Entrega con Firmas en PDF"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </button>

                          <button
                            onClick={() => setOrderToEdit(order)}
                            title="Editar detalles de esta orden"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setOrderToDelete(order)}
                            title="Eliminar orden y revertir stock"
                            className="p-1.5 text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Dispatch / Entry */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-6 h-6 text-blue-600" />
              {movementType === 'salida'
                ? 'Registrar Salida / Despacho a Técnico para Cliente'
                : 'Registrar Entrada de Materiales a Bodega'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Descuenta o suma automáticamente las cantidades del inventario y prepara el acta en PDF.
            </p>

            {/* Movement Type Toggle */}
            <div className="mt-4 flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 max-w-sm">
              <button
                type="button"
                onClick={() => setMovementType('salida')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition ${
                  movementType === 'salida'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Salida a Técnico
              </button>
              <button
                type="button"
                onClick={() => setMovementType('entrada')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition ${
                  movementType === 'entrada'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                Entrada / Proveedor
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-2 text-xs font-semibold text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveOrder} className="mt-4 space-y-4">
              {movementType === 'salida' ? (
                <>
                  {/* Select Technician & Customer */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1">
                        <Wrench className="w-3.5 h-3.5 text-blue-500" />
                        Técnico Receptor *
                      </label>
                      <select
                        value={selectedTechId}
                        onChange={(e) => setSelectedTechId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                      >
                        <option value="">-- Seleccionar de la lista de Técnicos --</option>
                        {technicians.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.fullName} ({t.crewName})
                          </option>
                        ))}
                      </select>

                      {!selectedTechId && (
                        <div className="mt-2">
                          <input
                            type="text"
                            placeholder="O escribir nombre del técnico libre..."
                            value={customTechName}
                            onChange={(e) => setCustomTechName(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-indigo-500" />
                        Cliente Destino *
                      </label>
                      <select
                        value={selectedCustId}
                        onChange={(e) => setSelectedCustId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                      >
                        <option value="">-- Seleccionar Cliente --</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.fullName} - {c.address} ({c.plan})
                          </option>
                        ))}
                      </select>

                      {!selectedCustId && (
                        <div className="mt-2 space-y-1.5">
                          <input
                            type="text"
                            placeholder="Nombre del cliente o abonado..."
                            value={customCustName}
                            onChange={(e) => setCustomCustName(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                          />
                          <input
                            type="text"
                            placeholder="Dirección del domicilio / local..."
                            value={customAddress}
                            onChange={(e) => setCustomAddress(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Tipo de Trabajo / Destino
                      </label>
                      <select
                        value={workType}
                        onChange={(e) => setWorkType(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                      >
                        <option value="instalacion_nueva">Instalación Nueva (Alta FTTH)</option>
                        <option value="mantenimiento">Mantenimiento / Reparación de Avería</option>
                        <option value="migracion">Migración de Tecnología a Fibra</option>
                        <option value="garantia_cambio">Cambio por Garantía de Equipo</option>
                        <option value="retiro">Retiro / Desinstalación</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Entregado por (Responsable de Bodega)
                      </label>
                      <input
                        type="text"
                        value={registeredBy}
                        onChange={(e) => setRegisteredBy(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* Entry fields */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Proveedor / Distribuidor Mayorista
                    </label>
                    <input
                      type="text"
                      placeholder="ej: OpticTech Mayorista, Huawei Direct, etc."
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      N° Factura / Remisión de Entrega
                    </label>
                    <input
                      type="text"
                      placeholder="ej: FAC-88910"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Dynamic Materials Selection */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Equipos y Materiales a Incluir en el Despacho
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    + Agregar otro material
                  </button>
                </div>

                <div className="space-y-2.5">
                  {itemsToDispatch.map((row, index) => {
                    const currentItem = equipment.find((e) => e.id === row.equipmentId);
                    return (
                      <div
                        key={index}
                        className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <div className="flex-1">
                            <select
                              value={row.equipmentId}
                              onChange={(e) => handleItemChange(index, 'equipmentId', e.target.value)}
                              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                            >
                              {equipment.map((eq) => (
                                <option key={eq.id} value={eq.id}>
                                  {eq.code} - {eq.name} (Stock: {eq.stock} {eq.unit})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="w-28 flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              max={movementType === 'salida' ? currentItem?.stock || 999 : 9999}
                              value={row.quantity}
                              onChange={(e) =>
                                handleItemChange(index, 'quantity', Number(e.target.value))
                              }
                              className="w-full px-2 py-2 text-xs text-center font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                            />
                            <span className="text-[10px] text-slate-500 whitespace-nowrap">
                              {currentItem?.unit}
                            </span>
                          </div>

                          {itemsToDispatch.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(index)}
                              className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Serial selection for ONUs / active gear */}
                        {currentItem?.requiresSerial && (
                          <div className="pt-1">
                            <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                              Seriales disponibles para asignar:
                            </label>
                            {currentItem.serialsAvailable && currentItem.serialsAvailable.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {currentItem.serialsAvailable.map((sn) => {
                                  const isSelected = row.selectedSerials.includes(sn);
                                  return (
                                    <button
                                      key={sn}
                                      type="button"
                                      onClick={() => {
                                        if (isSelected) {
                                          handleItemChange(
                                            index,
                                            'selectedSerials',
                                            row.selectedSerials.filter((s) => s !== sn)
                                          );
                                        } else {
                                          handleItemChange(index, 'selectedSerials', [
                                            ...row.selectedSerials,
                                            sn,
                                          ]);
                                        }
                                      }}
                                      className={`px-2 py-1 text-[10px] font-mono rounded-lg border transition ${
                                        isSelected
                                          ? 'bg-blue-600 text-white border-blue-600 font-bold'
                                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                      }`}
                                    >
                                      {sn}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <input
                                type="text"
                                placeholder="Escanear o escribir número de serie/MAC..."
                                value={row.selectedSerials[0] || ''}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    'selectedSerials',
                                    e.target.value ? [e.target.value] : []
                                  )
                                }
                                className="w-full px-2.5 py-1 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notas de Terreno / Observaciones
                </label>
                <textarea
                  rows={2}
                  placeholder="ej: Señal óptica -18.9 dBm en CTO #4 puerto 7, 75 metros de drop utilizados..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
                >
                  {movementType === 'salida' ? 'Confirmar Despacho a Técnico' : 'Confirmar Ingreso a Bodega'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Existing Order */}
      {orderToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setOrderToEdit(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-blue-600" />
              Editar Despacho N° {orderToEdit.orderNumber}
            </h3>

            <form onSubmit={handleUpdateEditOrder} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Técnico Asignado
                </label>
                <input
                  type="text"
                  value={orderToEdit.technicianName || ''}
                  onChange={(e) =>
                    setOrderToEdit({ ...orderToEdit, technicianName: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cliente / Destino
                </label>
                <input
                  type="text"
                  value={orderToEdit.customerName || ''}
                  onChange={(e) =>
                    setOrderToEdit({ ...orderToEdit, customerName: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Estado de la Orden
                </label>
                <select
                  value={orderToEdit.status}
                  onChange={(e) =>
                    setOrderToEdit({ ...orderToEdit, status: e.target.value as any })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                >
                  <option value="completada">Completada (Entregada / Instalada)</option>
                  <option value="en_progreso">En Progreso / En Terreno</option>
                  <option value="anulada">Anulada</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notas de Observación
                </label>
                <textarea
                  rows={3}
                  value={orderToEdit.notes || ''}
                  onChange={(e) => setOrderToEdit({ ...orderToEdit, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOrderToEdit(null)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Order */}
      <ConfirmModal
        isOpen={!!orderToDelete}
        title="¿Eliminar esta orden de despacho?"
        message={`Esta acción eliminará el registro ${orderToDelete?.orderNumber}. Los materiales entregados (${orderToDelete?.items.map((i) => `${i.quantity}x ${i.equipmentName}`).join(', ')}) serán devueltos automáticamente al stock disponible en bodega.`}
        confirmText="Eliminar y Devolver Stock"
        onConfirm={handleConfirmDelete}
        onCancel={() => setOrderToDelete(null)}
      />
    </div>
  );
};
