import { getSiteSettings } from "@/lib/settings";
import { SettingsForm } from "./SettingsForm";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div>
      <h1 className="font-heading text-2xl font-extrabold text-ink">
        Configuración
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        Ajustes generales del sitio. Las características de cada producto se
        editan desde Productos → el producto → Características.
      </p>

      <div className="mt-8">
        <SettingsForm installments={settings.installments} />
      </div>
    </div>
  );
}
