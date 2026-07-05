import { supabase } from '@/networking/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppRole = 'ADMIN' | 'STAFF';

export interface AuthUser {
  id: string;
  email: string;
  role: AppRole;
  user_metadata: {
    display_name: string;
  };
}

// ─── Login ────────────────────────────────────────────────────────────────────

// Mục đích: Đăng nhập bằng Supabase Auth và trả về session cùng thông tin user với role
export async function login(
  email: string,
  password: string,
): Promise<{ user: AuthUser }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Login failed: no user returned');

  const role = await getUserRole(data.user.id);

  return {
    user: {
      id: data.user.id,
      email: data.user.email ?? '',
      role,
      user_metadata: {
        display_name: data.user.user_metadata?.display_name as string,
      },
    },
  };
}

// ─── Get Role ─────────────────────────────────────────────────────────────────

// Mục đích: Lấy role từ bảng public.user_roles. Mặc định STAFF nếu không tìm thấy
export async function getUserRole(userId: string): Promise<AppRole> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('Could not fetch user role, defaulting to STAFF:', error.message);
    return 'STAFF';
  }

  const raw = (data?.role as string | undefined)?.toUpperCase();
  return raw === 'ADMIN' ? 'ADMIN' : 'STAFF';
}

