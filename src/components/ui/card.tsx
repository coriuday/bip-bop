import * as React from "react";
import { cn } from "~/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "gradient";
}

const variants = {
  default: "bg-white/5 border border-white/10",
  glass: "bg-white/5 backdrop-blur-xl border border-white/10",
  gradient: "bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-white/10",
};

export function Card({ 
  variant = "default", 
  className, 
  children,
  ...props 
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-6 transition-all duration-200",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mb-4", className)}
      {...props}
    />
  );
}

export function CardTitle({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-xl font-bold text-white", className)}
      {...props}
    />
  );
}

export function CardDescription({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-white/60", className)}
      {...props}
    />
  );
}

export function CardContent({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("", className)}
      {...props}
    />
  );
}

export function CardFooter({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-4 flex items-center gap-2", className)}
      {...props}
    />
  );
}
