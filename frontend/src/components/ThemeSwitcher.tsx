import type { ThemeName } from '../hooks/useTheme';

interface Props {
  theme: ThemeName;
  onChange: (theme: ThemeName) => void;
}

const THEMES: { value: ThemeName; label: string; icon: string }[] = [
  { value: 'dark', label: 'Dark', icon: '☽' },
  { value: 'light', label: 'Light', icon: '☀' },
  { value: 'high-contrast', label: 'High Contrast', icon: '◐' },
];

export function ThemeSwitcher({ theme, onChange }: Props) {
  return (
    <div className="theme-switcher" role="radiogroup" aria-label="Color theme">
      {THEMES.map(t => (
        <button
          key={t.value}
          type="button"
          className={`theme-switcher-btn ${theme === t.value ? 'theme-switcher-btn--active' : ''}`}
          onClick={() => onChange(t.value)}
          role="radio"
          aria-checked={theme === t.value}
          title={`${t.label} theme`}
        >
          <span className="theme-switcher-icon" aria-hidden="true">{t.icon}</span>
          <span className="theme-switcher-label">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
