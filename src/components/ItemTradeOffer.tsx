import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowRightLeft } from "lucide-react";

interface ItemTradeOfferProps {
  itemId: string;
  itemName: string;
  quantity: number;
  characterId: string;
  roomId: string;
  players: Array<{ character_id: string; character_name: string }>;
}

export function ItemTradeOffer({ itemId, itemName, quantity, characterId, roomId, players }: ItemTradeOfferProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [offerQuantity, setOfferQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter out current player
  const otherPlayers = players.filter(p => p.character_id !== characterId);

  const handleOffer = async () => {
    if (!selectedPlayer) {
      toast({
        title: "Selecione um jogador",
        description: "Você precisa selecionar para quem quer oferecer o item",
        variant: "destructive",
      });
      return;
    }

    if (offerQuantity > quantity) {
      toast({
        title: "Quantidade inválida",
        description: "Você não tem essa quantidade do item",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("item_trades")
        .insert({
          room_id: roomId,
          from_character_id: characterId,
          to_character_id: selectedPlayer,
          item_id: itemId,
          item_name: itemName,
          quantity: offerQuantity,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Oferta enviada!",
        description: `Você ofereceu ${itemName} (x${offerQuantity}) para troca`,
      });

      setIsOpen(false);
      setSelectedPlayer("");
      setOfferQuantity(1);
    } catch (error) {
      console.error("Error creating trade offer:", error);
      toast({
        title: "Erro ao criar oferta",
        description: "Não foi possível enviar a oferta de troca",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (otherPlayers.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2">
          <ArrowRightLeft className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Oferecer Item para Troca</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">{itemName}</p>
            <p className="text-xs text-muted-foreground">Disponível: {quantity}</p>
          </div>

          <div className="space-y-2">
            <Label>Para quem oferecer?</Label>
            <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um jogador" />
              </SelectTrigger>
              <SelectContent>
                {otherPlayers.map((player) => (
                  <SelectItem key={player.character_id} value={player.character_id}>
                    {player.character_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Quantidade</Label>
            <Select 
              value={offerQuantity.toString()} 
              onValueChange={(v) => setOfferQuantity(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: Math.min(quantity, 10) }, (_, i) => i + 1).map((q) => (
                  <SelectItem key={q} value={q.toString()}>
                    {q}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleOffer} disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Enviando..." : "Enviar Oferta"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
