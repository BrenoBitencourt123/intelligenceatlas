import { useState, useEffect, useCallback } from 'react';
import { 
  startRegistration, 
  startAuthentication,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from '@simplewebauthn/browser';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PasskeyCredential {
  id: string;
  device_name: string;
  created_at: string;
}

export const usePasskey = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isPlatformAvailable, setIsPlatformAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState<PasskeyCredential[]>([]);

  useEffect(() => {
    const checkSupport = async () => {
      const supported = browserSupportsWebAuthn();
      setIsSupported(supported);
      
      if (supported) {
        const platformAvailable = await platformAuthenticatorIsAvailable();
        setIsPlatformAvailable(platformAvailable);
      }
    };
    
    checkSupport();
  }, []);

  const fetchCredentials = useCallback(async () => {
    const { data, error } = await supabase
      .from('passkey_credentials')
      .select('id, device_name, created_at')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCredentials(data);
    }
  }, []);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const registerPasskey = async (deviceName?: string): Promise<boolean> => {
    if (!isSupported || !isPlatformAvailable) {
      toast.error('Seu dispositivo não suporta Face ID/Touch ID');
      return false;
    }

    setIsLoading(true);
    try {
      // Start registration - get options from server
      const { data: startData, error: startError } = await supabase.functions.invoke(
        'webauthn-register',
        { body: { action: 'start' } }
      );

      if (startError || !startData?.options) {
        throw new Error(startError?.message || 'Falha ao iniciar registro');
      }

      // Prompt for biometric authentication
      const registrationResponse = await startRegistration({
        optionsJSON: startData.options,
      });

      // Verify with server
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
        'webauthn-register',
        {
          body: {
            action: 'verify',
            credential: {
              response: registrationResponse,
              expectedChallenge: startData.challenge,
            },
            device_name: deviceName || getDeviceName(),
          },
        }
      );

      if (verifyError || !verifyData?.success) {
        throw new Error(verifyError?.message || 'Falha na verificação');
      }

      toast.success('Face ID/Touch ID configurado com sucesso!');
      await fetchCredentials();
      return true;
    } catch (error: any) {
      console.error('Passkey registration error:', error);
      
      if (error.name === 'NotAllowedError') {
        toast.error('Autenticação cancelada');
      } else if (error.name === 'InvalidStateError') {
        toast.error('Este dispositivo já está registrado');
      } else {
        toast.error('Erro ao configurar biometria');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const authenticateWithPasskey = async (email?: string): Promise<boolean> => {
    if (!isSupported) {
      toast.error('Seu navegador não suporta passkeys');
      return false;
    }

    setIsLoading(true);
    try {
      // Start authentication
      const { data: startData, error: startError } = await supabase.functions.invoke(
        'webauthn-authenticate',
        { body: { action: 'start', email } }
      );

      if (startError || !startData?.options) {
        throw new Error(startError?.message || 'Falha ao iniciar autenticação');
      }

      // Prompt for biometric
      const authResponse = await startAuthentication({
        optionsJSON: startData.options,
      });

      // Verify with server
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
        'webauthn-authenticate',
        {
          body: {
            action: 'verify',
            credential: {
              response: authResponse,
              rawId: authResponse.rawId,
            },
            expectedChallenge: startData.challenge,
          },
        }
      );

      if (verifyError || !verifyData?.success) {
        throw new Error(verifyError?.message || 'Falha na autenticação');
      }

      // Use the token to sign in
      if (verifyData.token_hash) {
        const { error: signInError } = await supabase.auth.verifyOtp({
          token_hash: verifyData.token_hash,
          type: 'magiclink',
        });

        if (signInError) {
          throw signInError;
        }
      }

      toast.success('Login realizado com sucesso!');
      return true;
    } catch (error: any) {
      console.error('Passkey auth error:', error);
      
      if (error.name === 'NotAllowedError') {
        toast.error('Autenticação cancelada');
      } else {
        toast.error('Erro ao autenticar com biometria');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deletePasskey = async (credentialId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('passkey_credentials')
        .delete()
        .eq('id', credentialId);

      if (error) throw error;

      toast.success('Passkey removida');
      await fetchCredentials();
      return true;
    } catch (error) {
      console.error('Delete passkey error:', error);
      toast.error('Erro ao remover passkey');
      return false;
    }
  };

  return {
    isSupported,
    isPlatformAvailable,
    isLoading,
    credentials,
    registerPasskey,
    authenticateWithPasskey,
    deletePasskey,
    refreshCredentials: fetchCredentials,
  };
};

function getDeviceName(): string {
  const ua = navigator.userAgent;
  
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Mac/.test(ua)) return 'Mac';
  if (/Android/.test(ua)) return 'Android';
  if (/Windows/.test(ua)) return 'Windows';
  
  return 'Dispositivo';
}
