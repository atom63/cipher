import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "motion/react";
import { Slot } from "radix-ui";
import { type ComponentProps, forwardRef } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-normal outline-none transition-all focus-visible:border-ring focus-visible:ring-[.1875rem] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-foreground text-background shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(0,0,0,0.15)] hover:bg-foreground/90",
        destructive:
          "bg-red-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.15)] hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 dark:hover:bg-destructive/80",
        outline:
          "border bg-card text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-1px_0_rgba(0,0,0,0.06)] hover:border-input hover:bg-secondary hover:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.08)] hover:bg-secondary/80",
        ghost:
          "text-accent-foreground hover:bg-backplate-1 hover:text-foreground dark:hover:bg-accent/50",
        primary:
          "bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.15)] hover:bg-primary/90",
        glass:
          "border border-white/90 bg-white/80 text-foreground/80 shadow-[var(--shadow-3),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.08)] hover:border-white/95 hover:bg-white/95 dark:border-white/10 dark:bg-black/20 dark:hover:bg-black/30",
        "primary-muted":
          "bg-primary/10 text-primary hover:bg-primary/15",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "type-body h-10 min-w-16 px-3 py-1 has-[>svg]:px-3",
        sm: "type-subhead h-8 min-w-16 rounded-sm px-2 py-1 has-[>svg]:px-2.5",
        lg: "type-body h-10 rounded-lg px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-sm [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-sm",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps
  extends ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  motionProps?: {
    hoverScale?: number;
    tapScale?: number;
    hoverRotate?: number;
    tapRotate?: number;
  };
  withMotion?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      withMotion = true,
      motionProps = {
        hoverScale: 1,
        tapScale: 0.98,
        hoverRotate: 0,
        tapRotate: 0,
      },
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot.Root : "button";
    const isGradient = variant?.toString().startsWith("gradient");

    const buttonContent = (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          isGradient && "hover:bg-gradient-to-br"
        )}
        data-slot="button"
        ref={ref}
        {...props}
      >
        {children}
      </Comp>
    );

    if (withMotion) {
      return (
        <motion.div
          className={cn(
            "inline-flex",
            className?.includes("w-full") && "w-full"
          )}
          style={{ transformOrigin: "center" }}
          whileHover={{
            scale: motionProps.hoverScale,
            rotate: motionProps.hoverRotate,
            transition: { duration: 0.2 },
          }}
          whileTap={{
            scale: motionProps.tapScale,
            rotate: motionProps.tapRotate,
            transition: { duration: 0.1 },
          }}
        >
          {buttonContent}
        </motion.div>
      );
    }

    return buttonContent;
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
