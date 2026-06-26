import Image from "next/image";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** App logo — unoptimized to avoid stale Next.js image cache after logo updates */
export function AppLogo({
  size = 40,
  className,
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={`${BRAND.logoMark}?v=${BRAND.logoVersion}`}
      alt="Modernity Gate"
      width={size}
      height={size}
      unoptimized
      priority={priority}
      className={cn("object-contain", className)}
    />
  );
}
