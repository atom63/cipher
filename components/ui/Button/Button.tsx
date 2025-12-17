import { forwardRef } from "react";
import type React from "react";
import styles from "./Button.module.css";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "secondary" | "ghost" | "destructive" | "outline" | "link";
  size?: "sm" | "md" | "lg" | "icon";
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "default",
      size = "md",
      className = "",
      children,
      disabled,
      ...props
    },
    ref
  ) {
    const baseStyles = styles.button;
    const variantStyles = {
      default: styles.default,
      primary: styles.primary,
      secondary: styles.secondary,
      ghost: styles.ghost,
      destructive: styles.destructive,
      outline: styles.outline,
      link: styles.link,
    };
    const sizeStyles = {
      sm: styles.sm,
      md: styles.md,
      lg: styles.lg,
      icon: styles.icon,
    };

    const classes = [
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button type="button" ref={ref} className={classes} disabled={disabled} {...props}>
        {children}
      </button>
    );
  }
)

