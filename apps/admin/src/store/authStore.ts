import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'reader' | 'writer' | 'editor' | 'admin' | null;

interface AuthState {
  user: User | null;
  userRole: UserRole;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setRole: (role: UserRole) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  userRole: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setRole: (role) => set({ userRole: role }),
  setLoading: (loading) => set({ isLoading: loading }),
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, userRole: null });
  },
}));
