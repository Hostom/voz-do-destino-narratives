import { Scroll, Sparkles, LogOut, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GameHeaderProps {
  onLogout?: () => void;
  onBackToCharacterSelect?: () => void;
}

export const GameHeader = ({ onLogout, onBackToCharacterSelect }: GameHeaderProps) => {
  return (
    <header className="relative border-b border-border/50 backdrop-blur-epic bg-card/30">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Scroll className="h-8 w-8 text-primary animate-pulse-slow" />
              <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-accent animate-glow" />
            </div>
            <div>
              <h1 className="text-3xl font-cinzel font-bold text-gradient-epic">
                Voz do Destino
              </h1>
              <p className="text-sm text-muted-foreground">AI Game Master</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 mr-4">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-muted-foreground text-sm">Sistema Ativo</span>
            </div>
            
            {onBackToCharacterSelect && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBackToCharacterSelect}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Personagens</span>
              </Button>
            )}
            
            {onLogout && (
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Epic glow effect */}
      <div className="absolute inset-0 bg-gradient-glow opacity-30 pointer-events-none"></div>
    </header>
  );
};
