import { AuthUser, UserRole } from '../types/auth';

const KEYS = {
  USERS: 'netstock_users_v2',
  SESSION: 'netstock_session_v2',
};

const DEFAULT_USERS: AuthUser[] = [
  {
    id: 'usr-admin-1',
    name: 'TuVisión Administrador',
    email: 'tuvisiontvsoporteinternet@gmail.com',
    password: 'admin123',
    role: 'admin',
    avatarColor: 'bg-purple-600',
    status: 'activo',
    createdAt: '2026-09-01',
  },
  {
    id: 'usr-bodega-2',
    name: 'Carlos Almacén',
    email: 'bodega@tuvision.com',
    password: 'bodega123',
    role: 'bodega',
    avatarColor: 'bg-blue-600',
    status: 'activo',
    createdAt: '2026-09-10',
  },
  {
    id: 'usr-tecnico-3',
    name: 'Marcos Solís (Cuadrilla 2)',
    email: 'tecnico@tuvision.com',
    password: 'tecnico123',
    role: 'tecnico',
    avatarColor: 'bg-amber-600',
    status: 'activo',
    createdAt: '2026-09-15',
  },
];

export const AuthService = {
  getUsers(): AuthUser[] {
    try {
      const data = localStorage.getItem(KEYS.USERS);
      if (!data) {
        localStorage.setItem(KEYS.USERS, JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_USERS;
    }
  },

  saveUsers(users: AuthUser[]): void {
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  },

  getCurrentUser(): AuthUser | null {
    try {
      const session = localStorage.getItem(KEYS.SESSION);
      if (session) {
        return JSON.parse(session);
      }
      // Strictly null: Do not pre-login so the user MUST enter email and password first!
      return null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: AuthUser | null): void {
    if (user) {
      // Don't keep raw password in active session object
      const safeUser = { ...user };
      delete safeUser.password;
      localStorage.setItem(KEYS.SESSION, JSON.stringify(safeUser));
    } else {
      localStorage.removeItem(KEYS.SESSION);
    }
  },

  login(email: string, password: string): { success: boolean; user?: AuthUser; error?: string } {
    const users = this.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    const found = users.find((u) => u.email.trim().toLowerCase() === cleanEmail);

    if (!found) {
      return { success: false, error: 'No existe una cuenta registrada con este correo electrónico.' };
    }

    if (found.status === 'inactivo') {
      return {
        success: false,
        error: 'Esta cuenta ha sido marcada como NO DISPONIBLE / INACTIVA por el Administrador. Contacta a gerencia.',
      };
    }

    if (found.password && found.password !== password) {
      return { success: false, error: 'Contraseña incorrecta. Por favor verifica tus credenciales.' };
    }

    // Update last login
    const updatedUsers = users.map((u) =>
      u.id === found.id
        ? { ...u, lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16) }
        : u
    );
    this.saveUsers(updatedUsers);

    this.setCurrentUser(found);
    return { success: true, user: found };
  },

  /**
   * Log in or register seamlessly with authenticated Google Account
   * This immediately connects both the user session and Google Sheets!
   */
  loginWithGoogle(googleData: {
    email: string;
    displayName?: string | null;
    photoURL?: string | null;
  }): { success: boolean; user: AuthUser; isNew?: boolean } {
    const users = this.getUsers();
    const cleanEmail = googleData.email.trim().toLowerCase();
    const found = users.find((u) => u.email.trim().toLowerCase() === cleanEmail);

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    if (found) {
      // Ensure user is active and update details
      const updatedUsers = users.map((u) =>
        u.id === found.id
          ? {
              ...u,
              status: 'activo' as const,
              name: googleData.displayName || u.name,
              lastLogin: nowStr,
              // If it's the official ISP admin email or already admin, preserve/grant admin
              role:
                cleanEmail === 'tuvisiontvsoporteinternet@gmail.com'
                  ? ('admin' as UserRole)
                  : u.role,
            }
          : u
      );
      this.saveUsers(updatedUsers);
      const updatedUser = updatedUsers.find((u) => u.id === found.id)!;
      this.setCurrentUser(updatedUser);
      return { success: true, user: updatedUser, isNew: false };
    }

    // New user signing in via Google account
    const isAdminEmail =
      cleanEmail === 'tuvisiontvsoporteinternet@gmail.com' ||
      cleanEmail.includes('soporte') ||
      cleanEmail.includes('admin') ||
      !users.some((u) => u.role === 'admin');

    const newUser: AuthUser = {
      id: `usr-g-${Date.now()}`,
      name: googleData.displayName || cleanEmail.split('@')[0],
      email: cleanEmail,
      role: isAdminEmail ? 'admin' : 'bodega',
      avatarColor: 'bg-purple-600',
      status: 'activo',
      createdAt: new Date().toISOString().substring(0, 10),
      lastLogin: nowStr,
    };

    users.push(newUser);
    this.saveUsers(users);
    this.setCurrentUser(newUser);
    return { success: true, user: newUser, isNew: true };
  },

  register(
    name: string,
    email: string,
    password: string,
    role: UserRole = 'bodega',
    requestingUser?: AuthUser | null
  ): { success: boolean; user?: AuthUser; error?: string } {
    const users = this.getUsers();
    const cleanEmail = email.trim().toLowerCase();

    if (users.some((u) => u.email.trim().toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Ya existe un usuario registrado con este correo electrónico.' };
    }

    if (!name.trim()) {
      return { success: false, error: 'El nombre completo es obligatorio.' };
    }

    if (password.length < 4) {
      return { success: false, error: 'La contraseña debe tener al menos 4 caracteres.' };
    }

    const colors = ['bg-purple-600', 'bg-blue-600', 'bg-indigo-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newUser: AuthUser = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      password: password,
      role,
      avatarColor: randomColor,
      status: 'activo',
      createdAt: new Date().toISOString().substring(0, 10),
    };

    users.push(newUser);
    this.saveUsers(users);

    // If an admin created this user from inside the app, keep admin logged in!
    // Only set as current user if registering from the outside login screen
    if (!requestingUser) {
      this.setCurrentUser(newUser);
    }

    return { success: true, user: newUser };
  },

  /**
   * Delete user: Only administrators can delete users who are no longer available.
   */
  deleteUser(
    userId: string,
    requestingUser?: AuthUser | null
  ): { success: boolean; error?: string } {
    const users = this.getUsers();
    const target = users.find((u) => u.id === userId);

    if (!target) {
      return { success: false, error: 'El usuario ya no existe o ya fue eliminado del sistema.' };
    }

    // Prevent self-deletion of active user
    if (requestingUser && requestingUser.id === userId) {
      return {
        success: false,
        error: 'No puedes eliminar la cuenta con la que tienes tu sesión iniciada actualmente. Cambia a otro usuario primero.',
      };
    }

    // Role verification: If requestingUser is present, must be admin
    if (requestingUser && requestingUser.role !== 'admin') {
      return {
        success: false,
        error: 'Permiso denegado: Solo los usuarios con rol de Administrador pueden eliminar cuentas del sistema.',
      };
    }

    // Ensure at least one admin remains in the system
    const remainingAdmins = users.filter((u) => u.role === 'admin' && u.id !== userId);
    if (target.role === 'admin' && remainingAdmins.length === 0) {
      return {
        success: false,
        error: 'No puedes eliminar este usuario porque es el único Administrador configurado en la plataforma.',
      };
    }

    const updated = users.filter((u) => u.id !== userId);
    this.saveUsers(updated);

    return { success: true };
  },

  /**
   * Toggle user active/inactive status (Marcar como no disponible)
   */
  toggleUserStatus(
    userId: string,
    requestingUser?: AuthUser | null
  ): { success: boolean; error?: string; newStatus?: 'activo' | 'inactivo' } {
    if (!requestingUser || requestingUser.role !== 'admin') {
      return {
        success: false,
        error: 'Solo los administradores pueden cambiar el estado de disponibilidad de un usuario.',
      };
    }

    if (requestingUser.id === userId) {
      return {
        success: false,
        error: 'No puedes desactivar tu propia cuenta activa.',
      };
    }

    const users = this.getUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) {
      return { success: false, error: 'Usuario no encontrado.' };
    }

    const newStatus: 'activo' | 'inactivo' = target.status === 'inactivo' ? 'activo' : 'inactivo';
    const updated = users.map((u) => (u.id === userId ? { ...u, status: newStatus } : u));
    this.saveUsers(updated);

    return { success: true, newStatus };
  },

  logout(): void {
    this.setCurrentUser(null);
  },
};
