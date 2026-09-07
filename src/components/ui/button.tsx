"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LiquidMetal } from "@/components/ui/liquid-metal";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        liquid:
          "border-none bg-transparent p-0 text-white rounded-full shadow-[0_10px_30px_-5px_rgba(168,85,247,0.4)] hover:shadow-[0_15px_35px_-4px_rgba(168,85,247,0.6)]",
        animated:
          "border border-neutral-700/70 bg-neutral-900/90 text-white shadow-lg hover:border-purple-500/50 hover:bg-neutral-800",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Add liquid metal border shader effect */
  isLiquid?: boolean;
  /** Add sweeping light beam shine effect */
  withShine?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLiquid = false,
      withShine = false,
      children,
      ...props
    },
    ref,
  ) => {
    const isLiquidVariant = variant === "liquid" || isLiquid;
    const shouldShine = withShine || variant === "animated";

    if (isLiquidVariant) {
      return (
        <button
          ref={ref}
          className={cn(buttonVariants({ variant: "liquid", size, className }))}
          {...props}
        >
          <div className="relative rounded-full overflow-hidden p-[2px] w-full h-full flex items-center justify-center">
            {/* Liquid Metal Border Shader */}
            <LiquidMetal
              colorBack="#3b0764"
              colorTint="#e9d5ff"
              speed={0.6}
              repetition={4}
              distortion={0.2}
              className="absolute inset-0 z-0 rounded-full"
            />

            {/* Shimmer beam */}
            <span
              className="block absolute inset-0 rounded-full p-px pointer-events-none z-15"
              style={{
                background:
                  "linear-gradient(-75deg, transparent 25%, rgba(255,255,255,0.7) 50%, transparent 75%)",
                backgroundSize: "200% 100%",
                mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                maskComposite: "exclude",
                WebkitMask:
                  "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                animation: "beamShineSweep 3s ease-in-out infinite",
              }}
            />

            {/* Inner Body */}
            <div className="relative z-10 rounded-full bg-neutral-950 px-6 py-2 w-full h-full flex items-center justify-center gap-2 group-hover:bg-neutral-900 transition-colors">
              {children}
            </div>
          </div>
        </button>
      );
    }

    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {shouldShine && (
          <span
            className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]"
            aria-hidden="true"
          >
            <span
              className="block absolute top-0 -left-[150%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-[20deg]"
              style={{ animation: "beamShineSweep 3.5s ease-in-out infinite" }}
            />
          </span>
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
export { LiquidMetalButton } from "@/components/ui/liquid-metal";
export { AnimatedButton } from "@/components/ui/animated-button";
