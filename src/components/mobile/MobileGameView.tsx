import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scroll, MessageSquare, Package, User, Dices, Send, ShoppingBag, Hammer } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileFloatingAction } from "./MobileFloatingAction";
import { SwipeIndicator } from "./SwipeIndicator";
import { PullToRefreshIndicator } from "./PullToRefreshIndicator";
import { MessageSkeleton, InventoryItemSkeleton, CharacterStatsSkeleton, DicePanelSkeleton, ChatSkeleton } from "./MobileSkeletons";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useHaptics } from "@/hooks/useHaptics";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { NarrativeMessage } from "@/components/NarrativeMessage";
import { ChatInput } from "@/components/ChatInput";
import { CharacterStatsBar } from "@/components/CharacterStatsBar";
import { RoomChat } from "@/components/RoomChat";
import { InventoryPanel } from "@/components/InventoryPanel";
import { DicePanel } from "@/components/DicePanel";
import { CraftingPanel } from "@/components/CraftingPanel";
import { ShopPanel } from "@/components/shop/ShopPanel";
import { AuctionPanel } from "@/components/AuctionPanel";
import { InteractiveObjectsPanel } from "@/components/InteractiveObjectsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Character } from "@/hooks/useCharacter";
import { Room, RoomPlayer } from "@/hooks/useRoom";

interface GMMessage {
  id: string;
  player_id: string;
  sender: "player" | "GM";
  content?: string;
  message?: string;
  character_name: string;
  created_at: string;
  type: "gm";
}

interface MobileGameViewProps {
  room: Room;
  character: Character;
  players: RoomPlayer[];
  gmMessages: GMMessage[];
  messagesLoading: boolean;
  isLoading: boolean;
  auctionsActive: boolean;
  userId: string;
  onSend: (message: string) => void;
  onRefresh?: () => Promise<void>;
}

const tabs = ["narrative", "chat", "inventory", "dice", "character"];

export const MobileGameView = ({
  room,
  character,
  players,
  gmMessages,
  messagesLoading,
  isLoading,
  auctionsActive,
  userId,
  onSend,
  onRefresh,
}: MobileGameViewProps) => {
  const [activeTab, setActiveTab] = useState("narrative");
  const [inventorySubTab, setInventorySubTab] = useState("inventory");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { lightTap, successFeedback, diceRoll } = useHaptics();

  const currentTabIndex = tabs.indexOf(activeTab);

  const handleTabChange = useCallback((tab: string) => {
    lightTap();
    setActiveTab(tab);
  }, [lightTap]);

  const swipeHandlers = useSwipeGesture({
    threshold: 80,
    onSwipeLeft: () => {
      if (currentTabIndex < tabs.length - 1) {
        lightTap();
        setActiveTab(tabs[currentTabIndex + 1]);
      }
    },
    onSwipeRight: () => {
      if (currentTabIndex > 0) {
        lightTap();
        setActiveTab(tabs[currentTabIndex - 1]);
      }
    },
  });

  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      await onRefresh();
      successFeedback();
    }
  }, [onRefresh, successFeedback]);

  const pullToRefresh = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [gmMessages]);

  const isGM = userId === room.gm_id;

  const handleSend = useCallback((message: string) => {
    successFeedback();
    onSend(message);
  }, [onSend, successFeedback]);

  const scrollToBottom = useCallback(() => {
    lightTap();
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lightTap]);

  // FAB actions per tab
  const getFabConfig = () => {
    switch (activeTab) {
      case "narrative":
        return {
          context: "narrative" as const,
          onSecondaryActions: [],
        };
      case "chat":
        return {
          context: "default" as const,
          onSecondaryActions: [],
        };
      case "inventory":
        return {
          context: "shop" as const,
          onSecondaryActions: [
            {
              label: "Inventário",
              icon: <Package className="w-4 h-4" />,
              action: () => {
                lightTap();
                setInventorySubTab("inventory");
              },
            },
            {
              label: "Loja",
              icon: <ShoppingBag className="w-4 h-4" />,
              action: () => {
                lightTap();
                setInventorySubTab("shop");
              },
            },
            {
              label: "Crafting",
              icon: <Hammer className="w-4 h-4" />,
              action: () => {
                lightTap();
                setInventorySubTab("crafting");
              },
            },
          ],
        };
      case "dice":
        return {
          context: "combat" as const,
          onPrimaryAction: () => {
            diceRoll();
          },
          onSecondaryActions: [],
        };
      default:
        return {
          context: "default" as const,
          onSecondaryActions: [],
        };
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "narrative":
        return (
          <div className="flex flex-col h-full">
            <div className="px-3 pt-3 pb-2 border-b border-border/50">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Scroll className="w-4 h-4 text-primary" />
                Aventura
              </h3>
            </div>
            <div 
              className="flex-1 overflow-y-auto px-3 py-2 space-y-3 relative"
              {...pullToRefresh}
            >
              <PullToRefreshIndicator
                pullDistance={pullToRefresh.pullDistance}
                isRefreshing={pullToRefresh.isRefreshing}
              />
              {messagesLoading && gmMessages.length === 0 ? (
                <MessageSkeleton />
              ) : (
                <>
                  {gmMessages.map((msg) => (
                    <NarrativeMessage
                      key={msg.id}
                      role={msg.sender === "GM" ? "assistant" : "user"}
                      content={msg.content ?? msg.message ?? ""}
                      characterName={msg.sender === "player" ? msg.character_name : undefined}
                    />
                  ))}
                  {isLoading && (
                    <div className="flex justify-center py-4">
                      <div className="animate-pulse text-muted-foreground text-sm">
                        A Voz do Destino está narrando...
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="shrink-0 px-3 pb-3 pt-2 border-t border-border/50 space-y-2">
              <CharacterStatsBar characterId={character.id} compact />
              <ChatInput onSend={handleSend} disabled={isLoading} placeholder="Descreva sua ação..." />
            </div>
          </div>
        );

      case "chat":
        return (
          <div className="h-full flex flex-col">
            <div className="px-3 pt-3 pb-2 border-b border-border/50">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Chat Social
              </h3>
            </div>
            <div className="flex-1 overflow-hidden">
              {messagesLoading ? (
                <ChatSkeleton />
              ) : (
                <RoomChat
                  roomId={room.id}
                  characterName={character.name}
                  currentTurn={room.current_turn ?? 0}
                  initiativeOrder={(room.initiative_order as any[]) || []}
                  isGM={isGM}
                />
              )}
            </div>
          </div>
        );

      case "inventory":
        return (
          <div className="h-full flex flex-col overflow-hidden">
            <div className="px-3 pt-3 pb-2 border-b border-border/50">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                Itens
              </h3>
            </div>
            <div 
              className="flex-1 overflow-y-auto p-3 relative"
              {...pullToRefresh}
            >
              <PullToRefreshIndicator
                pullDistance={pullToRefresh.pullDistance}
                isRefreshing={pullToRefresh.isRefreshing}
              />
              {messagesLoading ? (
                <InventoryItemSkeleton />
              ) : (
                <Tabs value={inventorySubTab} onValueChange={setInventorySubTab} className="w-full">
                  <TabsList className={cn("grid w-full mb-3", auctionsActive ? "grid-cols-4" : "grid-cols-3")}>
                    <TabsTrigger value="inventory" className="text-xs">Inventário</TabsTrigger>
                    <TabsTrigger value="crafting" className="text-xs">Crafting</TabsTrigger>
                    <TabsTrigger value="shop" className="text-xs">Loja</TabsTrigger>
                    {auctionsActive && <TabsTrigger value="auction" className="text-xs">Leilão</TabsTrigger>}
                  </TabsList>
                  <TabsContent value="inventory" className="mt-0">
                    <InteractiveObjectsPanel characterId={character.id} roomId={room.id} />
                    <InventoryPanel
                      characterId={character.id}
                      carryingCapacity={150}
                      roomId={room.id}
                      players={players.filter((p) => p.characters).map((p) => ({
                        character_id: p.character_id,
                        character_name: p.characters!.name,
                      }))}
                    />
                  </TabsContent>
                  <TabsContent value="crafting" className="mt-0">
                    <CraftingPanel
                      characterId={character.id}
                      intelligence={character.intelligence}
                      wisdom={character.wisdom}
                    />
                  </TabsContent>
                  <TabsContent value="shop" className="mt-0">
                    <ShopPanel roomId={room.id} characterId={character.id} />
                  </TabsContent>
                  {auctionsActive && (
                    <TabsContent value="auction" className="mt-0">
                      <AuctionPanel
                        characterId={character.id}
                        roomId={room.id}
                        goldPieces={character.gold_pieces}
                        onGoldChange={() => window.location.reload()}
                      />
                    </TabsContent>
                  )}
                </Tabs>
              )}
            </div>
          </div>
        );

      case "dice":
        return (
          <div className="h-full flex flex-col">
            <div className="px-3 pt-3 pb-2 border-b border-border/50">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Dices className="w-4 h-4 text-primary" />
                Dados
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {messagesLoading ? (
                <DicePanelSkeleton />
              ) : (
                <DicePanel
                  roomId={room.id}
                  characterName={character.name}
                  characterStats={{
                    strength: character.strength,
                    dexterity: character.dexterity,
                    constitution: character.constitution,
                    intelligence: character.intelligence,
                    wisdom: character.wisdom,
                    charisma: character.charisma,
                  }}
                />
              )}
            </div>
          </div>
        );

      case "character":
        return (
          <div className="h-full flex flex-col">
            <div className="px-3 pt-3 pb-2 border-b border-border/50">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Ficha do Personagem
              </h3>
            </div>
            <div 
              className="flex-1 overflow-y-auto p-3 space-y-4 relative"
              {...pullToRefresh}
            >
              <PullToRefreshIndicator
                pullDistance={pullToRefresh.pullDistance}
                isRefreshing={pullToRefresh.isRefreshing}
              />
              {messagesLoading ? (
                <CharacterStatsSkeleton />
              ) : (
                <>
                  <div className="bg-card/50 rounded-lg p-3 space-y-3">
                    <div className="text-center">
                      <h4 className="text-lg font-bold">{character.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {character.race} {character.class} - Nível {character.level}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-background/50 rounded p-2 text-center">
                        <p className="text-xs text-muted-foreground">HP</p>
                        <p className="text-lg font-bold">{character.current_hp}/{character.max_hp}</p>
                      </div>
                      <div className="bg-background/50 rounded p-2 text-center">
                        <p className="text-xs text-muted-foreground">AC</p>
                        <p className="text-lg font-bold">{character.armor_class}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground">Atributos</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: "strength", label: "FOR" },
                        { key: "dexterity", label: "DES" },
                        { key: "constitution", label: "CON" },
                        { key: "intelligence", label: "INT" },
                        { key: "wisdom", label: "SAB" },
                        { key: "charisma", label: "CAR" },
                      ].map(({ key, label }) => (
                        <div key={key} className="bg-muted/50 rounded p-2 text-center">
                          <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
                          <p className="text-base font-bold">{character[key as keyof typeof character]}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {character.backstory && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-muted-foreground">História</p>
                        <p className="text-sm leading-relaxed">{character.backstory}</p>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const fabConfig = getFabConfig();

  return (
    <div className="h-full flex flex-col pb-16">
      <SwipeIndicator 
        totalTabs={tabs.length} 
        activeIndex={currentTabIndex}
        className="pt-1"
      />
      
      <div
        ref={contentRef}
        className="flex-1 min-h-0 overflow-hidden bg-card/50 backdrop-blur-sm border border-primary/20 rounded-lg mx-2 mb-2"
        {...swipeHandlers}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {fabConfig.onSecondaryActions && fabConfig.onSecondaryActions.length > 0 && (
        <MobileFloatingAction
          context={fabConfig.context}
          onPrimaryAction={fabConfig.onPrimaryAction}
          onSecondaryActions={fabConfig.onSecondaryActions}
        />
      )}

      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        hasAuctions={auctionsActive}
      />
    </div>
  );
};
