import { Scroll, Sparkles, LogOut, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GameHeaderProps {
  onLogout?: () => void;
  onBackToCharacterSelect?: () => void;
  onBackToLobby?: () => void;
  roomCode?: string;
}

export const GameHeader = ({ onLogout, onBackToCharacterSelect, onBackToLobby, roomCode }: GameHeaderProps) => {
  return (
    <header className="relative border-b border-border/50 backdrop-blur-epic bg-card/30">
      <div className="container mx-auto px-3 md:px-6 py-3 md:py-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <div className="relative flex-shrink-0">
              <Scroll className="h-6 w-6 md:h-8 md:w-8 text-primary animate-pulse-slow" />
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 md:h-4 md:w-4 text-accent animate-glow" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg md:text-3xl font-cinzel font-bold text-gradient-epic truncate">
                Voz do Destino
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">AI Game Master</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 md:gap-3 flex-shrink-0">
            <div className="hidden lg:flex items-center gap-2 mr-2 md:mr-4">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-muted-foreground text-xs md:text-sm whitespace-nowrap">
                {roomCode ? `Sala: ${roomCode}` : 'Sistema Ativo'}
              </span>
            </div>
            
            {onBackToLobby && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBackToLobby}
                className="gap-1 md:gap-2 h-7 md:h-9 px-2 md:px-3"
              >
                <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline text-xs md:text-sm">Lobby</span>
              </Button>
            )}
            
            {onBackToCharacterSelect && !roomCode && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBackToCharacterSelect}
                className="gap-1 md:gap-2 h-7 md:h-9 px-2 md:px-3"
              >
                <Users className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden md:inline text-xs md:text-sm">Personagens</span>
              </Button>
            )}
            
            {onLogout && (
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="gap-1 md:gap-2 h-7 md:h-9 px-2 md:px-3"
              >
                <LogOut className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden md:inline text-xs md:text-sm">Sair</span>
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
