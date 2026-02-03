import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useIsAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        console.log('[useIsAdmin] Checking admin for user:', user.id);
        // Use the has_role function via RPC - it's SECURITY DEFINER so it bypasses RLS
        const { data, error } = await supabase.rpc('has_role', {
          _role: 'admin',
          _user_id: user.id
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
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  return { isAdmin, isLoading };
};
