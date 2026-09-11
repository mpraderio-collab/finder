"use client";

import { useRouter } from "next/navigation";

export function PurchaseRow({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <tr
      onClick={() => router.push(href)}
      className="cursor-pointer border-b border-line-soft last:border-0 hover:bg-surface"
    >
      {children}
    </tr>
  );
}
