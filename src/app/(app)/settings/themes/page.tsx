export default function ThemesSettingsPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
        Themes
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Workspace accent and dark/light defaults. The header toggle still works globally;
        this section will persist choice per user.
      </p>
      <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-8 text-sm text-zinc-500 shadow-sm dark:border-white/10 dark:bg-zinc-900/40">
        Theme presets placeholder
      </div>
    </div>
  );
}
