import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore, UserRole } from '../store/authStore';
import { toast } from 'sonner';

export const useAuth = () => {
  const { setUser, setRole, setLoading, logout } = useAuthStore();
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      logout();
      toast.info('Session expired due to inactivity.');
    }, 2 * 60 * 60 * 1000); // 2 hours
  }, [logout]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, resetIdleTimer));
    resetIdleTimer();

    const checkAuth = async (user: any) => {
      console.log('checkAuth fired, user:', user?.email);
      setLoading(true);
      if (user) {
        try {
          const userEmail = user.email?.toLowerCase();
          // Bootstrap Admin check
          const BOOTSTRAP_ADMINS = ['danielajibade50@gmail.com', 'abdulrahmanadebambo@gmail.com'];
          if (BOOTSTRAP_ADMINS.includes(userEmail || '')) {
            console.log('Bootstrap Admin detected and verified:', userEmail);
            setUser(user);
            setRole('admin');
            setLoading(false);
            return;
          }

          console.log('Fetching user profile from Supabase for ID:', user.id);
          const { data: userDoc, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (userDoc) {
            const role = userDoc.role as UserRole;
            console.log('User profile found in Supabase. Role:', role);
            
            if (role === 'editor' || role === 'admin') {
              setUser(user);
              setRole(role);
              console.log('Access granted for role:', role);
            } else {
              console.warn('Access denied: Role', role, 'is not authorized for admin portal.');
              await logout();
              toast.error('Access Denied: Insufficient permissions.');
            }
          } else {
            console.warn('Access denied: User document does not exist in Supabase for ID:', user.id);
            await logout();
            toast.error('Access Denied: User profile not found.');
          }
        } catch (error) {
          console.error('Fatal auth check error:', error);
          await logout();
        }
      } else {
        console.log('No user detected, clearing session store.');
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    };

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkAuth(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkAuth(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
      events.forEach((event) => window.removeEventListener(event, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [setUser, setRole, setLoading, logout, resetIdleTimer]);
};
