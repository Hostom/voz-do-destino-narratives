import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, ArrowRight, ArrowLeft } from "lucide-react";
import { Character } from "@/hooks/useCharacter";

interface JoinRoomProps {
  onJoinRoom: (roomCode: string, characterId: string) => void;
  loading: boolean;
  character: Character | null;
  onBack?: () => void;
}

export const JoinRoom = ({ onJoinRoom, loading, character, onBack }: JoinRoomProps) => {
  const [roomCode, setRoomCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.length === 6 && character) {
      onJoinRoom(roomCode.toUpperCase(), character.id);
    }
  };

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
              <Users className="w-12 h-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl">Entrar em Sala</CardTitle>
          <CardDescription>
            Digite o código de 6 dígitos para entrar na aventura
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!character ? (
            <div className="text-center p-6 bg-destructive/10 rounded-lg">
              <p className="text-destructive">
                Você precisa criar um personagem antes de entrar em uma sala
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="roomCode">Código da Sala</Label>
                <Input
                  id="roomCode"
                  placeholder="000000"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl font-mono tracking-widest"
                  autoFocus
                />
              </div>

              <div className="p-4 bg-background/50 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-2">Personagem selecionado:</p>
                <p className="font-semibold">{character.name}</p>
                <p className="text-sm text-muted-foreground">
                  {character.race} {character.class} - Nível {character.level}
                </p>
              </div>

              <Button 
                type="submit"
                disabled={loading || roomCode.length !== 6}
                className="w-full"
                size="lg"
              >
                {loading ? "Entrando..." : "Entrar na Sala"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
