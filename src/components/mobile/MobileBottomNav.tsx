import { Scroll, MessageSquare, Package, Dices, User, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hasAuctions?: boolean;
}

const navItems = [
  { id: "narrative", icon: Scroll, label: "Aventura" },
  { id: "chat", icon: MessageSquare, label: "Chat" },
  { id: "inventory", icon: Package, label: "Itens" },
  { id: "dice", icon: Dices, label: "Dados" },
  { id: "character", icon: User, label: "Ficha" },
];

export const MobileBottomNav = ({ activeTab, onTabChange, hasAuctions }: MobileBottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1 relative transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-x-2 top-0 h-0.5 bg-primary rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <Icon className={cn(
                "w-5 h-5 mb-0.5 transition-transform",
                isActive && "scale-110"
              )} />
              <span className={cn(
                "text-[10px] font-medium transition-all",
                isActive ? "opacity-100" : "opacity-70"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
