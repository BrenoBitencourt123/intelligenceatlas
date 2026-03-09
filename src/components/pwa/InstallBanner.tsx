import { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem('atlas-install-dismissed') === 'true'
  );
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const ua = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    // Listen for install prompt (Android/Desktop Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setIsInstalled(true));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (isInstalled || dismissed || (!deferredPrompt && !isIOS)) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('atlas-install-dismissed', 'true');
  };

  return (
    <>
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-3 p-4">
          <Download className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Instalar o Atlas</p>
            <p className="text-xs text-muted-foreground">
              Use como um app nativo, com acesso rápido e offline
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isIOS ? (
              <Button size="sm" variant="outline" onClick={() => setShowIOSGuide(true)}>
                <Share className="h-3.5 w-3.5 mr-1" />
                Como instalar
              </Button>
            ) : (
              <Button size="sm" onClick={handleInstall}>
                Instalar
              </Button>
            )}
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {showIOSGuide && (
        <Card className="border-muted bg-muted/30">
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">Como instalar no iPhone/iPad:</p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Toque no botão <strong>Compartilhar</strong> <Share className="inline h-3 w-3" /> na barra do Safari</li>
              <li>Role e toque em <strong>"Adicionar à Tela de Início"</strong></li>
              <li>Toque em <strong>"Adicionar"</strong></li>
            </ol>
            <Button size="sm" variant="ghost" onClick={() => setShowIOSGuide(false)}>
              Entendi
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}
