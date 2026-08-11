import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="text-lg w-9 h-9 flex items-center justify-center rounded-lg border border-border-subtle hover:border-accent transition-colors"
      title={theme === 'dark' ? '切换亮色' : '切换暗色'}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
