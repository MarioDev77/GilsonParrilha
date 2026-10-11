export type AdminRoleName = 'OWNER' | 'ADMIN' | 'STAFF';

export interface AuthenticatedAdmin {
  id: string;
  name: string;
  email: string;
  role: AdminRoleName;
}
