import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChatInput } from "@/components/ChatInput";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, MessageSquare, Dices, Package, User, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatInputWithActionsProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  onChatClick?: () => void;
  onDiceClick?: () => void;
  onInventoryClick?: () => void;
  onCharacterClick?: () => void;
}

export const ChatInputWithActions = ({ 
  onSend, 
  disabled,
  onChatClick,
  onDiceClick,
  onInventoryClick,
  onCharacterClick
}: ChatInputWithActionsProps) => {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleActionClick = (action: () => void) => {
    action();
    setOpen(false);
  };

  return (
    <div className="border-t border-border/50 backdrop-blur-epic bg-card/30 px-1 py-3 md:px-1.5 md:py-4 safe-bottom">
      <div className="mx-auto max-w-4xl flex gap-1.5 items-start">
        {isMobile && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                className="h-9 w-9 rounded-lg shadow-md bg-accent hover:bg-accent/80 text-accent-foreground transition-all shrink-0"
              >
                {open ? (
                  <X className="h-3.5 w-3.5" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              side="top" 
              align="start"
              className="w-auto p-2 mb-2 bg-popover/95 backdrop-blur-sm border-primary/20 shadow-lg"
            >
              <div className="flex flex-col gap-2">
                {onChatClick && (
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={() => handleActionClick(onChatClick)}
                    className="w-full justify-start gap-3 h-12 touch-manipulation hover:bg-accent"
                  >
                    <MessageSquare className="h-5 w-5" />
                    <span className="text-base">Chat Social</span>
                  </Button>
                )}
                
                {onDiceClick && (
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={() => handleActionClick(onDiceClick)}
                    className="w-full justify-start gap-3 h-12 touch-manipulation hover:bg-accent"
                  >
                    <Dices className="h-5 w-5" />
                    <span className="text-base">Dados</span>
                  </Button>
                )}
                
                {onInventoryClick && (
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={() => handleActionClick(onInventoryClick)}
                    className="w-full justify-start gap-3 h-12 touch-manipulation hover:bg-accent"
                  >
                    <Package className="h-5 w-5" />
                    <span className="text-base">Inventário</span>
                  </Button>
                )}

                {onCharacterClick && (
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={() => handleActionClick(onCharacterClick)}
                    className="w-full justify-start gap-3 h-12 touch-manipulation hover:bg-accent"
                  >
                    <User className="h-5 w-5" />
                    <span className="text-base">Personagem</span>
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
        
        <ChatInput onSend={onSend} disabled={disabled} />
      </div>
    </div>
  );
};
