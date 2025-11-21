import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store } from "lucide-react";
import { ItemCard } from "./ItemCard";
import { ItemModal } from "./ItemModal";
import { ShopItem } from "./parseItemList";

interface NPCShopProps {
  items: ShopItem[];
  messageId: string;
}

export const NPCShop = ({ items, messageId }: NPCShopProps) => {
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  if (items.length === 0) return null;

  const handleItemClick = (item: ShopItem) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  return (
    <>
      <Card className="mt-3 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-primary/30 animate-in slide-in-from-bottom-3">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Store className="w-4 h-4" />
            Loja do Mercador
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {items.length} {items.length === 1 ? 'item disponível' : 'itens disponíveis'} para visualização
          </p>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onClick={() => handleItemClick(item)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
      
      <ItemModal
        item={selectedItem}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
};
