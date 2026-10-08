import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  Shield,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Moon,
  Sun,
  ShieldCheck,
  Building2,
  Sparkles,
} from 'lucide-react';
import { AuthService } from '../services/auth';
import { AuthUser, UserRole, ROLE_LABELS } from '../types/auth';
import { CompanyInfo } from '../services/storage';
import { googleSignIn } from '../services/googleAuth';

interface LoginScreenProps {
  companyInfo: CompanyInfo;
  onLoginSuccess: (user: AuthUser) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  companyInfo,
  onLoginSuccess,
  isDark,
  toggleTheme,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('bodega');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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
        email: result.user.email || 'usuario@tuvision.com',
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      });

      setSuccessMsg(`¡Autenticado con Google! Conectado como ${result.user.email} con Google Sheets activo.`);
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 700);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.message || 'Error al conectar con la cuenta de Google. Verifica los permisos de la ventana emergente.'
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = AuthService.login(email, password);
      setIsLoading(false);

      if (!res.success) {
        setErrorMsg(res.error || 'Credenciales inválidas.');
        return;
      }

      setSuccessMsg(`¡Bienvenido al sistema, ${res.user?.name}!`);
      setTimeout(() => {
        if (res.user) onLoginSuccess(res.user);
      }, 500);
    }, 250);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = AuthService.register(fullName, email, password, role);
      setIsLoading(false);

      if (!res.success) {
        setErrorMsg(res.error || 'Error al crear usuario.');
        return;
      }

      setSuccessMsg(`¡Usuario "${res.user?.name}" registrado con éxito!`);
      setTimeout(() => {
        if (res.user) onLoginSuccess(res.user);
      }, 600);
    }, 300);
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-6 transition-colors font-sans selection:bg-purple-500 selection:text-white">
      {/* Top Bar with Theme Toggle */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        {/* Brand */}
        <div className="flex items-center gap-2.5 select-none">
          <div className="flex items-center -space-x-1 shrink-0">
            <span className="w-2 h-7 bg-rose-500 rounded-full transform -skew-x-12"></span>
            <span className="w-2 h-7 bg-fuchsia-500 rounded-full transform -skew-x-12"></span>
            <span className="w-2 h-7 bg-purple-600 rounded-full transform -skew-x-12"></span>
            <span className="w-2 h-7 bg-indigo-500 rounded-full transform -skew-x-12"></span>
          </div>
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
            {companyInfo.name || 'TuVisión'}
          </span>
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
            isp
          </span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-2xs transition"
          title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Modo Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Modo Oscuro</span>
            </>
          )}
        </button>
      </div>

      {/* Main Centered Login Box */}
      <div className="w-full max-w-md mx-auto my-auto py-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 space-y-6">
          {/* Header Title */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Lock className="w-6 h-6" />
            </div>

            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {mode === 'login' ? 'Acceso al Sistema ISP' : 'Crear Cuenta de Operador'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {mode === 'login'
                ? 'Ingresa tu usuario y contraseña para gestionar el inventario y despachos'
                : 'Registra un nuevo usuario autorizado con permisos para operar'}
            </p>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Iniciar Sesión</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Crear Usuario</span>
            </button>
          </div>

          {/* Error & Success Alerts */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start gap-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1">
                <p className="font-bold">Error de Autenticación</p>
                <p className="text-[11px] font-normal text-rose-600 dark:text-rose-300 mt-0.5">
                  {errorMsg}
                </p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Google Quick Sign-In (Auto-connects App Session & Google Sheets) */}
          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs rounded-2xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-slate-400 active:scale-98 shadow-xs transition disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              )}
              <span>
                {isGoogleLoading
                  ? 'Conectando con Google...'
                  : 'Continuar con Google (Conecta Sheets Automático)'}
              </span>
            </button>

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
              <span className="bg-white dark:bg-slate-900 px-3 text-[10px] text-slate-400 uppercase font-bold tracking-wider shrink-0">
                o ingresa con correo y contraseña
              </span>
              <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
            </div>
          </div>

          {/* LOGIN FORM */}
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="ej: tuvisiontvsoporteinternet@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-purple-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden transition dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Contraseña de Seguridad
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-purple-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden transition dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-98 rounded-xl shadow-md transition disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{isLoading ? 'Verificando...' : 'Iniciar Sesión en el Portal'}</span>
              </button>

              {/* Quick Fill Demo Credentials */}
              <div className="pt-2">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 text-[11px] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Cuentas de Acceso Rápido:
                    </span>
                    <span className="text-[10px] text-slate-400">Clic para rellenar</span>
                  </div>

                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickFill('tuvisiontvsoporteinternet@gmail.com', 'admin123')
                      }
                      className="w-full text-left p-1.5 px-2.5 rounded-xl border border-purple-200/80 dark:border-purple-900/60 bg-purple-50/80 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition flex items-center justify-between"
                    >
                      <div className="truncate">
                        <span className="font-bold text-purple-700 dark:text-purple-300 block truncate">
                          👑 Administrador: tuvisiontvsoporteinternet@gmail.com
                        </span>
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">
                          Clave: admin123 (Puede eliminar usuarios)
                        </span>
                      </div>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-600 text-white ml-2">
                        Admin
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickFill('bodega@tuvision.com', 'bodega123')}
                      className="w-full text-left p-1.5 px-2.5 rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-blue-700 dark:text-blue-300 block">
                          📦 Jefe de Bodega: bodega@tuvision.com
                        </span>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                          Clave: bodega123
                        </span>
                      </div>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-blue-600 text-white ml-2">
                        Bodega
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nombre Completo del Operador *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="ej: Diana Marcela López"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-purple-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden transition dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="ej: dlopez@tuvision.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-purple-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden transition dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Contraseña de Acceso *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Mínimo 4 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-purple-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden transition dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Rol y Permisos
                </label>
                <div className="relative">
                  <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-purple-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden transition dark:text-white"
                  >
                    <option value="admin">Administrador General ISP (Puede eliminar usuarios)</option>
                    <option value="bodega">Jefe de Bodega / Almacén</option>
                    <option value="supervisor">Supervisor de Operaciones</option>
                    <option value="tecnico">Técnico Receptor de Materiales</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-98 rounded-xl shadow-md transition disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isLoading ? 'Registrando...' : 'Registrar Cuenta & Entrar'}</span>
              </button>
            </form>
          )}

          {/* Security note */}
          <div className="pt-2 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5 border-t border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Sistema protegido • Solo usuarios autorizados de {companyInfo.name || 'la empresa'}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-3">
        © {new Date().getFullYear()} {companyInfo.name || 'NetStock ISP'} • Plataforma de Control FTTH
      </footer>
    </div>
  );
};
