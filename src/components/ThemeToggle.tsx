import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const themes = ["light", "dark", "system"] as const;
type Theme = (typeof themes)[number];

const themeLabels: Record<Theme, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Button variant="outline" size="icon" className="rounded-full shadow-md">
          <Sun className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  const currentTheme = (theme as Theme) || "system";
  const activeIcon = resolvedTheme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />;

  const cycleTheme = () => {
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <Button
        variant="outline"
        onClick={cycleTheme}
        className="group relative flex items-center gap-0 overflow-hidden rounded-full border border-border bg-background/80 px-3 py-2 shadow-md backdrop-blur-sm transition-all duration-300 hover:bg-accent hover:text-accent-foreground"
      >
        <span className="flex h-5 w-5 items-center justify-center shrink-0">{activeIcon}</span>
        <span className="max-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 group-hover:max-w-[5rem] group-hover:ml-2">
          {themeLabels[currentTheme]}
        </span>
        <span className="sr-only">Toggle theme</span>
      </Button>
    </div>
  );
}
