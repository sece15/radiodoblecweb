"use client";

import { useState, ImgHTMLAttributes } from "react";

interface RadioImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  fallbackSrc?: string;
}

/**
 * Validates that an image source does not contain dangerous execution schemes.
 */
function isSafeUrl(url: string): boolean {
  const trimmed = url.trim().toLowerCase();
  if (
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("vbscript:") ||
    trimmed.startsWith("data:text/html")
  ) {
    return false;
  }
  return true;
}

export const RadioImage = ({
  src,
  alt,
  fallbackSrc = "/RADIO.png",
  style,
  className,
  ...rest
}: RadioImageProps) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const cleanSrc =
    typeof src === "string" && src.trim().length > 0 && isSafeUrl(src)
      ? src
      : null;

  const isFailed = cleanSrc !== null && failedSrc === cleanSrc;
  const displaySrc = !cleanSrc || isFailed ? fallbackSrc : cleanSrc;

  const handleError = () => {
    if (cleanSrc && failedSrc !== cleanSrc) {
      setFailedSrc(cleanSrc);
    }
  };

  return (
    <img
      src={displaySrc}
      alt={alt || "Radio Doble C"}
      onError={handleError}
      className={className}
      style={{
        objectFit: "cover",
        ...style,
      }}
      {...rest}
    />
  );
};
