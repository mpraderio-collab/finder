import { ViewTransition } from "react";

// Every storefront page fades in/out as a whole on navigation (the reference
// fades its body). Lives in each page, not the layout: layouts persist across
// navigations, so enter/exit would never fire there.
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="d-page" exit="d-page" default="none">
      {children}
    </ViewTransition>
  );
}

// Shared element between a catalog card and the product page hero photo.
export function ProductPhotoTransition({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  return (
    <ViewTransition name={`product-photo-${slug}`} share="d-morph" default="none">
      {children}
    </ViewTransition>
  );
}
