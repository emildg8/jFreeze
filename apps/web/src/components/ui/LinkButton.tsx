import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)] active:opacity-90",
  secondary:
    "bg-white text-[var(--brand)] border border-sky-200 hover:bg-sky-50",
};

export function LinkButton({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

export function LinkButtonInline(
  props: ComponentProps<typeof Link> & { variant?: Variant },
) {
  const { variant = "secondary", className = "", ...rest } = props;
  return (
    <Link
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${variants[variant]} ${className}`}
      {...rest}
    />
  );
}
