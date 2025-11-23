import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Plus, ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface CreateRoomProps {
  onCreateRoom: (campaignType: string) => void;
  loading: boolean;
  onBack?: () => void;
}

export const CreateRoom = ({ onCreateRoom, loading, onBack }: CreateRoomProps) => {
  const [campaignType, setCampaignType] = useState<string>("fantasy");

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
            Crie uma sala e convide seus amigos para jogar RPG
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaign-type">Tipo de Campanha</Label>
            <Select value={campaignType} onValueChange={setCampaignType}>
              <SelectTrigger id="campaign-type">
                <SelectValue placeholder="Selecione o tipo de campanha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fantasy">Fantasia Medieval</SelectItem>
                <SelectItem value="cyberpunk">Cyberpunk</SelectItem>
                <SelectItem value="horror">Terror</SelectItem>
                <SelectItem value="sci-fi">Ficção Científica</SelectItem>
                <SelectItem value="post-apocalyptic">Pós-Apocalíptico</SelectItem>
                <SelectItem value="steampunk">Steampunk</SelectItem>
                <SelectItem value="western">Velho Oeste</SelectItem>
                <SelectItem value="modern">Moderno</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={() => onCreateRoom(campaignType)} 
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
