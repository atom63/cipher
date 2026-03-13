import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const richButtonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "group/rich-button cursor-pointer overflow-hidden text-primary-foreground",
    '[&_svg:not([class*="size-"])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  ],
  {
    variants: {
      size: {
        sm: "h-8 min-w-16 rounded-sm px-2 py-1 text-sm has-[>svg]:px-2.5",
        default: "h-10 min-w-16 rounded-md px-3 py-1 text-base has-[>svg]:px-3",
        lg: "h-10 rounded-lg px-6 text-lg has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-sm [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-sm",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

interface RichButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof richButtonVariants> {
  asChild?: boolean;
}

// Maps size variant to its radius token for concentric inner radii
const RADIUS_TOKEN: Record<string, string> = {
  sm: "var(--radius-sm)",
  default: "var(--radius-md)",
  lg: "var(--radius-lg)",
  icon: "var(--radius-md)",
  "icon-sm": "var(--radius-sm)",
};

const RichButton = forwardRef<HTMLButtonElement, RichButtonProps>(
  ({ className, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot.Root : "button";
    const radiusToken = className?.includes("rounded-full")
      ? "var(--radius-full)"
      : RADIUS_TOKEN[size || "default"];

    // Inset lighting tuned for primary color
    const insetShadow = [
      "color-mix(in srgb, var(--color-white) 18%, transparent) 0px 1px 0.5px -0.5px inset",
      "color-mix(in srgb, var(--primary) 24%, transparent) 0px -2px 8px 2px inset",
      "color-mix(in srgb, var(--color-white) 48%, transparent) 0px -2px 8px 2px inset",
    ].join(", ");

    const primaryGlow =
      "color-mix(in srgb, var(--primary) 40%, transparent) 0px 8px 24px -4px";
    const baseBoxShadow = `${insetShadow}, var(--shadow-4), ${primaryGlow}`;
    const hoverBoxShadow = `${insetShadow}, var(--shadow-6), ${primaryGlow}`;
    const activeBoxShadow = `${insetShadow}, var(--shadow-1), ${primaryGlow}`;

    return (
      <Comp
        className={cn(richButtonVariants({ size }), className)}
        onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.boxShadow = activeBoxShadow;
          e.currentTarget.style.transform = "translateY(1px)";
        }}
        onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.boxShadow = hoverBoxShadow;
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.boxShadow = baseBoxShadow;
          e.currentTarget.style.transform = "translateY(0px)";
        }}
        onMouseUp={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.boxShadow = hoverBoxShadow;
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        ref={ref}
        style={
          {
            "--_r": radiusToken,
            backgroundColor: "var(--primary)",
            boxShadow: baseBoxShadow,
            transition: "all 200ms ease, box-shadow 300ms ease",
          } as React.CSSProperties
        }
        {...props}
      >
        {/* Brightness/contrast gradient: bright top-left → deep bottom-right */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            background: `
              linear-gradient(
                135deg,
                rgba(255,255,255,0.18) 0%,
                rgba(255,255,255,0.06) 40%,
                transparent 60%,
                rgba(0,0,0,0.12) 100%
              )
            `,
          }}
        />

        {/* Top-left highlight spot — intensifies on hover */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 ease-out group-hover/rich-button:opacity-100"
          style={{
            opacity: 0.6,
            background:
              "radial-gradient(ellipse 60% 60% at 20% 20%, rgba(255,255,255,0.25), transparent 70%)",
          }}
        />

        {/* Border ring — brighter on top-left, fades on bottom-right */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] border-0 p-[2px]"
          style={{
            backgroundImage: `
              linear-gradient(
                135deg,
                color-mix(in srgb, var(--color-white) 35%, transparent),
                color-mix(in srgb, var(--color-white) 12%, transparent) 50%,
                transparent 100%
              )
            `,
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
          }}
        />

        {/* Shine effect */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 rotate-45 scale-x-50 scale-y-200 rounded-[inherit] blur-md",
            "bg-linear-to-r from-transparent via-white/40 to-transparent dark:via-white/20",
            "-translate-x-full opacity-0 transition-all duration-700 ease-out",
            "group-hover/rich-button:translate-x-full group-hover/rich-button:opacity-100"
          )}
        />

        {/* Content */}
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
      </Comp>
    );
  }
);

RichButton.displayName = "RichButton";

export { RichButton, richButtonVariants };
export default RichButton;
