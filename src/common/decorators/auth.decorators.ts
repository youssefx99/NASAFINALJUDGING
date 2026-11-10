import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

// Route needs no login
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// Roles allowed on a route; routes without @Roles are admin-only
export const Roles = (...roles: Array<'admin' | 'judge'>) =>
  SetMetadata(ROLES_KEY, roles);
