import { MoodType, ThemeConfig } from '@/types/mood';

export class ThemeManager {
  // Emotional color mapping
  private static moodColors: Record<MoodType, { main: string; accent: string }> = {
    positive: {
      main: 'yellow', // Joy, optimism
      accent: 'green'  // Growth, harmony
    },
    energetic: {
      main: 'red',     // Energy, passion
      accent: 'yellow' // Vitality
    },
    calm: {
      main: 'blue',    // Serenity, peace
      accent: 'beige'  // Stability
    },
    negative: {
      main: 'purple',  // Complexity, depth
      accent: 'blue'   // Introspection
    },
    neutral: {
      main: 'beige',   // Balance, neutrality
      accent: 'white'  // Clarity
    },
    chaotic: {
      main: 'red',     // Intensity
      accent: 'purple' // Transformation
    }
  };

  private static themes: Record<MoodType, ThemeConfig> = {
    positive: {
      background: 'from-yellow-300 via-green-200 to-yellow-200',
      gradient: 'bg-gradient-to-br',
      animation: 'animate-pulse-slow'
    },
    energetic: {
      background: 'from-red-400 via-yellow-300 to-red-300',
      gradient: 'bg-gradient-to-br',
      animation: 'animate-pulse'
    },
    calm: {
      background: 'from-blue-300 via-blue-200 to-slate-200',
      gradient: 'bg-gradient-to-br',
      animation: 'animate-none'
    },
    negative: {
      background: 'from-purple-300 via-blue-300 to-purple-200',
      gradient: 'bg-gradient-to-br',
      animation: 'animate-none'
    },
    neutral: {
      background: 'from-slate-200 via-stone-100 to-slate-100',
      gradient: 'bg-gradient-to-br',
      animation: 'animate-none'
    },
    chaotic: {
      background: 'from-red-400 via-purple-400 to-red-300',
      gradient: 'bg-gradient-to-br',
      animation: 'animate-pulse-fast'
    }
  };

  static getTheme(mood: MoodType): ThemeConfig {
    return this.themes[mood];
  }

  static getThemeClasses(mood: MoodType): string {
    const theme = this.getTheme(mood);
    return `${theme.gradient} ${theme.background} ${theme.animation}`;
  }

  // Return a map of CSS variable values (H S% L%) to apply globally for a mood.
  // These map to the variables used in `globals.css` so Tailwind-based components
  // that reference --primary, --accent, etc. will automatically pick up the mood.
  static getCssVars(mood: MoodType): Record<string, string> {
    const common = {
      // defaults that many moods can override
      '--border': '214.3 31.8% 91.4%',
      '--input': '214.3 31.8% 91.4%',
      '--ring': '222.2 84% 4.9%'
    } as Record<string, string>;

    const palettes = {
      positive: {
        '--background': '60 95% 95%',  // Light yellow background
        '--foreground': '60 10% 10%',  // Dark text
        '--primary': '60 90% 50%',     // Yellow primary (buttons)
        '--primary-foreground': '0 0% 100%',
        '--secondary': '60 90% 50%',   // Keep yellow
        '--secondary-foreground': '0 0% 100%',
        '--muted': '60 30% 96%',
        '--muted-foreground': '60 10% 40%',
        '--accent': '60 90% 50%',      // Keep yellow
        '--accent-foreground': '0 0% 100%',
        '--destructive': '0 85% 60%',
        '--destructive-foreground': '0 0% 100%',
        '--sidebar-background': '60 95% 97%',
        '--sidebar-foreground': '60 10% 10%',
        '--sidebar-primary': '60 90% 50%',
        '--sidebar-primary-foreground': '0 0% 100%'
      },
      negative: {
        '--background': '0 95% 97%',   // Light red background
        '--foreground': '0 10% 10%',
        '--primary': '0 90% 60%',      // Red primary (buttons)
        '--primary-foreground': '0 0% 100%',
        '--secondary': '0 90% 60%',    // Keep red
        '--secondary-foreground': '0 0% 100%',
        '--muted': '0 30% 96%',
        '--muted-foreground': '0 10% 40%',
        '--accent': '0 90% 60%',       // Keep red
        '--accent-foreground': '0 0% 100%',
        '--destructive': '0 90% 60%',
        '--destructive-foreground': '0 0% 100%',
        '--sidebar-background': '0 95% 98%',
        '--sidebar-foreground': '0 10% 10%',
        '--sidebar-primary': '0 90% 60%',
        '--sidebar-primary-foreground': '0 0% 100%'
      },
      energetic: {
        '--background': '142 95% 97%', // Vibrant green background (shifted hue)
        '--foreground': '142 10% 10%',
        '--primary': '142 76% 48%',    // More saturated green primary
        '--primary-foreground': '0 0% 100%',
        '--secondary': '142 76% 48%',  // Keep consistent
        '--secondary-foreground': '0 0% 100%',
        '--muted': '142 40% 96%',
        '--muted-foreground': '142 10% 40%',
        '--accent': '142 76% 48%',     // Keep consistent
        '--accent-foreground': '0 0% 100%',
        '--destructive': '0 85% 60%',
        '--destructive-foreground': '0 0% 100%',
        '--sidebar-background': '142 95% 98%',
        '--sidebar-foreground': '142 10% 10%',
        '--sidebar-primary': '142 76% 48%',
        '--sidebar-primary-foreground': '0 0% 98%'
      },
      calm: {
        '--background': '210 95% 97%', // Light blue background
        '--foreground': '210 10% 10%',
        '--primary': '210 80% 50%',    // Blue primary (buttons)
        '--primary-foreground': '0 0% 100%',
        '--secondary': '210 80% 50%',  // Keep blue
        '--secondary-foreground': '0 0% 100%',
        '--muted': '210 30% 96%',
        '--muted-foreground': '210 10% 40%',
        '--accent': '210 80% 50%',     // Keep blue
        '--accent-foreground': '0 0% 100%',
        '--destructive': '0 85% 60%',
        '--destructive-foreground': '0 0% 100%',
        '--sidebar-background': '210 95% 98%',
        '--sidebar-foreground': '210 10% 10%',
        '--sidebar-primary': '210 80% 50%',
        '--sidebar-primary-foreground': '0 0% 100%'
      },
      chaotic: {
        '--background': '270 95% 97%', // Light purple background
        '--foreground': '270 10% 10%',
        '--primary': '270 70% 50%',    // Purple primary (buttons)
        '--primary-foreground': '0 0% 100%',
        '--secondary': '270 70% 50%',  // Keep purple
        '--secondary-foreground': '0 0% 100%',
        '--muted': '270 30% 96%',
        '--muted-foreground': '270 10% 40%',
        '--accent': '270 70% 50%',     // Keep purple
        '--accent-foreground': '0 0% 100%',
        '--destructive': '0 85% 60%',
        '--destructive-foreground': '0 0% 100%',
        '--sidebar-background': '270 95% 98%',
        '--sidebar-foreground': '270 10% 10%',
        '--sidebar-primary': '270 70% 50%',
        '--sidebar-primary-foreground': '0 0% 100%'
      },
      neutral: {
        '--background': '0 0% 98%',    // Light gray background
        '--foreground': '0 0% 10%',
        '--primary': '0 0% 80%',       // Gray primary (buttons)
        '--primary-foreground': '0 0% 10%',
        '--secondary': '0 0% 80%',     // Keep gray
        '--secondary-foreground': '0 0% 10%',
        '--muted': '0 0% 96%',
        '--muted-foreground': '0 0% 40%',
        '--accent': '0 0% 80%',        // Keep gray
        '--accent-foreground': '0 0% 10%',
        '--destructive': '0 85% 60%',
        '--destructive-foreground': '0 0% 100%',
        '--sidebar-background': '0 0% 98%',
        '--sidebar-foreground': '0 0% 10%',
        '--sidebar-primary': '0 0% 80%',
        '--sidebar-primary-foreground': '0 0% 10%'
      }
    };

    return { ...common, ...(palettes[mood] || palettes.neutral) };
  }
}