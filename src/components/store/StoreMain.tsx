/// <reference types="react/canary" />
import { ViewTransition } from "react";

// Contenedor de cada página de la tienda. Envuelve el contenido en un
// <ViewTransition> para que la navegación entre páginas tenga un fundido
// (o un deslizamiento, si el enlace marca "nav-forward" / "nav-back").
// Va en cada page.tsx y no en el layout: los layouts persisten entre
// navegaciones y ahí nunca se disparan enter/exit.
export function StoreMain({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ViewTransition
      enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "page" }}
      exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "page" }}
      default="none"
    >
      <main className={`store flex-1 bg-cream ${className}`}>{children}</main>
    </ViewTransition>
  );
}
