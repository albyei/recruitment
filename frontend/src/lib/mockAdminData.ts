export type UserRole = 'hr' | 'hiring-manager' | 'admin';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin: string;
}

export const mockUserAccounts: UserAccount[] = [
  {
    id: 'user-1',
    name: 'Siti Nurhaliza',
    email: 'siti.nurhaliza@perusahaan.co.id',
    role: 'hr',
    department: 'Human Resources',
    status: 'active',
    createdAt: '2024-06-15',
    lastLogin: '2025-01-15',
  },
  {
    id: 'user-2',
    name: 'Budi Santoso',
    email: 'budi.santoso@perusahaan.co.id',
    role: 'hiring-manager',
    department: 'Engineering',
    status: 'active',
    createdAt: '2024-08-20',
    lastLogin: '2025-01-14',
  },
  {
    id: 'user-3',
    name: 'Dewi Lestari',
    email: 'dewi.lestari@perusahaan.co.id',
    role: 'hiring-manager',
    department: 'Marketing',
    status: 'active',
    createdAt: '2024-09-10',
    lastLogin: '2025-01-13',
  },
  {
    id: 'user-4',
    name: 'Ahmad Wijaya',
    email: 'ahmad.wijaya@perusahaan.co.id',
    role: 'hiring-manager',
    department: 'Analytics',
    status: 'active',
    createdAt: '2024-10-05',
    lastLogin: '2025-01-12',
  },
  {
    id: 'user-5',
    name: 'Rizky Pratama',
    email: 'rizky.pratama@perusahaan.co.id',
    role: 'admin',
    department: 'IT',
    status: 'active',
    createdAt: '2024-01-01',
    lastLogin: '2025-01-15',
  },
  {
    id: 'user-6',
    name: 'Putri Maharani',
    email: 'putri.maharani@perusahaan.co.id',
    role: 'hiring-manager',
    department: 'Design',
    status: 'inactive',
    createdAt: '2024-07-22',
    lastLogin: '2024-12-01',
  },
];

export const departments = [
  'Human Resources',
  'Engineering',
  'Marketing',
  'Analytics',
  'Design',
  'Finance',
  'Operations',
  'IT',
];
