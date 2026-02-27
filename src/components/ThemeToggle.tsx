type ThemeToggleProps = {
  theme: 'light' | 'dark';
  onToggle: () => void;
};

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="rounded-md border border-[#E0E0E0] bg-white px-3 py-2 text-sm hover:bg-[#F8F8F8]"
      aria-label="Basculer le thème"
    >
      {theme === 'light' ? '🌙 Sombre' : '☀️ Clair'}
    </button>
  );
}
