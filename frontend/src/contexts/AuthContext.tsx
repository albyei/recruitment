import { createContext, useContext, useState, ReactNode } from 'react';

export type AppRole = 'hr' | 'hiring-manager' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roles: AppRole[];
  department: string;
  position: string;
  avatar?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (role: AppRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user database with multi-role support
const mockUsers: AuthUser[] = [
  {
    id: 'user-1',
    name: 'Siti Nurhaliza',
    email: 'siti@wowrack.com',
    roles: ['hr'],
    department: 'Human Resources',
    position: 'HR Manager',
    avatar: 'https://i.pravatar.cc/150?u=hr',
  },
  {
    id: 'user-2',
    name: 'Budi Wijaya',
    email: 'budi@wowrack.com',
    roles: ['hiring-manager'],
    department: 'Engineering',
    position: 'Engineering Manager',
    avatar: 'https://i.pravatar.cc/150?u=manager',
  },
  {
    id: 'user-3',
    name: 'Rizky Pratama',
    email: 'rizky@wowrack.com',
    roles: ['admin'],
    department: 'IT',
    position: 'System Admin',
    avatar: 'https://i.pravatar.cc/150?u=admin',
  },
  {
    id: 'user-4',
    name: 'Dewi Lestari',
    email: 'dewi@wowrack.com',
    roles: ['hr', 'admin'],
    department: 'Human Resources',
    position: 'HR Director',
    avatar: 'https://i.pravatar.cc/150?u=dewi',
  },
  {
    id: 'user-5',
    name: 'Ahmad Santoso',
    email: 'ahmad@wowrack.com',
    roles: ['hiring-manager', 'hr'],
    department: 'Marketing',
    position: 'Marketing Lead',
    avatar: 'https://i.pravatar.cc/150?u=ahmad',
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email: string, _password: string): Promise<boolean> => {
    await new Promise((r) => setTimeout(r, 800));
    const found = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setUser(found);
      localStorage.setItem('auth_user', JSON.stringify(found));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  const hasRole = (role: AppRole) => user?.roles.includes(role) ?? false;

  return (
    <AuthContext.Provider value={{ user, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
