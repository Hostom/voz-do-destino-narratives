import { Scroll, Sparkles } from "lucide-react";

export const GameHeader = () => {
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
          
          <div className="hidden md:flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-muted-foreground">Sistema Ativo</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Epic glow effect */}
      <div className="absolute inset-0 bg-gradient-glow opacity-30 pointer-events-none"></div>
    </header>
  );
};
