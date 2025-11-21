import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Gavel, Clock, DollarSign, TrendingUp } from "lucide-react";

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
}

interface Bid {
  id: string;
  auction_id: string;
  character_id: string;
  bid_amount: number;
  created_at: string;
}

interface AuctionPanelProps {
  characterId: string;
  roomId: string;
  goldPieces: number;
  onGoldChange: () => void;
}

export function AuctionPanel({ characterId, roomId, goldPieces, onGoldChange }: AuctionPanelProps) {
  const { toast } = useToast();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [bids, setBids] = useState<Record<string, Bid[]>>({});
  const [bidAmounts, setBidAmounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadAuctions();

    const auctionChannel = supabase
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

    const bidChannel = supabase
      .channel(`auction-bids-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'auction_bids'
        },
        () => {
          loadAuctions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(auctionChannel);
      supabase.removeChannel(bidChannel);
    };
  }, [roomId]);

  const loadAuctions = async () => {
    const { data } = await supabase
      .from("merchant_auctions")
      .select("*")
      .eq("room_id", roomId)
      .eq("status", "active")
      .order("end_time", { ascending: true });

    if (data) {
      setAuctions(data);
      // Initialize bid amounts with current prices
      const amounts: Record<string, number> = {};
      data.forEach((auction) => {
        amounts[auction.id] = auction.current_price + 10;
      });
      setBidAmounts(amounts);
    }
  };

  const handlePlaceBid = async (auction: Auction) => {
    const bidAmount = bidAmounts[auction.id] || auction.current_price + 10;

    if (bidAmount <= auction.current_price) {
      toast({
        title: "Lance inválido",
        description: `Seu lance deve ser maior que ${auction.current_price} PO`,
        variant: "destructive",
      });
      return;
    }

    if (goldPieces < bidAmount) {
      toast({
        title: "Ouro insuficiente",
        description: `Você precisa de ${bidAmount} PO para dar este lance`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Record the bid
      const { error: bidError } = await supabase.from("auction_bids").insert({
        auction_id: auction.id,
        character_id: characterId,
        bid_amount: bidAmount,
      });

      if (bidError) throw bidError;

      // Update auction with new highest bid
      const { error: auctionError } = await supabase
        .from("merchant_auctions")
        .update({
          current_price: bidAmount,
          current_bidder_id: characterId,
        })
        .eq("id", auction.id);

      if (auctionError) throw auctionError;

      toast({
        title: "🎯 Lance registrado!",
        description: `Você deu um lance de ${bidAmount} PO em ${auction.item_name}`,
      });

      loadAuctions();
    } catch (error) {
      console.error("Error placing bid:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar seu lance",
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

  const isWinning = (auction: Auction): boolean => {
    return auction.current_bidder_id === characterId;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gavel className="h-5 w-5" />
          Leilões Ativos
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <DollarSign className="h-4 w-4" />
          <span>Seu ouro: {goldPieces} PO</span>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {auctions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Gavel className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum leilão ativo no momento</p>
                <p className="text-xs mt-1">
                  Aguarde o GM iniciar um leilão
                </p>
              </div>
            ) : (
              auctions.map((auction) => (
                <Card key={auction.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm">{auction.item_name}</h4>
                          {isWinning(auction) && (
                            <Badge variant="default" className="bg-green-500">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Vencendo
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {auction.description || "Sem descrição"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <Clock className="h-4 w-4" />
                        <span>{getRemainingTime(auction.end_time)}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Lance atual:</span>
                        <span className="font-bold text-amber-500 text-lg">
                          {auction.current_price} PO
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={bidAmounts[auction.id]}
                          onChange={(e) =>
                            setBidAmounts({
                              ...bidAmounts,
                              [auction.id]: parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="Seu lance"
                          className="flex-1"
                        />
                        <Button
                          onClick={() => handlePlaceBid(auction)}
                          disabled={isWinning(auction)}
                          className="whitespace-nowrap"
                        >
                          {isWinning(auction) ? "Vencendo" : "Dar Lance"}
                        </Button>
                      </div>

                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setBidAmounts({
                              ...bidAmounts,
                              [auction.id]: auction.current_price + 10,
                            })
                          }
                        >
                          +10
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setBidAmounts({
                              ...bidAmounts,
                              [auction.id]: auction.current_price + 25,
                            })
                          }
                        >
                          +25
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setBidAmounts({
                              ...bidAmounts,
                              [auction.id]: auction.current_price + 50,
                            })
                          }
                        >
                          +50
                        </Button>
                      </div>
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
