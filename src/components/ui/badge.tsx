import * as React from "react";
import { cn } from "~/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
}

const variants = {
  default: "bg-white/10 text-white",
  primary: "bg-[#FE2C55] text-white",
  secondary: "bg-[#25F4EE] text-black",
  success: "bg-green-500 text-white",
  warning: "bg-yellow-500 text-black",
  danger: "bg-red-500 text-white",
};

export function Badge({ 
  variant = "default", 
  className, 
  ...props 
}: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
