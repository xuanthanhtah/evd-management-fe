import { create } from 'zustand';
import { supabase } from '@/networking/supabase';
import { getUserRole } from '@/features/auth/services/auth.services';
import type { AppRole, AuthUser } from '@/features/auth/services/auth.services';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  // Mục đích: isInitializing ngăn ProtectedRoute redirect sớm khi đang restore session
  isInitializing: boolean;

  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
  initAuth: () => () => void; // returns unsubscribe fn
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isInitializing: false,
    }),

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false, isInitializing: false });
  },

  // Mục đích: Khởi tạo auth từ session hiện tại và lắng nghe thay đổi auth state
  // Trả về hàm unsubscribe để cleanup trong React.useEffect
  initAuth: () => {
    // Check existing session on app mount (e.g., page refresh)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const role = await getUserRole(session.user.id);
        set({
          user: {
            id: session.user.id,
            email: session.user.email ?? '',
            role,
            user_metadata: {
              display_name: session.user.user_metadata?.display_name as string,
            },
          },
          isAuthenticated: true,
          isInitializing: false,
        });
      } else {
        set({ user: null, isAuthenticated: false, isInitializing: false });
      }
    });

    // Listen to future auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          set({ user: null, isAuthenticated: false, isInitializing: false });
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const role = await getUserRole(session.user.id);
          set({
            user: {
              id: session.user.id,
              email: session.user.email ?? '',
              role,
              user_metadata: {
                display_name: session.user.user_metadata?.display_name as string,
              },
            },
            isAuthenticated: true,
            isInitializing: false,
          });
        }
      },
    );

    return () => subscription.unsubscribe();
  },
}));
