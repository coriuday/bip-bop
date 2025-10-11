import * as React from "react";
import { cn } from "~/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

export function Avatar({ 
  src, 
  alt, 
  fallback, 
  size = "md", 
  className,
  ...props 
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 p-[2px]",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <div className="flex h-full w-full items-center justify-center rounded-full bg-black">
        {src && !imageError ? (
          <img
            src={src}
            alt={alt ?? "Avatar"}
            className="h-full w-full rounded-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="font-bold text-white">
            {fallback ?? "?"}
          </span>
        )}
      </div>
    </div>
  );
}
