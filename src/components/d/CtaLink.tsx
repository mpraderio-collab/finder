import Link from "next/link";

export function CtaArrow() {
  return (
    <span className="d-cta-arrow" aria-hidden="true">
      <svg width="25" height="10" viewBox="0 0 25 10" fill="none" className="mr-2">
        <path d="M0 5h23M19 1l4 4-4 4" stroke="currentColor" strokeWidth="1" />
      </svg>
    </span>
  );
}

// Underlined text link whose arrow grows in on hover, like the reference CTAs.
export function CtaLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`d-cta text-sm ${className}`}>
      <CtaArrow />
      {children}
    </Link>
  );
}
