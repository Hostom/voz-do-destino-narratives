import { Moon, Sun, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative w-9 h-9 rounded-full"
          aria-label="Alternar tema"
        >
          <AnimatePresence mode="wait" initial={false}>
            {resolvedTheme === "dark" ? (
              <motion.div
                key="moon"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                <Moon className="h-5 w-5 text-primary" />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                initial={{ scale: 0, rotate: 90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: -90 }}
                transition={{ duration: 0.2 }}
              >
                <Sun className="h-5 w-5 text-primary" />
              </motion.div>
            )}
          </AnimatePresence>
          <span className="sr-only">Alternar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="flex items-center gap-2 cursor-pointer"
          aria-selected={theme === "light"}
        >
          <Sun className="h-4 w-4" />
          <span>Claro</span>
          {theme === "light" && (
            <motion.div
              layoutId="theme-check"
              className="ml-auto w-2 h-2 rounded-full bg-primary"
            />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="flex items-center gap-2 cursor-pointer"
          aria-selected={theme === "dark"}
        >
          <Moon className="h-4 w-4" />
          <span>Escuro</span>
          {theme === "dark" && (
            <motion.div
              layoutId="theme-check"
              className="ml-auto w-2 h-2 rounded-full bg-primary"
            />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="flex items-center gap-2 cursor-pointer"
          aria-selected={theme === "system"}
        >
          <Monitor className="h-4 w-4" />
          <span>Sistema</span>
          {theme === "system" && (
            <motion.div
              layoutId="theme-check"
              className="ml-auto w-2 h-2 rounded-full bg-primary"
            />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
