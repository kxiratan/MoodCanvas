import { MoodType, ThemeConfig } from '@/types/mood';

export class ThemeManager {
  private static themes: Record<MoodType, ThemeConfig> = {
    positive: {
      background: 'from-amber-200 via-orange-200 to-yellow-200',
      gradient: 'bg-gradient-to-br',
      animation: 'animate-pulse-slow'
    },
    energetic: {
      background: 'from-purple-400 via-pink-400 to-red-400',
      gradient: 'bg-gradient-to-br',
      animation: 'animate-pulse'
    },
    calm: {
      background: 'from-blue-200 via-cyan-200 to-teal-200',
      gradient: 'bg-gradient-to-br',
      animation: 'animate-none'
    },
    negative: {
      background: 'from-slate-300 via-gray-300 to-zinc-300',
      gradient: 'bg-gradient-to-br',
      animation: 'animate-none'
    },
    neutral: {
      background: 'from-gray-100 via-slate-100 to-zinc-100',
      gradient: 'bg-gradient-to-br',
      animation: 'animate-none'
    },
    chaotic: {
      background: 'from-indigo-400 via-purple-500 to-pink-500',
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
}