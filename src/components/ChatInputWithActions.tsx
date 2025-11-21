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
    <div className="flex gap-2 items-end">
      <div className="flex-1">
        <ChatInput onSend={onSend} disabled={disabled} />
      </div>
      
      {isMobile && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              size="icon"
              className="h-12 w-12 md:h-14 md:w-14 rounded-full shadow-epic bg-primary hover:bg-primary/90 touch-manipulation shrink-0 mb-2 md:mb-6"
            >
              {open ? (
                <X className="h-4 w-4 md:h-5 md:w-5" />
              ) : (
                <Plus className="h-4 w-4 md:h-5 md:w-5" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            side="top" 
            align="end"
            className="w-auto p-2 bg-popover/95 backdrop-blur-sm border-primary/20"
          >
            <div className="flex flex-col gap-2">
              {onChatClick && (
                <Button
                  size="lg"
                  onClick={() => handleActionClick(onChatClick)}
                  className="w-full justify-start gap-3 h-14 touch-manipulation"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span className="text-base">Chat Social</span>
                </Button>
              )}
              
              {onDiceClick && (
                <Button
                  size="lg"
                  onClick={() => handleActionClick(onDiceClick)}
                  className="w-full justify-start gap-3 h-14 touch-manipulation"
                >
                  <Dices className="h-5 w-5" />
                  <span className="text-base">Dados</span>
                </Button>
              )}
              
              {onInventoryClick && (
                <Button
                  size="lg"
                  onClick={() => handleActionClick(onInventoryClick)}
                  className="w-full justify-start gap-3 h-14 touch-manipulation"
                >
                  <Package className="h-5 w-5" />
                  <span className="text-base">Inventário</span>
                </Button>
              )}

              {onCharacterClick && (
                <Button
                  size="lg"
                  onClick={() => handleActionClick(onCharacterClick)}
                  className="w-full justify-start gap-3 h-14 touch-manipulation"
                >
                  <User className="h-5 w-5" />
                  <span className="text-base">Personagem</span>
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};
