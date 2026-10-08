import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  Download,
  Filter,
  SlidersHorizontal,
  FileSpreadsheet,
  Cpu,
  X,
  PackagePlus,
  PackageMinus,
  Sparkles,
  ArrowRightLeft,
  List,
  ChevronLeft,
  ChevronRight,
  Hexagon,
} from 'lucide-react';
import { EquipmentCategory, EquipmentItem } from '../types/inventory';
import { CATEGORIES_CONFIG } from '../data/initialData';
import { PdfService } from '../services/pdfGenerator';
import { ConfirmModal } from './ConfirmModal';

interface InventoryViewProps {
  equipment: EquipmentItem[];
  onAddEquipment: (item: EquipmentItem) => void;
  onUpdateEquipment: (item: EquipmentItem) => void;
  onDeleteEquipment: (id: string) => void;
  onQuickAdjustStock: (id: string, newStock: number) => void;
  onOpenNewDispatch: () => void;
  onOpenNewEntry: () => void;
  searchFilterGlobal?: string;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  equipment,
  onAddEquipment,
  onUpdateEquipment,
  onDeleteEquipment,
  onQuickAdjustStock,
  onOpenNewDispatch,
  onOpenNewEntry,
  searchFilterGlobal = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<EquipmentItem | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<EquipmentItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [viewingSerialsItem, setViewingSerialsItem] = useState<EquipmentItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<EquipmentItem>>({
    code: '',
    name: '',
    category: 'nap',
    brand: '',
    model: '',
    stock: 0,
    minStock: 5,
    unit: 'unidades',
    location: 'Bodega Central',
    unitPrice: 0,
    description: '',
    requiresSerial: false,
    serialsAvailable: [],
  });
  const [serialsInput, setSerialsInput] = useState('');

  // Total valuation calculation (Valor del inventario)
  const totalValuation = equipment.reduce(
    (acc, item) => acc + item.stock * (item.unitPrice || 15),
    0
  );

  // Search query combining local and global
  const activeSearch = searchQuery || searchFilterGlobal;

  // Filtered equipment list
  const filteredEquipment = equipment.filter((item) => {
    const q = activeSearch.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      item.brand.toLowerCase().includes(q) ||
      item.model.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q);

    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredEquipment.length / itemsPerPage) || 1;
  const paginatedItems = filteredEquipment.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      code: `ISP-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      category: 'onu_ont',
      brand: 'Huawei',
      model: '',
      stock: 10,
      minStock: 5,
      unit: 'unidades',
      location: 'Bodega Central - Rack A',
      unitPrice: 28.0,
      description: '',
      requiresSerial: true,
      serialsAvailable: [],
    });
    setSerialsInput('');
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item: EquipmentItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setSerialsInput((item.serialsAvailable || []).join(', '));
    setIsFormModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      alert('Por favor completa el código y nombre del equipo.');
      return;
    }

    const serialsList = serialsInput
      ? serialsInput
          .split(/[\n,]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    if (editingItem) {
      onUpdateEquipment({
        ...editingItem,
        ...(formData as EquipmentItem),
        serialsAvailable: serialsList,
        updatedAt: now,
      });
    } else {
      const newItem: EquipmentItem = {
        id: `eq-${Date.now()}`,
        code: formData.code || `EQ-${Date.now()}`,
        name: formData.name || '',
        category: (formData.category as EquipmentCategory) || 'otro',
        brand: formData.brand || 'Genérico',
        model: formData.model || 'N/A',
        stock: Number(formData.stock) || 0,
        minStock: Number(formData.minStock) || 0,
        unit: formData.unit || 'unidades',
        location: formData.location || 'Bodega Central',
        unitPrice: Number(formData.unitPrice) || 15,
        description: formData.description || '',
        requiresSerial: Boolean(formData.requiresSerial),
        serialsAvailable: serialsList,
        updatedAt: now,
      };
      onAddEquipment(newItem);
    }

    setIsFormModalOpen(false);
  };

  const handleConfirmAdjust = () => {
    if (!adjustingItem) return;
    const newStock = Math.max(0, adjustingItem.stock + adjustAmount);
    onQuickAdjustStock(adjustingItem.id, newStock);
    setAdjustingItem(null);
    setAdjustAmount(0);
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Row (Exact to Fina screenshot desktop-inventario.png) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Hexagon className="w-6 h-6 text-purple-600 dark:text-purple-400 stroke-[2.2]" />
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            INVENTARIO
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Purple Button: "Ingreso con IA" with "Nuevo" badge */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:scale-95 rounded-xl shadow-xs transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ingreso con IA</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-pink-500 text-white ml-0.5">
              Nuevo
            </span>
          </button>

          {/* White border button: "Descargar reporte" */}
          <button
            onClick={() => PdfService.generateInventoryReport(equipment)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Descargar reporte</span>
          </button>
        </div>
      </div>

      {/* 2. Action Buttons Row (Gradient Pink/Magenta & White Pills like in Fina) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {/* Pink gradient: Ingreso de inventario */}
        <button
          onClick={onOpenNewEntry}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:opacity-95 active:scale-95 rounded-xl shadow-xs shrink-0 transition"
        >
          <PackagePlus className="w-3.5 h-3.5" />
          <span>Ingreso de inventario</span>
        </button>

        {/* Pink gradient: Ingreso con excel / masivo */}
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:opacity-95 active:scale-95 rounded-xl shadow-xs shrink-0 transition"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Ingreso con excel</span>
        </button>

        {/* White pill: Salida a técnico */}
        <button
          onClick={onOpenNewDispatch}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl shadow-2xs shrink-0 transition"
        >
          <PackageMinus className="w-3.5 h-3.5 text-amber-500" />
          <span>Salida de inventario</span>
        </button>

        {/* White pill: Despacho / Fabricar combo */}
        <button
          onClick={onOpenNewDispatch}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl shadow-2xs shrink-0 transition"
        >
          <Boxes className="w-3.5 h-3.5 text-blue-500" />
          <span>Kit de instalación</span>
        </button>

        {/* White pill: Traslado de inventario */}
        <button
          onClick={onOpenNewEntry}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl shadow-2xs shrink-0 transition"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
          <span>Traslado de bodega</span>
        </button>
      </div>

      {/* 3. Search Bar, Filters & Valuation Badges (Exact to Fina screenshot) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:text-white"
            />
          </div>

          {/* Filtros button */}
          <div className="relative">
            <button
              onClick={() => setShowFiltersDropdown(!showFiltersDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl transition"
            >
              <Filter className="w-3.5 h-3.5 text-purple-600" />
              <span>Filtros</span>
              {selectedCategory !== 'all' && (
                <span className="w-2 h-2 rounded-full bg-purple-600"></span>
              )}
            </button>

            {/* Category Dropdown */}
            {showFiltersDropdown && (
              <div className="absolute left-0 mt-2 z-20 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 space-y-1">
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setShowFiltersDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-semibold rounded-lg ${
                    selectedCategory === 'all'
                      ? 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Todas las categorías ({equipment.length})
                </button>
                {Object.entries(CATEGORIES_CONFIG).map(([k, cfg]) => (
                  <button
                    key={k}
                    onClick={() => {
                      setSelectedCategory(k);
                      setShowFiltersDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-semibold rounded-lg ${
                      selectedCategory === k
                        ? 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {cfg.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side: Purple Valuation Badges (Exact to Fina screenshot) */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-full text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-100/60 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800/80">
            Valor del inventario : ${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>

          <div className="hidden sm:inline-block px-3 py-1.5 rounded-full text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-100/60 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800/80">
            Total ítems : {equipment.reduce((a, b) => a + b.stock, 0)} u.
          </div>
        </div>
      </div>

      {/* 4. Inventory Data Table (Exact table headers and layout from Fina screenshot) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold bg-white dark:bg-slate-900">
              <tr>
                <th className="py-3.5 px-5">Nombre</th>
                <th className="py-3.5 px-5">Categoría</th>
                <th className="py-3.5 px-5">Costo unitario</th>
                <th className="py-3.5 px-5">Cantidad</th>
                <th className="py-3.5 px-5">Valor en inventario</th>
                <th className="py-3.5 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No hay equipos registrados que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const isLow = item.stock <= item.minStock;
                  const catConfig = CATEGORIES_CONFIG[item.category] || CATEGORIES_CONFIG.otro;
                  const itemValuation = item.stock * (item.unitPrice || 15);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition group"
                    >
                      {/* Nombre */}
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-900 dark:text-white max-w-sm truncate">
                          {item.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                          <span>{item.code}</span>
                          <span>•</span>
                          <span>{item.brand} ({item.model})</span>
                        </div>
                      </td>

                      {/* Categoría */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className="text-slate-600 dark:text-slate-300">
                          {catConfig.name}
                        </span>
                      </td>

                      {/* Costo unitario */}
                      <td className="py-3.5 px-5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        ${(item.unitPrice || 15).toFixed(2)} / UND
                      </td>

                      {/* Cantidad */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold ${
                              isLow ? 'text-red-600 dark:text-red-400 font-extrabold' : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {item.stock} {item.unit.toUpperCase()}
                          </span>
                          {isLow && (
                            <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-md bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                              Mín: {item.minStock}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Valor en inventario */}
                      <td className="py-3.5 px-5 whitespace-nowrap font-medium text-slate-700 dark:text-slate-200">
                        ${itemValuation.toFixed(2)}
                      </td>

                      {/* Acciones (Icons like in Fina screenshot: Box with plus, list menu) */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {/* Box with plus: Quick Stock Adjustment */}
                          <button
                            onClick={() => {
                              setAdjustingItem(item);
                              setAdjustAmount(0);
                            }}
                            title="Ajustar stock"
                            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-lg transition"
                          >
                            <PackagePlus className="w-4 h-4" />
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Editar detalles"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Serials if ONT */}
                          {item.requiresSerial && (
                            <button
                              onClick={() => setViewingSerialsItem(item)}
                              title="Ver seriales"
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg transition"
                            >
                              <Cpu className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete button */}
                          <button
                            onClick={() => setItemToDelete(item)}
                            title="Eliminar registro"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition"
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

        {/* 5. Pagination Footer (Exact to Fina screenshot) */}
        <div className="px-5 py-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900">
          <div>
            {filteredEquipment.length > 0 ? (
              <span>
                {(currentPage - 1) * itemsPerPage + 1} -{' '}
                {Math.min(currentPage * itemsPerPage, filteredEquipment.length)} of{' '}
                {filteredEquipment.length} items
              </span>
            ) : (
              <span>0 items</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Create or Edit Equipment */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsFormModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Boxes className="w-5 h-5 text-purple-600" />
              {editingItem ? 'Editar Registro de Equipo' : 'Nuevo Registro de Equipo / Material'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Ingresa los datos técnicos, categoría (NAP, Manga, ONT, Conectores) y stock disponible.
            </p>

            <form onSubmit={handleSaveForm} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Código Interno / SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 dark:text-white uppercase font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Categoría de Equipo *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as EquipmentCategory,
                        requiresSerial: e.target.value === 'onu_ont',
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 dark:text-white"
                  >
                    {Object.entries(CATEGORIES_CONFIG).map(([k, cfg]) => (
                      <option key={k} value={k}>
                        {cfg.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre descriptivo del Equipo / Material *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: Caja NAP 16 Puertos con Splitter, ONT Huawei EG8145V5, Conector SC-APC..."
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Marca
                  </label>
                  <input
                    type="text"
                    placeholder="Huawei, FiberHome, ZTE, OpticLink, etc."
                    value={formData.brand || ''}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Modelo / Especificación
                  </label>
                  <input
                    type="text"
                    placeholder="ej: HG8310M, FOSC-400A4, ESC250D..."
                    value={formData.model || ''}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Stock Actual *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock ?? 0}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Stock Mínimo Alerta *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.minStock ?? 5}
                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unidad de Medida
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value as EquipmentItem['unit'] })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 dark:text-white"
                  >
                    <option value="unidades">Unidades</option>
                    <option value="metros">Metros</option>
                    <option value="bobinas">Bobinas</option>
                    <option value="piezas">Piezas</option>
                    <option value="cajas">Cajas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ubicación en Bodega
                  </label>
                  <input
                    type="text"
                    placeholder="Estante A-1, Gaveta 3, Pallet 4..."
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Costo Unitario ($ USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unitPrice ?? 15}
                    onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 dark:text-white"
                  />
                </div>
              </div>

              {/* Serials toggle and input */}
              <div className="p-3 bg-purple-50/60 dark:bg-purple-950/20 rounded-xl border border-purple-200/70 dark:border-purple-900/40 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requiresSerial || false}
                    onChange={(e) => setFormData({ ...formData, requiresSerial: e.target.checked })}
                    className="rounded-sm text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Requiere control de Números de Serie / MAC individual (ONUs/ONTs y equipos activos)
                  </span>
                </label>

                {formData.requiresSerial && (
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      Lista de Seriales disponibles (separados por coma o salto de línea):
                    </label>
                    <textarea
                      rows={2}
                      placeholder="SN4857544391, SN4857544392, SN4857544393..."
                      value={serialsInput}
                      onChange={(e) => setSerialsInput(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition"
                >
                  {editingItem ? 'Guardar Cambios' : 'Registrar Equipo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Stock Adjust */}
      {adjustingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-sm p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Ajuste Rápido de Stock
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
              {adjustingItem.name} ({adjustingItem.code})
            </p>

            <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-center">
              <span className="text-xs text-purple-700 dark:text-purple-300">Stock Actual en Bodega:</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {adjustingItem.stock} {adjustingItem.unit}
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Cantidad a Sumar (+) o Restar (-):
              </label>
              <input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(Number(e.target.value))}
                placeholder="ej: +10 o -2"
                className="w-full px-3 py-2 text-base font-bold text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
              />

              <p className="text-center text-xs font-semibold text-purple-600 dark:text-purple-400">
                Nuevo Stock Resultante: {Math.max(0, adjustingItem.stock + adjustAmount)}{' '}
                {adjustingItem.unit}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAdjustingItem(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAdjust}
                className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl"
              >
                Aplicar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View Serials */}
      {viewingSerialsItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewingSerialsItem(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-purple-600" />
              Seriales / MAC en Stock
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
              {viewingSerialsItem.name}
            </p>

            <div className="mt-4 max-h-60 overflow-y-auto space-y-1.5 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              {viewingSerialsItem.serialsAvailable && viewingSerialsItem.serialsAvailable.length > 0 ? (
                viewingSerialsItem.serialsAvailable.map((sn, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700 text-xs font-mono"
                  >
                    <span className="text-slate-800 dark:text-slate-200">{sn}</span>
                    <span className="text-[10px] text-emerald-600 font-bold">Disponible</span>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-slate-400 py-4">
                  No hay seriales registrados disponibles.
                </p>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setViewingSerialsItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Item */}
      <ConfirmModal
        isOpen={!!itemToDelete}
        title="¿Eliminar este equipo del catálogo?"
        message={`Esta acción eliminará "${itemToDelete?.name}" (${itemToDelete?.code}). Si hay órdenes previas que usaron este material, su historial se mantendrá pero ya no estará en el stock.`}
        confirmText="Eliminar Equipo"
        onConfirm={() => {
          if (itemToDelete) {
            onDeleteEquipment(itemToDelete.id);
            setItemToDelete(null);
          }
        }}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};
