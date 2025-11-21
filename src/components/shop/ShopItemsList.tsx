import { useState } from "react";
import { ShopItem } from "@/utils/extractShopItems";
import { ShopItemCard } from "./ShopItemCard";
import { ShopItemModal } from "./ShopItemModal";
import { Store } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ShopItemsListProps {
  items: ShopItem[];
}

export const ShopItemsList = ({ items }: ShopItemsListProps) => {
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleItemClick = (item: ShopItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <Separator className="my-3" />
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Store className="h-4 w-4" />
          <span>Itens Disponíveis</span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <ShopItemCard
              key={item.id}
              item={item}
              onClick={() => handleItemClick(item)}
            />
          ))}
        </div>
      </div>

      <ShopItemModal
        item={selectedItem}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
};

