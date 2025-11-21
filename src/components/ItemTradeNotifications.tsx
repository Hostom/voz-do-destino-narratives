import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRightLeft, Check, X } from "lucide-react";

interface ItemTrade {
  id: string;
  from_character_id: string;
  to_character_id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  status: string;
  created_at: string;
  from_character?: { name: string };
  to_character?: { name: string };
}

interface ItemTradeNotificationsProps {
  characterId: string;
  roomId: string;
}

export function ItemTradeNotifications({ characterId, roomId }: ItemTradeNotificationsProps) {
  const { toast } = useToast();
  const [pendingTrades, setPendingTrades] = useState<ItemTrade[]>([]);
  const [sentTrades, setSentTrades] = useState<ItemTrade[]>([]);

  useEffect(() => {
    if (!characterId || !roomId) return;

    loadTrades();

    const channel = supabase
      .channel(`trades-${characterId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "item_trades",
          filter: `to_character_id=eq.${characterId}`,
        },
        (payload) => {
          console.log("Trade update received:", payload);
          
          if (payload.eventType === "INSERT") {
            const newTrade = payload.new as ItemTrade;
            toast({
              title: "📦 Nova Oferta de Troca!",
              description: `Você recebeu uma oferta de ${newTrade.item_name} (x${newTrade.quantity})`,
              duration: 6000,
            });
          }
          
          loadTrades();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "item_trades",
          filter: `from_character_id=eq.${characterId}`,
        },
        () => {
          loadTrades();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [characterId, roomId]);

  const loadTrades = async () => {
    // Load incoming trades
    const { data: incoming } = await supabase
      .from("item_trades")
      .select(`
        *,
        from_character:characters!item_trades_from_character_id_fkey(name)
      `)
      .eq("to_character_id", characterId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (incoming) {
      setPendingTrades(incoming as any);
    }

    // Load sent trades
    const { data: sent } = await supabase
      .from("item_trades")
      .select(`
        *,
        to_character:characters!item_trades_to_character_id_fkey(name)
      `)
      .eq("from_character_id", characterId)
      .in("status", ["pending"])
      .order("created_at", { ascending: false });

    if (sent) {
      setSentTrades(sent as any);
    }
  };

  const handleAccept = async (trade: ItemTrade) => {
    try {
      // Check if sender still has the item
      const { data: senderItem } = await supabase
        .from("character_items")
        .select("*")
        .eq("id", trade.item_id)
        .eq("character_id", trade.from_character_id)
        .single();

      if (!senderItem || senderItem.quantity < trade.quantity) {
        toast({
          title: "Item não disponível",
          description: "O jogador não possui mais este item",
          variant: "destructive",
        });
        
        await supabase
          .from("item_trades")
          .update({ status: "cancelled" })
          .eq("id", trade.id);
        
        loadTrades();
        return;
      }

      // Transfer item
      // Remove from sender
      if (senderItem.quantity === trade.quantity) {
        await supabase
          .from("character_items")
          .delete()
          .eq("id", trade.item_id);
      } else {
        await supabase
          .from("character_items")
          .update({ quantity: senderItem.quantity - trade.quantity })
          .eq("id", trade.item_id);
      }

      // Add to receiver (check if they already have it)
      const { data: receiverItem } = await supabase
        .from("character_items")
        .select("*")
        .eq("character_id", characterId)
        .eq("item_name", trade.item_name)
        .single();

      if (receiverItem) {
        await supabase
          .from("character_items")
          .update({ quantity: receiverItem.quantity + trade.quantity })
          .eq("id", receiverItem.id);
      } else {
        await supabase
          .from("character_items")
          .insert({
            character_id: characterId,
            item_name: senderItem.item_name,
            item_type: senderItem.item_type,
            quantity: trade.quantity,
            weight: senderItem.weight,
            description: senderItem.description,
          });
      }

      // Update trade status
      await supabase
        .from("item_trades")
        .update({ status: "accepted", completed_at: new Date().toISOString() })
        .eq("id", trade.id);

      toast({
        title: "✅ Troca aceita!",
        description: `Você recebeu ${trade.item_name} (x${trade.quantity})`,
      });

      loadTrades();
    } catch (error) {
      console.error("Error accepting trade:", error);
      toast({
        title: "Erro na troca",
        description: "Não foi possível completar a troca",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (tradeId: string) => {
    try {
      await supabase
        .from("item_trades")
        .update({ status: "rejected", completed_at: new Date().toISOString() })
        .eq("id", tradeId);

      toast({
        title: "Troca recusada",
        description: "Você recusou a oferta de troca",
      });

      loadTrades();
    } catch (error) {
      console.error("Error rejecting trade:", error);
      toast({
        title: "Erro",
        description: "Não foi possível recusar a troca",
        variant: "destructive",
      });
    }
  };

  const handleCancel = async (tradeId: string) => {
    try {
      await supabase
        .from("item_trades")
        .update({ status: "cancelled", completed_at: new Date().toISOString() })
        .eq("id", tradeId);

      toast({
        title: "Oferta cancelada",
        description: "Você cancelou sua oferta de troca",
      });

      loadTrades();
    } catch (error) {
      console.error("Error cancelling trade:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a oferta",
        variant: "destructive",
      });
    }
  };

  if (pendingTrades.length === 0 && sentTrades.length === 0) {
    return null;
  }

  return (
    <Card className="border-accent/20">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4" />
          Trocas de Itens
          {pendingTrades.length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {pendingTrades.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          <div className="space-y-3">
            {pendingTrades.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Recebidas</p>
                {pendingTrades.map((trade) => (
                  <div key={trade.id} className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium">{trade.item_name}</p>
                        <p className="text-xs text-muted-foreground">
                          De: {(trade.from_character as any)?.name} • Quantidade: {trade.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleAccept(trade)}
                        className="flex-1"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Aceitar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(trade.id)}
                        className="flex-1"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Recusar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {sentTrades.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Enviadas</p>
                {sentTrades.map((trade) => (
                  <div key={trade.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium">{trade.item_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Para: {(trade.to_character as any)?.name} • Quantidade: {trade.quantity}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Aguardando
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancel(trade.id)}
                      className="w-full"
                    >
                      Cancelar Oferta
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
