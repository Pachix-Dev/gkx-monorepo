import { Role } from '../roles.enum';

export interface JwtPayload {
  sub: string;
  tenantId: string;
  role: Role;
  type: 'access' | 'refresh';
  sid?: string;
}
