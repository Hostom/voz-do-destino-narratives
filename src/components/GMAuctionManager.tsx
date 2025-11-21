import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Gavel, Plus, Trash2, Clock, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Auction {
  id: string;
  item_name: string;
  item_type: string;
  description: string;
  starting_price: number;
  current_price: number;
  current_bidder_id: string | null;
  end_time: string;
  status: string;
  created_at: string;
}

interface GMAuctionManagerProps {
  roomId: string;
  gmId: string;
}

export function GMAuctionManager({ roomId, gmId }: GMAuctionManagerProps) {
  const { toast } = useToast();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    item_name: "",
    item_type: "misc",
    description: "",
    starting_price: 100,
    duration_minutes: 30,
  });

  useEffect(() => {
    loadAuctions();

    const channel = supabase
      .channel(`auctions-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'merchant_auctions',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          loadAuctions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const loadAuctions = async () => {
    const { data } = await supabase
      .from("merchant_auctions")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false });

    if (data) {
      setAuctions(data);
    }
  };

  const handleCreateAuction = async () => {
    if (!formData.item_name || formData.starting_price <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const endTime = new Date();
    endTime.setMinutes(endTime.getMinutes() + formData.duration_minutes);

    try {
      const { error } = await supabase.from("merchant_auctions").insert({
        room_id: roomId,
        item_name: formData.item_name,
        item_type: formData.item_type,
        description: formData.description,
        starting_price: formData.starting_price,
        current_price: formData.starting_price,
        end_time: endTime.toISOString(),
        status: "active",
        created_by: gmId,
      });

      if (error) throw error;

      toast({
        title: "✅ Leilão criado!",
        description: `O leilão de ${formData.item_name} está ativo`,
      });

      setIsDialogOpen(false);
      setFormData({
        item_name: "",
        item_type: "misc",
        description: "",
        starting_price: 100,
        duration_minutes: 30,
      });
    } catch (error) {
      console.error("Error creating auction:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o leilão",
        variant: "destructive",
      });
    }
  };

  const handleEndAuction = async (auctionId: string, auction: Auction) => {
    try {
      // Update auction status
      await supabase
        .from("merchant_auctions")
        .update({ status: "completed" })
        .eq("id", auctionId);

      // If there's a winner, award the item
      if (auction.current_bidder_id) {
        await supabase.from("item_rewards").insert({
          room_id: roomId,
          character_id: auction.current_bidder_id,
          item_name: auction.item_name,
          item_type: auction.item_type,
          description: auction.description,
          awarded_by: gmId,
          reason: `Vencedor do leilão por ${auction.current_price} PO`,
          auto_added: true,
        });

        toast({
          title: "🎉 Leilão finalizado!",
          description: `Item ${auction.item_name} foi concedido ao vencedor`,
        });
      } else {
        toast({
          title: "Leilão finalizado",
          description: "Nenhum lance foi feito",
        });
      }
    } catch (error) {
      console.error("Error ending auction:", error);
      toast({
        title: "Erro",
        description: "Não foi possível finalizar o leilão",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAuction = async (auctionId: string) => {
    try {
      await supabase
        .from("merchant_auctions")
        .update({ status: "cancelled" })
        .eq("id", auctionId);

      toast({
        title: "Leilão cancelado",
        description: "O leilão foi cancelado",
      });
    } catch (error) {
      console.error("Error deleting auction:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o leilão",
        variant: "destructive",
      });
    }
  };

  const getRemainingTime = (endTime: string): string => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return "Encerrado";
    
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m`;
    
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Gerenciar Leilões
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Criar Leilão
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Leilão</DialogTitle>
                <DialogDescription>
                  Crie um leilão para que os jogadores possam competir por itens raros
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>Nome do Item</Label>
                  <Input
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    placeholder="Ex: Espada Mágica +1"
                  />
                </div>

                <div>
                  <Label>Tipo de Item</Label>
                  <Select
                    value={formData.item_type}
                    onValueChange={(value) => setFormData({ ...formData, item_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weapon">Arma</SelectItem>
                      <SelectItem value="armor">Armadura</SelectItem>
                      <SelectItem value="potion">Poção</SelectItem>
                      <SelectItem value="scroll">Pergaminho</SelectItem>
                      <SelectItem value="wondrous">Item Maravilhoso</SelectItem>
                      <SelectItem value="misc">Diversos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva o item..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Lance Inicial (PO)</Label>
                    <Input
                      type="number"
                      value={formData.starting_price}
                      onChange={(e) =>
                        setFormData({ ...formData, starting_price: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div>
                    <Label>Duração (minutos)</Label>
                    <Input
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) =>
                        setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 30 })
                      }
                    />
                  </div>
                </div>

                <Button onClick={handleCreateAuction} className="w-full">
                  Criar Leilão
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {auctions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum leilão criado ainda
              </p>
            ) : (
              auctions.map((auction) => (
                <Card key={auction.id} className="p-3">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          {auction.item_name}
                          <Badge
                            variant={
                              auction.status === "active"
                                ? "default"
                                : auction.status === "completed"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {auction.status === "active"
                              ? "Ativo"
                              : auction.status === "completed"
                              ? "Finalizado"
                              : "Cancelado"}
                          </Badge>
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {auction.description || "Sem descrição"}
                        </p>
                      </div>
                      {auction.status === "active" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAuction(auction.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-amber-500" />
                          <span className="font-semibold">{auction.current_price} PO</span>
                        </div>
                        {auction.status === "active" && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{getRemainingTime(auction.end_time)}</span>
                          </div>
                        )}
                      </div>
                      {auction.status === "active" && (
                        <Button
                          onClick={() => handleEndAuction(auction.id, auction)}
                          size="sm"
                          variant="outline"
                        >
                          Finalizar Agora
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
