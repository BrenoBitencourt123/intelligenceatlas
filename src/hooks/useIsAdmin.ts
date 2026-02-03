import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useIsAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        return; // Keep isChecking = true
      }

      if (!user) {
        setIsAdmin(false);
        setIsChecking(false);
        return;
      }

      try {
        console.log('[useIsAdmin] Checking admin for user:', user.id);
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        console.log('[useIsAdmin] RPC result:', { data, error });

        if (error) {
          console.error('[useIsAdmin] Admin check error:', error.message);
          setIsAdmin(false);
        } else {
          setIsAdmin(data === true);
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAdminStatus();
  }, [user, authLoading]);

  // isLoading is true while auth OR admin check is pending
  return { isAdmin, isLoading: authLoading || isChecking };
};
