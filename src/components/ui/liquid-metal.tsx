"use client";

import React, { memo, forwardRef, useState, useEffect } from "react";
import { LiquidMetal as LiquidMetalShader } from "@paper-design/shaders-react";
import { motion, MotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

// ============================================================================
// LiquidMetal - Base shader wrapper component with WebGL & CSS fallback
// ============================================================================

export interface LiquidMetalProps {
  /** Base background color of the liquid metal */
  colorBack?: string;
  /** Tint/highlight color for the chrome effect */
  colorTint?: string;
  /** Animation speed (0.1 - 2.0 recommended) */
  speed?: number;
  /** Pattern complexity/repetition (1 - 10) */
  repetition?: number;
  /** Wave distortion amount (0 - 1) */
  distortion?: number;
  /** Texture scale */
  scale?: number;
  /** Additional CSS classes */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

export const LiquidMetal = memo(function LiquidMetal({
  colorBack = "#3b0764",
  colorTint = "#c084fc",
  speed = 0.5,
  repetition = 4,
  distortion = 0.15,
  scale = 1,
  className,
  style,
}: LiquidMetalProps) {
  const [hasWebGl, setHasWebGl] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) setHasWebGl(false);
    } catch {
      setHasWebGl(false);
    }
  }, []);

  return (
    <div
      className={cn("absolute inset-0 z-0 overflow-hidden pointer-events-none", className)}
      style={style}
    >
      {hasWebGl ? (
        <LiquidMetalShader
          colorBack={colorBack}
          colorTint={colorTint}
          speed={speed}
          repetition={repetition}
          distortion={distortion}
          softness={0}
          shiftRed={0.3}
          shiftBlue={-0.3}
          angle={45}
          shape="none"
          scale={scale}
          fit="cover"
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        /* CSS Liquid Chrome Fallback */
        <div
          className="absolute inset-0 bg-gradient-to-r from-purple-900 via-zinc-400 to-purple-800 animate-pulse opacity-80"
          style={{
            backgroundSize: "200% 200%",
            filter: "blur(4px)",
          }}
        />
      )}
    </div>
  );
});

LiquidMetal.displayName = "LiquidMetal";

// ============================================================================
// LiquidMetalAnimatedButton - Combination of Liquid Metal + Animated Button
// ============================================================================

export type LiquidMetalButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "style" | "onAnimationStart" | "onDrag" | "onDragEnd" | "onDragStart"
> &
  MotionProps & {
    /** Button content */
    children?: React.ReactNode;
    /** Optional icon displayed on the left */
    icon?: React.ReactNode;
    /** Optional icon displayed on the right */
    rightIcon?: React.ReactNode;
    /** Border width in pixels */
    borderWidth?: number;
    /** Configuration for the LiquidMetal shader */
    metalConfig?: Omit<LiquidMetalProps, "className" | "style">;
    /** Size variant */
    size?: "sm" | "md" | "lg";
    /** Shine sweep color */
    shineColor?: string;
    /** As component or tag */
    as?: any;
    /** Optional style */
    style?: any;
  };

export const LiquidMetalButton = forwardRef<HTMLButtonElement, LiquidMetalButtonProps>(
  (
    {
      children,
      icon,
      rightIcon,
      borderWidth = 2.5,
      metalConfig,
      size = "md",
      className,
      disabled,
      shineColor = "rgba(255,255,255,0.75)",
      as = "button",
      ...props
    },
    ref
  ) => {
    const sizeStyles = {
      sm: "py-1.5 px-4 text-xs gap-2 rounded-full",
      md: "py-2.5 px-6 text-sm gap-2.5 rounded-full",
      lg: "py-3 px-8 text-base gap-3 rounded-full",
    };

    const iconSizes = {
      sm: "w-4 h-4",
      md: "w-4 h-4",
      lg: "w-5 h-5",
    };

    const Component = (motion as any)[as] || motion.button;

    return (
      <Component
        ref={ref}
        disabled={disabled}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
          mass: 0.5,
        }}
        className={cn(
          "relative group inline-flex items-center justify-center cursor-pointer border-none bg-transparent p-0 outline-none select-none",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          className
        )}
        {...props}
      >
        {/* Outer Container with Liquid Metal Border */}
        <div
          className="relative rounded-full overflow-hidden shadow-[0_10px_30px_-8px_rgba(168,85,247,0.35)] transition-shadow duration-300 group-hover:shadow-[0_15px_35px_-6px_rgba(168,85,247,0.55)]"
          style={{ padding: borderWidth }}
        >
          {/* Liquid Metal Border Shader Layer */}
          <LiquidMetal
            colorBack={metalConfig?.colorBack ?? "#2e0854"}
            colorTint={metalConfig?.colorTint ?? "#d8b4fe"}
            speed={metalConfig?.speed ?? 0.6}
            repetition={metalConfig?.repetition ?? 4}
            distortion={metalConfig?.distortion ?? 0.2}
            scale={metalConfig?.scale ?? 1}
            className="absolute inset-0 z-0 rounded-full"
          />

          {/* Animated Border Shine Beam */}
          <motion.span
            className="block absolute inset-0 rounded-full p-px pointer-events-none z-20"
            style={{
              background: `linear-gradient(-75deg, transparent 25%, ${shineColor} 50%, transparent 75%)`,
              backgroundSize: "200% 100%",
              mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              maskComposite: "exclude",
              WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
            }}
            initial={{ backgroundPosition: "100% 0", opacity: 0 }}
            animate={{ backgroundPosition: ["100% 0", "0% 0"], opacity: [0, 1, 0] }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "linear",
              repeatDelay: 1.2,
            }}
          />

          {/* Inner Button Body */}
          <div
            className={cn(
              "relative z-10 rounded-full flex items-center justify-center font-semibold tracking-wide",
              "bg-neutral-950 text-white",
              "transition-colors duration-200",
              "group-hover:bg-neutral-900",
              sizeStyles[size]
            )}
          >
            {icon && (
              <span className={cn("inline-flex items-center justify-center text-purple-300 shrink-0", iconSizes[size])}>
                {icon}
              </span>
            )}

            {/* Shimmering Masked Text */}
            <motion.span
              className="inline-flex items-center justify-center relative z-10 text-white"
              style={{
                WebkitMaskImage:
                  "linear-gradient(-75deg, white calc(var(--mask-x) + 20%), transparent calc(var(--mask-x) + 30%), white calc(var(--mask-x) + 100%))",
                maskImage:
                  "linear-gradient(-75deg, white calc(var(--mask-x) + 20%), transparent calc(var(--mask-x) + 30%), white calc(var(--mask-x) + 100%))",
              }}
              initial={{ ["--mask-x" as any]: "100%" } as any}
              animate={{ ["--mask-x" as any]: "-100%" } as any}
              transition={{
                repeat: Infinity,
                duration: 1.8,
                ease: "linear",
                repeatDelay: 1.2,
              }}
            >
              {children}
            </motion.span>

            {rightIcon && (
              <span className={cn("inline-flex items-center justify-center text-purple-300 shrink-0", iconSizes[size])}>
                {rightIcon}
              </span>
            )}
          </div>
        </div>
      </Component>
    );
  }
);

LiquidMetalButton.displayName = "LiquidMetalButton";

export default LiquidMetalButton;
