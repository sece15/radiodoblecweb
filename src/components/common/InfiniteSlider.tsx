"use client";

import React, { useRef, useEffect, useState, ReactNode } from "react";

export interface InfiniteSliderProps {
  children: ReactNode;
  gap?: number;
  speed?: number; // Pixels per second
  speedOnHover?: number; // Pixels per second on hover (0 = pause smoothly)
  direction?: "horizontal" | "vertical";
  reverse?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const InfiniteSlider: React.FC<InfiniteSliderProps> = ({
  children,
  gap = 48,
  speed = 40,
  speedOnHover = 0,
  direction = "horizontal",
  reverse = false,
  className = "",
  style = {},
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const posRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const currentSpeedRef = useRef(speed);
  const targetSpeedRef = useRef(speed);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    targetSpeedRef.current = isHovered && speedOnHover !== undefined ? speedOnHover : speed;
  }, [isHovered, speed, speedOnHover]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let segmentSize = 0;

    const measureSize = () => {
      const firstChild = track.children[0] as HTMLElement;
      if (firstChild) {
        segmentSize = direction === "horizontal" ? firstChild.offsetWidth + gap : firstChild.offsetHeight + gap;
      }
    };

    measureSize();

    // Re-measure when contents / images load
    const resizeObserver = new ResizeObserver(() => {
      measureSize();
    });
    resizeObserver.observe(track);

    const step = (now: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = now;
      }
      const delta = Math.min((now - lastTimeRef.current) / 1000, 0.1); // Cap delta to avoid jumps on tab switch
      lastTimeRef.current = now;

      // Smooth deceleration/acceleration (smooth transition)
      currentSpeedRef.current += (targetSpeedRef.current - currentSpeedRef.current) * Math.min(1, delta * 10);

      const effectiveSpeed = currentSpeedRef.current;

      if (segmentSize > 0) {
        if (reverse) {
          posRef.current += effectiveSpeed * delta;
          if (posRef.current >= 0) {
            posRef.current -= segmentSize;
          }
        } else {
          posRef.current -= effectiveSpeed * delta;
          if (Math.abs(posRef.current) >= segmentSize) {
            posRef.current += segmentSize;
          }
        }

        if (direction === "horizontal") {
          track.style.transform = `translate3d(${posRef.current}px, 0px, 0px)`;
        } else {
          track.style.transform = `translate3d(0px, ${posRef.current}px, 0px)`;
        }
      }

      animFrameIdRef.current = requestAnimationFrame(step);
    };

    animFrameIdRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [gap, speed, reverse, direction]);

  return (
    <div
      ref={containerRef}
      className={`infinite-slider-wrapper ${className}`}
      style={{
        overflow: "hidden",
        width: "100%",
        position: "relative",
        maskImage: "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
        ...style,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={trackRef}
        style={{
          display: "flex",
          width: "max-content",
          flexDirection: direction === "horizontal" ? "row" : "column",
          gap: `${gap}px`,
          willChange: "transform",
          transform: "translate3d(0, 0, 0)",
        }}
      >
        <div style={{ display: "flex", flexDirection: direction === "horizontal" ? "row" : "column", alignItems: "center", gap: `${gap}px`, flexShrink: 0 }}>
          {children}
        </div>
        <div style={{ display: "flex", flexDirection: direction === "horizontal" ? "row" : "column", alignItems: "center", gap: `${gap}px`, flexShrink: 0 }} aria-hidden="true">
          {children}
        </div>
        <div style={{ display: "flex", flexDirection: direction === "horizontal" ? "row" : "column", alignItems: "center", gap: `${gap}px`, flexShrink: 0 }} aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
};

export default InfiniteSlider;
