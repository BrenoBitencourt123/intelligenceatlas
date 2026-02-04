import { Fingerprint, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePasskey } from '@/hooks/usePasskey';

interface PasskeyButtonProps {
  onSuccess?: () => void;
  email?: string;
  variant?: 'login' | 'register';
}

export const PasskeyButton = ({ onSuccess, email, variant = 'login' }: PasskeyButtonProps) => {
  const { isSupported, isPlatformAvailable, isLoading, authenticateWithPasskey, registerPasskey, credentials } = usePasskey();

  // Don't show if not supported or platform authenticator not available
  // For login, only show if user has registered passkeys
  if (!isSupported || (variant === 'register' && !isPlatformAvailable)) {
    return null;
  }
  
  // For login variant, only show if there are registered credentials
  // This prevents showing the Face ID button when user hasn't registered any passkey yet
  if (variant === 'login' && credentials.length === 0) {
    return null;
  }

  const handleClick = async () => {
    let success = false;
    
    if (variant === 'login') {
      success = await authenticateWithPasskey(email);
    } else {
      success = await registerPasskey();
    }
    
    if (success && onSuccess) {
      onSuccess();
    }
  };

  const buttonText = variant === 'login' 
    ? 'Entrar com Face ID' 
    : 'Adicionar Face ID';

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2"
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Fingerprint className="h-5 w-5" />
      )}
      {buttonText}
    </Button>
  );
};
