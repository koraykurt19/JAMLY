"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

const DEFAULT_FALLBACK = "/brand/jamly-logo-20260730.png";

export function SafeImage({
  src,
  fallbackSrc = DEFAULT_FALLBACK,
  alt,
  ...props
}: ImageProps & { fallbackSrc?: string }) {
  const [resolvedSrc, setResolvedSrc] = useState(src);

  useEffect(() => {
    setResolvedSrc(src);
  }, [src]);

  return (
    <Image
      {...props}
      src={resolvedSrc}
      alt={alt}
      onError={() => {
        if (resolvedSrc !== fallbackSrc) setResolvedSrc(fallbackSrc);
      }}
    />
  );
}
