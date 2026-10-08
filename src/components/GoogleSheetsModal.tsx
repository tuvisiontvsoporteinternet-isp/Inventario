import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Upload,
  Download,
  Plus,
  Link as LinkIcon,
  Unlink,
  LogOut,
  Boxes,
  Truck,
  Users,
  ShieldCheck,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import {
  googleSignIn,
  googleSignOut,
  getGoogleUser,
  initGoogleAuth,
  getAccessToken,
} from '../services/googleAuth';
import {
  GoogleSheetsService,
  SheetConfig,
} from '../services/googleSheets';
import { CompanyInfo } from '../services/storage';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyInfo: CompanyInfo;
  onDataSyncSuccess?: () => void;
}

type ConfirmActionType = 'export' | 'import' | null;

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  companyInfo,
  onDataSyncSuccess,
}) => {
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [tokenPresent, setTokenPresent] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [sheetConfig, setSheetConfig] = useState<SheetConfig | null>(null);

  // Form states
  const [inputSheetUrl, setInputSheetUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Mandatory confirmation dialog for mutating Workspace data
  const [confirmDialog, setConfirmDialog] = useState<{
    type: ConfirmActionType;
    title: string;
    description: string;
    confirmButtonText: string;
  } | null>(null);

  // Check auth state
  useEffect(() => {
    if (!isOpen) return;

    // Load saved sheet config
    const savedConfig = GoogleSheetsService.getConfig();
    setSheetConfig(savedConfig);
    if (savedConfig?.spreadsheetUrl) {
      setInputSheetUrl(savedConfig.spreadsheetUrl);
    }

    // Check Google Auth
    const unsub = initGoogleAuth(
      (user) => {
        setGoogleUser(user);
        setTokenPresent(true);
      },
      () => {
        const u = getGoogleUser();
        setGoogleUser(u);
        getAccessToken().then((t) => setTokenPresent(!!t));
      }
    );

    getAccessToken().then((t) => {
      setTokenPresent(!!t);
      setGoogleUser(getGoogleUser());
    });

    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSignInGoogle = async () => {
    setIsAuthenticating(true);
    setFeedback(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setTokenPresent(true);
        setFeedback({
          type: 'success',
          message: `Conectado exitosamente como ${result.user.displayName || result.user.email}`,
        });
      }
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: 'error',
        message: err.message || 'Error al autenticarse con la cuenta de Google',
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOutGoogle = async () => {
    try {
      await googleSignOut();
      setGoogleUser(null);
      setTokenPresent(false);
      setFeedback({
        type: 'info',
        message: 'Sesión de Google cerrada.',
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCreateNewSheet = async () => {
    if (!tokenPresent) {
      setFeedback({ type: 'error', message: 'Debes conectar tu cuenta de Google primero.' });
      return;
    }

    setIsProcessing(true);
    setFeedback({ type: 'info', message: 'Creando hoja de cálculo estructurada con pestañas para ISP...' });

    try {
      const res = await GoogleSheetsService.createIspSpreadsheet(companyInfo.name || 'TuVisión ISP');
      if (res.success && res.spreadsheetId) {
        const updatedConfig = GoogleSheetsService.getConfig();
        setSheetConfig(updatedConfig);
        setInputSheetUrl(res.spreadsheetUrl || '');
        setFeedback({
          type: 'success',
          message: `¡Hoja "${res.title}" creada y vinculada con éxito en Google Drive!`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'No se pudo crear la hoja de cálculo.',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error inesperado al crear hoja' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLinkExistingSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputSheetUrl.trim()) return;

    const spreadsheetId = GoogleSheetsService.extractSpreadsheetId(inputSheetUrl);
    if (!spreadsheetId) {
      setFeedback({ type: 'error', message: 'URL o ID de Google Sheets inválido.' });
      return;
    }

    setIsProcessing(true);
    setFeedback(null);

    try {
      const verification = await GoogleSheetsService.verifySpreadsheet(spreadsheetId);
      if (verification.valid) {
        const newConfig: SheetConfig = {
          spreadsheetId,
          spreadsheetName: verification.title || 'Hoja de cálculo ISP',
          spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
          lastSync: new Date().toISOString(),
        };
        GoogleSheetsService.saveConfig(newConfig);
        setSheetConfig(newConfig);
        setFeedback({
          type: 'success',
          message: `¡Hoja "${verification.title}" vinculada correctamente! Pestañas encontradas: ${verification.sheets?.join(', ')}`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: verification.error || 'No se pudo verificar el acceso a la hoja de cálculo.',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error al conectar hoja' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnlinkSheet = () => {
    GoogleSheetsService.clearConfig();
    setSheetConfig(null);
    setInputSheetUrl('');
    setFeedback({ type: 'info', message: 'Hoja de cálculo desvinculada de la aplicación.' });
  };

  // Request user confirmation before saving/exporting to Google Sheets
  const promptExportConfirmation = () => {
    if (!sheetConfig?.spreadsheetId) return;
    setConfirmDialog({
      type: 'export',
      title: '¿Guardar datos actuales en Google Sheets?',
      description:
        `Esta acción sincronizará el estado actual del inventario, órdenes de movimiento, técnicos y cierres de bodega hacia la hoja "${sheetConfig.spreadsheetName}". Los registros existentes en las pestañas serán actualizados con los datos de esta aplicación.`,
      confirmButtonText: 'Sí, Guardar en Google Sheets',
    });
  };

  // Request user confirmation before importing/recovering from Google Sheets
  const promptImportConfirmation = () => {
    if (!sheetConfig?.spreadsheetId) return;
    setConfirmDialog({
      type: 'import',
      title: '¿Recuperar e importar datos desde Google Sheets?',
      description:
        `Esta acción leerá todas las filas desde "${sheetConfig.spreadsheetName}" y actualizará el inventario local, órdenes y personal en el sistema. Asegúrate de que las columnas tengan los formatos correspondientes.`,
      confirmButtonText: 'Sí, Recuperar Datos',
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog || !sheetConfig?.spreadsheetId) return;

    const actionType = confirmDialog.type;
    setConfirmDialog(null);
    setIsProcessing(true);
    setFeedback(null);

    if (actionType === 'export') {
      try {
        const res = await GoogleSheetsService.exportAllData(sheetConfig.spreadsheetId);
        if (res.success) {
          const cfg = GoogleSheetsService.getConfig();
          setSheetConfig(cfg);
          setFeedback({
            type: 'success',
            message: `¡Datos guardados con éxito en Google Sheets! Se exportaron ${res.rowsCount} registros entre equipos, órdenes, técnicos y cierres.`,
          });
          if (onDataSyncSuccess) onDataSyncSuccess();
        } else {
          setFeedback({
            type: 'error',
            message: res.error || 'Error al guardar datos en Google Sheets',
          });
        }
      } catch (err: any) {
        setFeedback({ type: 'error', message: err.message || 'Error inesperado al guardar datos' });
      } finally {
        setIsProcessing(false);
      }
    } else if (actionType === 'import') {
      try {
        const res = await GoogleSheetsService.importAllData(sheetConfig.spreadsheetId);
        if (res.success) {
          const cfg = GoogleSheetsService.getConfig();
          setSheetConfig(cfg);
          setFeedback({
            type: 'success',
            message: `¡Datos recuperados con éxito! Se cargaron: ${res.counts.equipment} equipos, ${res.counts.orders} movimientos, ${res.counts.technicians} técnicos y ${res.counts.closings} cierres diarios.`,
          });
          if (onDataSyncSuccess) onDataSyncSuccess();
        } else {
          setFeedback({
            type: 'error',
            message: res.error || 'Error al importar datos desde Google Sheets',
          });
        }
      } catch (err: any) {
        setFeedback({ type: 'error', message: err.message || 'Error inesperado al importar datos' });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-linear-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Conexión con Google Sheets
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  Google Workspace
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Guarda y recupera en tiempo real el inventario de equipos, movimientos de técnicos y cierres diarios
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mx-6 mt-4 p-3.5 rounded-xl text-xs font-medium flex items-start gap-3 border ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : feedback.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                : 'bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : feedback.type === 'error' ? (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
            ) : (
              <RefreshCw className="w-5 h-5 shrink-0 text-blue-600 dark:text-blue-400 animate-spin" />
            )}
            <div className="flex-1 leading-relaxed">{feedback.message}</div>
          </div>
        )}

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* STEP 1: Google Account Connection */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  1. Cuenta de Google Autorizada
                </div>
                {tokenPresent && googleUser ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center border border-emerald-500/30 overflow-hidden">
                      {googleUser.photoURL ? (
                        <img src={googleUser.photoURL} alt={googleUser.displayName || 'Google'} className="w-full h-full object-cover" />
                      ) : (
                        <span>{(googleUser.displayName || googleUser.email || 'G')[0].toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {googleUser.displayName || 'Usuario de Google'}
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {googleUser.email}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Conecta tu cuenta para sincronizar con tu Google Drive y Google Sheets con el permiso de los usuarios.
                  </div>
                )}
              </div>

              <div>
                {tokenPresent ? (
                  <button
                    onClick={handleSignOutGoogle}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Cambiar cuenta
                  </button>
                ) : (
                  /* Official Google Sign-in Button compliant with Google Identity specification */
                  <button
                    onClick={handleSignInGoogle}
                    disabled={isAuthenticating}
                    className="flex items-center justify-center gap-3 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs rounded-xl shadow-xs border border-slate-300 dark:border-slate-700 hover:border-slate-400 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>{isAuthenticating ? 'Conectando...' : 'Iniciar Sesión con Google'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* STEP 2: Spreadsheet Selection / Creation */}
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              2. Hoja de Cálculo Vinculada
            </div>

            {sheetConfig ? (
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-500 text-white rounded-lg mt-0.5">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {sheetConfig.spreadsheetName}
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded-full">
                          Activa
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5 break-all">
                        ID: {sheetConfig.spreadsheetId}
                      </div>
                      {sheetConfig.lastSync && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Última sincronización: {new Date(sheetConfig.lastSync).toLocaleString('es-CO')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={sheetConfig.spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-medium transition-colors shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Abrir en Sheets
                    </a>
                    <button
                      onClick={handleUnlinkSheet}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Desvincular esta hoja"
                    >
                      <Unlink className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Operations Bar */}
                <div className="mt-5 pt-4 border-t border-emerald-500/20 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={promptExportConfirmation}
                    disabled={isProcessing || !tokenPresent}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    {isProcessing ? 'Guardando...' : 'Guardar en Google Sheets (Exportar)'}
                  </button>

                  <button
                    onClick={promptImportConfirmation}
                    disabled={isProcessing || !tokenPresent}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 text-emerald-600" />
                    {isProcessing ? 'Recuperando...' : 'Recuperar desde Sheets (Importar)'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option A: Create New ISP Sheet */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between hover:border-emerald-500/50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                      <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
                        <Plus className="w-4 h-4" />
                      </div>
                      Crear Nueva Hoja para ISP
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                      Crea automáticamente en tu Google Drive una hoja con todas las pestañas configuradas:
                      <strong> Inventario_Equipos</strong>, <strong>Movimientos_Ordenes</strong>, <strong>Despachos_Tecnicos</strong>, y <strong>Cierres_Diarios</strong>.
                    </p>
                  </div>
                  <button
                    onClick={handleCreateNewSheet}
                    disabled={isProcessing || !tokenPresent}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {isProcessing ? 'Creando...' : 'Crear Hoja Automatizada'}
                  </button>
                </div>

                {/* Option B: Link Existing Sheet */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between hover:border-blue-500/50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg">
                        <LinkIcon className="w-4 h-4" />
                      </div>
                      Vincular Hoja Existente
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                      Pega la URL de tu hoja de Google Sheets (ejemplo: <code>https://docs.google.com/spreadsheets/d/...</code>) o el ID del documento.
                    </p>
                  </div>

                  <form onSubmit={handleLinkExistingSheet} className="mt-3 space-y-2">
                    <input
                      type="text"
                      placeholder="URL o ID de la hoja..."
                      value={inputSheetUrl}
                      onChange={(e) => setInputSheetUrl(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      disabled={isProcessing || !tokenPresent || !inputSheetUrl.trim()}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-lg text-xs font-medium shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      {isProcessing ? 'Verificando...' : 'Vincular Hoja'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: Overview of Structure & Synchronized Tabs */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
              Estructura de Datos Sincronizados en Google Sheets
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <Boxes className="w-4 h-4" />
                  Inventario_Equipos
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  NAPs, ONUs, bobinas de fibra, stock, precios y números de serie.
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <Truck className="w-4 h-4" />
                  Movimientos_Ordenes
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Actas de salida y entrada, técnicos, clientes y fecha/hora.
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <Users className="w-4 h-4" />
                  Despachos_Tecnicos
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Personal de campo, cuadrillas, zonas y materiales en custodia.
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400">
                  <ShieldCheck className="w-4 h-4" />
                  Cierres_Diarios
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Historial de balances diarios de bodega, auditoría y notas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Conexión protegida mediante Google OAuth 2.0 y Google Sheets API v4
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

        {/* MANDATORY USER CONFIRMATION MODAL FOR DESTRUCTIVE/MUTATING OPERATIONS */}
        {confirmDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-amber-500/40 p-6 space-y-4 text-slate-800 dark:text-slate-100">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {confirmDialog.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    {confirmDialog.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700/60">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmAction}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  {confirmDialog.confirmButtonText}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
