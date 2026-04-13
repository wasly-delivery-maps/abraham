import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { theme, toggleTheme, switchable } = useTheme();

  if (!switchable || !toggleTheme) {
    return null;
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title={`التبديل إلى الوضع ${theme === "light" ? "الليلي" : "النهاري"}`}
      >
        {theme === "light" ? (
          <Moon className="h-5 w-5 text-slate-600" />
        ) : (
          <Sun className="h-5 w-5 text-amber-400" />
        )}
      </Button>
    </motion.div>
  );
}
