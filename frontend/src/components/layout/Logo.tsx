import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/config/site";
import { cn } from "@/utils/cn";

export function GrillMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect x="1.5" y="1.5" width="29" height="29" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M6 9.5h20M6 16h20M6 22.5h20" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="16" cy="16" r="4.2" fill="#D4561A" />
    </svg>
  );
}

/** Logo tipográfica provisória. Se o backend informar `logoUrl`, a imagem oficial a substitui. */
export function Logo({ logoUrl, name, className, href = "/" }: { logoUrl?: string | null; name?: string; className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-3 text-osso", className)} aria-label={`${name ?? "Gilson Parrilha"} — página inicial`}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={name ?? "Gilson Parrilha"} className="h-10 w-auto max-w-[180px] object-contain" />
      ) : (
        <Image src="/gilson-parrilha-logo.jpeg" alt={name ?? "Gilson Parrilha"} width={120} height={120} className="size-11 rounded-full border border-cobre/60 object-cover shadow-[0_0_18px_rgb(192_129_63/0.2)]" priority />
      )}
    </Link>
  );
}
