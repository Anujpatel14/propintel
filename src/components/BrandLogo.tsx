import React from 'react';
import Image from 'next/image';

type BrandMarkProps = {
  size?: number;
  className?: string;
  /** Prefer SVG mark for crisp UI; png for places that need raster */
  variant?: 'svg' | 'png';
};

/** PropIntel building mark (teal tile + brass accent). */
export function BrandMark({ size = 32, className = '', variant = 'svg' }: BrandMarkProps) {
  if (variant === 'png') {
    return (
      <Image
        src="/brand/icon.png"
        alt="PropIntel"
        width={size}
        height={size}
        className={`rounded-[22%] ${className}`}
        priority
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/mark.svg"
      alt="PropIntel"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      decoding="async"
    />
  );
}

type BrandLogoProps = {
  className?: string;
  markSize?: number;
  showWordmark?: boolean;
};

/** Mark + PropIntel wordmark for headers / login. */
export function BrandLogo({ className = '', markSize = 36, showWordmark = true }: BrandLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <BrandMark size={markSize} />
      {showWordmark ? (
        <span className="font-display text-2xl tracking-tight text-foreground sm:text-3xl">
          PropIntel
        </span>
      ) : null}
    </span>
  );
}
