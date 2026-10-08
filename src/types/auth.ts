export type UserRole = 'admin' | 'bodega' | 'tecnico' | 'supervisor';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatarColor?: string;
  status?: 'activo' | 'inactivo';
  createdAt: string;
  lastLogin?: string;
}

export const ROLE_LABELS: Record<UserRole, { label: string; color: string; bg: string }> = {
  admin: {
    label: 'Administrador ISP',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300',
  },
  bodega: {
    label: 'Jefe de Bodega',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300',
  },
  supervisor: {
    label: 'Supervisor de Operaciones',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
  },
  tecnico: {
    label: 'Técnico de Campo',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300',
  },
};
