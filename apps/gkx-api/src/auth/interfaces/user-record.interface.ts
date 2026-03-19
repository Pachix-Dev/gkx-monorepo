import { Role } from '../roles.enum';

export interface TenantRecord {
  id: string;
  name: string;
  slug: string;
  plan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
}

export interface UserRecord {
  id: string;
  tenantId: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: Role;
  status: 'ACTIVE' | 'INACTIVE';
  refreshTokenHash?: string;
  createdAt: Date;
}
