import { ViewTransition } from "react";

// Wraps a page's content (not the header) so route changes crossfade it with
// the `.e-page` view-transition class (see globals.css). Must live in each
// page, not in a layout: layouts persist, so enter/exit never fire there.
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="e-page" exit="e-page" default="none">
      <div className="flex flex-1 flex-col">{children}</div>
    </ViewTransition>
  );
}
