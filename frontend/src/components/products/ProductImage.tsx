import { UtensilsCrossed } from "lucide-react";
import { cn } from "@/utils/cn";

export function ProductImage({ src, alt, className, grayscale }: { src: string | null; alt: string; className?: string; grayscale?: boolean }) {
  if (!src) {
    return (
      <div className={cn("grelha-fina grid place-items-center bg-carvao-700 text-fumaca/60", className)} role="img" aria-label={`${alt} (sem foto)`}>
        <UtensilsCrossed className="size-10" aria-hidden />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" decoding="async" className={cn("object-cover", grayscale && "grayscale", className)} />;
}
