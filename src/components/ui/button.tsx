import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "~/lib/utils";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const variants = {
  primary: "bg-[#FE2C55] hover:bg-[#FE2C55]/90 text-white font-semibold shadow-lg shadow-[#FE2C55]/20",
  secondary: "bg-white/10 hover:bg-white/20 text-white font-medium backdrop-blur-sm",
  ghost: "hover:bg-white/10 text-white",
  outline: "border border-white/20 hover:bg-white/10 text-white backdrop-blur-sm",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs rounded-md",
  md: "px-6 py-2 text-sm rounded-lg",
  lg: "px-8 py-3 text-base rounded-xl",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = "primary", 
    size = "md", 
    isLoading, 
    className, 
    children,
    disabled,
    ...props 
  }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled ?? isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled ?? isLoading ? 1 : 0.98 }}
        className={cn(
          "inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled ?? isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-4 w-4 border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full"
            />
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
