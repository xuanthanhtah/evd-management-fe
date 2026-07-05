import { useMemo } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

export type EvdRole = 'ADMIN' | 'MANAGER' | 'STAFF';

export interface EvdPermissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canImport: boolean;
  isStaff: boolean;
  currentUserId: string | null;
  currentRole: EvdRole;
}

// Mục đích: Ánh xạ role người dùng sang tập quyền cụ thể cho module EVD
function resolveRole(rawRole: string | undefined): EvdRole {
  const r = (rawRole ?? '').toUpperCase();
  if (r === 'ADMIN') return 'ADMIN';
  if (r === 'MANAGER') return 'MANAGER';
  return 'STAFF';
}

export function useEvdPermissions(): EvdPermissions {
  const user = useAuthStore((state) => state.user);

  return useMemo<EvdPermissions>(() => {
    const role = resolveRole(user?.role);
    const isStaff = role === 'STAFF';
    const isAdmin = role === 'ADMIN';

    return {
      canCreate: isAdmin || isStaff,
      canEdit: isAdmin || isStaff,
      canDelete: isAdmin,
      canImport: isAdmin || isStaff,
      isStaff,
      currentUserId: user?.id ?? null,
      currentRole: role,
    };
  }, [user]);
}
