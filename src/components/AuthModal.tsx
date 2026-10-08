import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Shield,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  Users,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  UserX,
  UserCheck,
  Power,
} from 'lucide-react';
import { AuthService } from '../services/auth';
import { AuthUser, UserRole, ROLE_LABELS } from '../types/auth';
import { googleSignIn } from '../services/googleAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onUserChanged: (user: AuthUser | null) => void;
  companyName: string;
  initialMode?: 'login' | 'register' | 'users';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
  companyName,
  initialMode = 'login',
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'login' | 'register' | 'users'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<AuthUser | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('bodega');

  const [registeredUsers, setRegisteredUsers] = useState<AuthUser[]>(() =>
    AuthService.getUsers()
  );

  const isAdmin = currentUser?.role === 'admin';

  const reloadUsers = () => {
    setRegisteredUsers(AuthService.getUsers());
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = AuthService.login(email, password);
    if (!res.success) {
      setErrorMsg(res.error || 'Error al iniciar sesión.');
      return;
    }

    onUserChanged(res.user || null);
    setSuccessMsg(`¡Bienvenido, ${res.user?.name}!`);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsGoogleLoading(true);

    try {
      const result = await googleSignIn();
      if (!result || !result.user) {
        setIsGoogleLoading(false);
        return;
      }

      const res = AuthService.loginWithGoogle({
        email: result.user.email || 'soporte@tuvision.com',
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      });

      onUserChanged(res.user);
      setSuccessMsg(`¡Autenticado con Google! Cuenta conectada como ${result.user.email}.`);
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al conectar con la cuenta de Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = AuthService.register(fullName, email, password, role, currentUser);
    if (!res.success) {
      setErrorMsg(res.error || 'Error al registrar usuario.');
      return;
    }

    reloadUsers();
    setFullName('');
    setEmail('');
    setPassword('');

    // If an admin created this user, keep admin logged in and show the users list
    if (currentUser) {
      setSuccessMsg(`¡Usuario "${res.user?.name}" creado con éxito en el sistema!`);
      setTimeout(() => {
        setMode('users');
      }, 1000);
    } else {
      // From outside, log in as new user
      onUserChanged(res.user || null);
      setSuccessMsg(`¡Usuario "${res.user?.name}" creado e iniciado sesión!`);
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  const handleQuickSwitchUser = (user: AuthUser) => {
    if (user.status === 'inactivo') {
      setErrorMsg('No puedes iniciar sesión con un usuario marcado como NO DISPONIBLE.');
      return;
    }
    AuthService.setCurrentUser(user);
    onUserChanged(user);
    setSuccessMsg(`Sesión cambiada a ${user.name}.`);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const executeDeleteUser = (target: AuthUser) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // Use current admin or active admin credentials
    const actingUser = currentUser || {
      id: 'usr-admin-1',
      name: 'Administrador',
      email: 'tuvisiontvsoporteinternet@gmail.com',
      role: 'admin' as const,
      avatarColor: 'bg-purple-600',
      status: 'activo' as const,
      createdAt: '2026-09-01',
    };

    const res = AuthService.deleteUser(target.id, actingUser);
    if (!res.success) {
      setErrorMsg(res.error || 'No se pudo eliminar el usuario.');
    } else {
      reloadUsers();
      setSuccessMsg(`El usuario "${target.name}" fue eliminado permanentemente del sistema.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
    setUserToDelete(null);
  };

  const handleToggleStatus = (target: AuthUser) => {
    setErrorMsg(null);
    const actingUser = currentUser || {
      id: 'usr-admin-1',
      name: 'Administrador',
      email: 'tuvisiontvsoporteinternet@gmail.com',
      role: 'admin' as const,
      avatarColor: 'bg-purple-600',
      status: 'activo' as const,
      createdAt: '2026-09-01',
    };

    const res = AuthService.toggleUserStatus(target.id, actingUser);
    if (!res.success) {
      setErrorMsg(res.error || 'Error al cambiar estado.');
    } else {
      reloadUsers();
      const statusText = res.newStatus === 'activo' ? 'DISPONIBLE / ACTIVO' : 'NO DISPONIBLE / INACTIVO';
      setSuccessMsg(`El usuario "${target.name}" fue marcado como ${statusText}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="flex items-center -space-x-1 shrink-0">
              <span className="w-1.5 h-6 bg-rose-500 rounded-full transform -skew-x-12"></span>
              <span className="w-1.5 h-6 bg-fuchsia-500 rounded-full transform -skew-x-12"></span>
              <span className="w-1.5 h-6 bg-purple-600 rounded-full transform -skew-x-12"></span>
              <span className="w-1.5 h-6 bg-indigo-500 rounded-full transform -skew-x-12"></span>
            </div>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {companyName || 'TuVisión'}
            </span>
            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              isp
            </span>
          </div>

          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">
            {mode === 'login' && 'Iniciar Sesión en el Sistema'}
            {mode === 'register' && 'Crear Nuevo Usuario Autorizado'}
            {mode === 'users' && 'Directorio & Gestión de Usuarios del ISP'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAdmin
              ? '👑 Modo Administrador: Puedes crear, desactivar y eliminar cuentas de personal.'
              : 'Control de accesos y perfiles de bodega y técnicos.'}
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mt-4">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Ingresar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Crear Usuario</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('users');
              setErrorMsg(null);
              setSuccessMsg(null);
              reloadUsers();
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              mode === 'users'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Gestionar ({registeredUsers.length})</span>
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="ej: usuario@tuvision.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl shadow-xs transition"
            >
              <LogIn className="w-4 h-4" />
              <span>Iniciar Sesión</span>
            </button>

            {/* Google Sign-in button */}
            <div className="pt-1 space-y-2">
              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-slate-200 dark:border-slate-700 w-full"></div>
                <span className="bg-white dark:bg-slate-900 px-2 text-[10px] text-slate-400 uppercase font-bold shrink-0">
                  o accede con tu cuenta
                </span>
                <div className="border-t border-slate-200 dark:border-slate-700 w-full"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full flex items-center justify-center gap-2.5 py-2 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-300 dark:border-slate-700 rounded-xl transition shadow-2xs disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{isGoogleLoading ? 'Conectando con Google...' : 'Iniciar Sesión con Google (Conecta Sheets)'}</span>
              </button>
            </div>
          </form>
        )}

        {/* 2. REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre Completo del Operador / Técnico *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="ej: Diana Marcela López"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-purple-500 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Correo Electrónico *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="ej: dlopez@tuvision.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-purple-500 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contraseña de Acceso *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Mínimo 4 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-purple-500 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Rol / Permisos en el Sistema
              </label>
              <div className="relative">
                <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-purple-500 dark:text-white"
                >
                  <option value="admin">Administrador General ISP (Puede eliminar usuarios)</option>
                  <option value="bodega">Jefe de Bodega / Almacenista</option>
                  <option value="supervisor">Supervisor de Operaciones</option>
                  <option value="tecnico">Técnico Receptor de Materiales</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl shadow-xs transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>{currentUser ? 'Crear Usuario' : 'Registrar & Acceder'}</span>
            </button>
          </form>
        )}

        {/* 3. REGISTERED USERS DIRECTORY (With Admin Delete & Deactivate Capabilities) */}
        {mode === 'users' && (
          <div className="mt-4 space-y-3">
            {/* Admin status banner */}
            {isAdmin ? (
              <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                  <span className="font-bold text-purple-900 dark:text-purple-200">
                    Modo Administrador Activo
                  </span>
                </div>
                <span className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold">
                  Puedes dar de baja o eliminar usuarios no disponibles
                </span>
              </div>
            ) : (
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-amber-900 dark:text-amber-200 text-[11px]">
                    Sesión actual: <strong>{currentUser?.name || 'Invitado'}</strong> ({currentUser?.role})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const adminUsr = registeredUsers.find((u) => u.role === 'admin') || registeredUsers[0];
                    if (adminUsr) handleQuickSwitchUser(adminUsr);
                  }}
                  className="px-2 py-1 text-[10px] font-bold text-amber-900 dark:text-amber-100 bg-amber-200 dark:bg-amber-800 hover:bg-amber-300 rounded-lg transition"
                >
                  Activar Modo Admin
                </button>
              </div>
            )}

            {/* In-Modal Delete Confirmation Box (NO window.confirm!) */}
            {userToDelete && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/70 border-2 border-rose-300 dark:border-rose-800 rounded-2xl animate-in fade-in space-y-2.5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-rose-100 dark:bg-rose-900/80 rounded-xl text-rose-600 dark:text-rose-300 shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-xs">
                    <h4 className="font-black text-rose-950 dark:text-rose-100 text-sm">
                      ¿Confirmar eliminación definitiva de "{userToDelete.name}"?
                    </h4>
                    <p className="text-rose-700 dark:text-rose-300 text-[11px] mt-0.5">
                      Esta cuenta ({userToDelete.email}) será borrada permanentemente del sistema de la empresa y no podrá volver a iniciar sesión.
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => executeDeleteUser(userToDelete)}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-98 rounded-xl shadow-xs transition flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Sí, Eliminar Definitivamente</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserToDelete(null)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-72 overflow-y-auto p-1">
              {registeredUsers.map((u) => {
                const isCurrent = currentUser?.id === u.id;
                const isUserActive = u.status !== 'inactivo';
                const roleConfig = ROLE_LABELS[u.role] || ROLE_LABELS.bodega;

                return (
                  <div
                    key={u.id}
                    className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                      isCurrent
                        ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800'
                        : isUserActive
                        ? 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                        : 'bg-slate-50/80 dark:bg-slate-900/80 border-dashed border-slate-300 dark:border-slate-800 opacity-75'
                    }`}
                  >
                    {/* User Info */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full ${
                          u.avatarColor || 'bg-purple-600'
                        } text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs`}
                      >
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-white truncate text-xs">
                            {u.name}
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded-md bg-purple-600 text-white text-[9px] font-extrabold">
                              TU SESIÓN
                            </span>
                          )}
                          <span
                            className={`px-1.5 py-0.2 rounded-md text-[9px] font-extrabold ${
                              isUserActive
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {isUserActive ? 'DISPONIBLE' : 'NO DISPONIBLE'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                        <span
                          className={`inline-block px-1.5 py-0.2 text-[9px] font-bold rounded-md mt-0.5 ${roleConfig.bg}`}
                        >
                          {roleConfig.label}
                        </span>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-1.5 shrink-0 justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      {/* Switch user button if not current */}
                      {!isCurrent && isUserActive && (
                        <button
                          type="button"
                          onClick={() => handleQuickSwitchUser(u)}
                          className="px-2.5 py-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950 hover:bg-purple-200 rounded-lg transition"
                          title="Iniciar sesión como este usuario"
                        >
                          Entrar
                        </button>
                      )}

                      {/* Admin Toggle Availability */}
                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                            isUserActive
                              ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                              : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                          title={
                            isUserActive
                              ? 'Marcar usuario como NO DISPONIBLE (Desactivar)'
                              : 'Reactivar usuario como DISPONIBLE'
                          }
                        >
                          {isUserActive ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      {/* Admin Delete User Button */}
                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserToDelete(u);
                            setErrorMsg(null);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-900/60 rounded-lg transition shadow-2xs"
                          title="Eliminar permanentemente a este usuario que ya no está disponible"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Crear otro usuario</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
