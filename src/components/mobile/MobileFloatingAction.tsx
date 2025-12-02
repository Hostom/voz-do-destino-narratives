import { useState } from "react";
import { Plus, Send, Swords, Shield, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface MobileFloatingActionProps {
  context: "narrative" | "combat" | "shop" | "default";
  onPrimaryAction?: () => void;
  onSecondaryActions?: {
    label: string;
    icon: React.ReactNode;
    action: () => void;
  }[];
  disabled?: boolean;
}

export const MobileFloatingAction = ({
  context,
  onPrimaryAction,
  onSecondaryActions = [],
  disabled
}: MobileFloatingActionProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const getContextIcon = () => {
    switch (context) {
      case "narrative":
        return <Send className="w-5 h-5" />;
      case "combat":
        return <Swords className="w-5 h-5" />;
      case "shop":
        return <Sparkles className="w-5 h-5" />;
      default:
        return <Plus className="w-5 h-5" />;
    }
  };

  const getContextColor = () => {
    switch (context) {
      case "narrative":
        return "bg-primary hover:bg-primary/90";
      case "combat":
        return "bg-destructive hover:bg-destructive/90";
      case "shop":
        return "bg-amber-500 hover:bg-amber-500/90";
      default:
        return "bg-secondary hover:bg-secondary/90";
    }
  };

  const handlePrimaryClick = () => {
    if (onSecondaryActions.length > 0) {
      setIsOpen(!isOpen);
    } else if (onPrimaryAction) {
      onPrimaryAction();
    }
  };

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col-reverse items-end gap-3">
      {/* Secondary action buttons */}
      <AnimatePresence>
        {isOpen && onSecondaryActions.map((action, index) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => {
              action.action();
              setIsOpen(false);
            }}
            className="flex items-center gap-2 pl-3 pr-4 py-2 rounded-full bg-card border border-border shadow-lg"
          >
            {action.icon}
            <span className="text-sm font-medium">{action.label}</span>
          </motion.button>
        ))}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handlePrimaryClick}
        disabled={disabled}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all",
          getContextColor(),
          disabled && "opacity-50 cursor-not-allowed",
          isOpen && "rotate-45"
        )}
      >
        {isOpen ? <X className="w-5 h-5 text-white" /> : <span className="text-white">{getContextIcon()}</span>}
      </motion.button>
    </div>
  );
};
