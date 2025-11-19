import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Zap, Wifi } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-cinzel mb-2">
            Instalar Voz do Destino
          </CardTitle>
          <CardDescription className="text-lg">
            Transforme sua experiência de RPG em um aplicativo nativo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center space-y-4">
              <div className="text-6xl">✅</div>
              <p className="text-xl font-semibold">Aplicativo já instalado!</p>
              <Button onClick={() => navigate("/")} size="lg" className="w-full">
                Voltar ao Jogo
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/50">
                  <Smartphone className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Acesso Rápido</h3>
                    <p className="text-sm text-muted-foreground">
                      Adicione à tela inicial e acesse com um toque
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/50">
                  <Wifi className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Modo Offline</h3>
                    <p className="text-sm text-muted-foreground">
                      Funciona mesmo sem conexão com a internet
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/50">
                  <Zap className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Performance</h3>
                    <p className="text-sm text-muted-foreground">
                      Carregamento ultrarrápido e experiência fluida
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/50">
                  <Download className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Sem App Store</h3>
                    <p className="text-sm text-muted-foreground">
                      Instale diretamente do navegador
                    </p>
                  </div>
                </div>
              </div>

              {deferredPrompt ? (
                <Button 
                  onClick={handleInstall} 
                  size="lg" 
                  className="w-full"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Instalar Agora
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <h3 className="font-semibold mb-2">Como instalar:</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><strong>iPhone/Safari:</strong> Toque em Compartilhar → Adicionar à Tela de Início</p>
                      <p><strong>Android/Chrome:</strong> Menu (⋮) → Instalar aplicativo</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => navigate("/")} 
                    variant="outline"
                    size="lg" 
                    className="w-full"
                  >
                    Voltar ao Jogo
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
