import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { History, Users, ArrowRight, ArrowLeft, Trash2 } from "lucide-react";
import { Character } from "@/hooks/useCharacter";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RoomHistoryProps {
  onJoinRoom: (roomCode: string, characterId: string) => void;
  loading: boolean;
  character: Character | null;
  onBack?: () => void;
}

interface SavedRoom {
  id: string;
  room_code: string;
  created_at: string;
  session_active: boolean;
  combat_active: boolean;
  player_count: number;
  gm_id: string;
}

export const RoomHistory = ({ onJoinRoom, loading, character, onBack }: RoomHistoryProps) => {
  const [savedRooms, setSavedRooms] = useState<SavedRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentUser();
    if (character) {
      loadSavedRooms();
    }
  }, [character]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const loadSavedRooms = async () => {
    try {
      setLoadingRooms(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all rooms where the user has been a player
      const { data: playerRooms, error: playerError } = await supabase
        .from('room_players')
        .select(`
          room_id,
          rooms!inner(
            id,
            room_code,
            created_at,
            session_active,
            combat_active,
            gm_id
          )
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });

      if (playerError) throw playerError;

      // Get all rooms where the user is the GM
      const { data: gmRooms, error: gmError } = await supabase
        .from('rooms')
        .select('id, room_code, created_at, session_active, combat_active, gm_id')
        .eq('gm_id', user.id)
        .order('created_at', { ascending: false });

      if (gmError) throw gmError;

      // Combine and deduplicate rooms
      const allRooms = [
        ...(playerRooms?.map(pr => pr.rooms) || []),
        ...(gmRooms || [])
      ].filter((room, index, self) => 
        index === self.findIndex(r => r.id === room.id)
      );

      // Get player count for each room
      const roomsWithCounts = await Promise.all(
        allRooms.map(async (room) => {
          const { count } = await supabase
            .from('room_players')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id);

          return {
            ...room,
            player_count: count || 0
          };
        })
      );

      setSavedRooms(roomsWithCounts);
    } catch (error: any) {
      console.error('Error loading saved rooms:', error);
      toast({
        title: "Erro ao carregar salas",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleJoinSavedRoom = (roomCode: string) => {
    if (!character) return;
    onJoinRoom(roomCode, character.id);
  };

  const toggleRoomSelection = (roomId: string) => {
    setSelectedRooms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roomId)) {
        newSet.delete(roomId);
      } else {
        newSet.add(roomId);
      }
      return newSet;
    });
  };

  const handleDeleteSelected = async () => {
    try {
      const roomsToDelete = Array.from(selectedRooms);
      
      // Only delete rooms where the user is the GM
      const gmRooms = savedRooms.filter(r => 
        roomsToDelete.includes(r.id) && r.gm_id === currentUserId
      );

      if (gmRooms.length === 0) {
        toast({
          title: "Erro",
          description: "Você só pode apagar salas onde você é o GM",
          variant: "destructive"
        });
        return;
      }

      // Delete each room
      for (const room of gmRooms) {
        const { error } = await supabase
          .from('rooms')
          .delete()
          .eq('id', room.id);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: `${gmRooms.length} sala(s) apagada(s) com sucesso`,
      });

      setSelectedRooms(new Set());
      setShowDeleteDialog(false);
      loadSavedRooms();
    } catch (error: any) {
      console.error('Error deleting rooms:', error);
      toast({
        title: "Erro ao apagar salas",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const canDeleteRoom = (room: SavedRoom) => {
    return room.gm_id === currentUserId;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl bg-card/80 backdrop-blur border-primary/20">
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
              <History className="w-12 h-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl">Minhas Salas</CardTitle>
          <CardDescription>
            Continue suas aventuras anteriores
          </CardDescription>
          {selectedRooms.size > 0 && (
            <div className="mt-4">
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Apagar {selectedRooms.size} sala(s) selecionada(s)
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {!character ? (
            <div className="text-center p-6 bg-destructive/10 rounded-lg">
              <p className="text-destructive">
                Você precisa criar um personagem antes de entrar em uma sala
              </p>
            </div>
          ) : loadingRooms ? (
            <div className="text-center p-6">
              <p className="text-muted-foreground">Carregando salas...</p>
            </div>
          ) : savedRooms.length === 0 ? (
            <div className="text-center p-6 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">
                Você ainda não participou de nenhuma sala
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {savedRooms.map((room) => (
                <Card key={room.id} className="bg-background/50 hover:bg-background/70 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {canDeleteRoom(room) && (
                        <Checkbox
                          checked={selectedRooms.has(room.id)}
                          onCheckedChange={() => toggleRoomSelection(room.id)}
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-mono text-2xl font-bold">
                            {room.room_code}
                          </h3>
                          {room.session_active && (
                            <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500/30">
                              Ativa
                            </Badge>
                          )}
                          {room.combat_active && (
                            <Badge variant="destructive">
                              Em Combate
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{room.player_count} jogador{room.player_count !== 1 ? 'es' : ''}</span>
                          </div>
                          <span>
                            Criada em {new Date(room.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleJoinSavedRoom(room.room_code)}
                        disabled={loading}
                        className="ml-4"
                      >
                        {loading ? "Entrando..." : "Entrar"}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja apagar {selectedRooms.size} sala(s)? Esta ação não pode ser desfeita.
              Apenas salas onde você é o GM serão apagadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive hover:bg-destructive/90">
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
