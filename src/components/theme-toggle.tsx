'use client';

import { IconMoon, IconSun } from '@tabler/icons-react';
import { useTheme } from './theme-provider';
import { Button } from './ui/button';
import { trackThemeChanged } from '@/lib/posthog-client';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    let newTheme: string;
    if (theme === 'light') {
      newTheme = 'dark';
    } else if (theme === 'dark') {
      newTheme = 'system';
    } else {
      newTheme = 'light';
    }
    setTheme(newTheme);
    trackThemeChanged({ theme: newTheme });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative"
      title={`Current theme: ${theme}`}
    >
      <IconSun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <IconMoon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme (current: {theme})</span>
    </Button>
  );
}
