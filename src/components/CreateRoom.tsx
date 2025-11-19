import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Plus, ArrowLeft } from "lucide-react";

interface CreateRoomProps {
  onCreateRoom: () => void;
  loading: boolean;
  onBack?: () => void;
}

export const CreateRoom = ({ onCreateRoom, loading, onBack }: CreateRoomProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-card/80 backdrop-blur border-primary/20">
        <CardHeader className="text-center">
          {onBack && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="absolute top-4 left-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          )}
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Shield className="w-12 h-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl">Criar Nova Sala</CardTitle>
          <CardDescription>
            Crie uma sala de combate e convide seus amigos para jogar D&D 5e
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={onCreateRoom} 
            disabled={loading}
            className="w-full"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            {loading ? "Criando..." : "Criar Sala"}
          </Button>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground text-center">
              Um código de 6 dígitos será gerado para você compartilhar com seus jogadores
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
