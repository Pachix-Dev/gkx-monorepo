import { Role } from '../roles.enum';

export interface AuthenticatedUser {
  userId: string;
  tenantId: string;
  role: Role;
}
