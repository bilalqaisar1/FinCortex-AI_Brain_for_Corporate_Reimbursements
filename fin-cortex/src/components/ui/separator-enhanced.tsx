"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"
import { cn } from "@/lib/utils"

interface EnhancedSeparatorProps extends React.ComponentProps<typeof SeparatorPrimitive.Root> {
  variant?: "default" | "gradient" | "subtle" | "accent";
  thickness?: "thin" | "medium" | "thick";
  animated?: boolean;
}

const EnhancedSeparator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  EnhancedSeparatorProps
>(({ 
  className, 
  orientation = "horizontal", 
  decorative = true,
  variant = "default",
  thickness = "thin",
  animated = false,
  ...props 
}, ref) => {
  const variantClasses = {
    default: "separator-subtle",
    gradient: "separator-gradient", 
    accent: "separator-accent",
    subtle: "separator-subtle"
  };

  const thicknessClasses = {
    thin: "separator-thin",
    medium: "separator-medium", 
    thick: "separator-thick"
  };

  const animationClasses = animated 
    ? "transition-all duration-300 hover:shadow-sm hover:shadow-blue-500/20" 
    : "";

  return (
    <SeparatorPrimitive.Root
      ref={ref}
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        // Base Radix styles for accessibility
        "shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        // Custom app theme styles
        "separator",
        variantClasses[variant],
        thicknessClasses[thickness], 
        animationClasses,
        className
      )}
      {...props}
    />
  )
})

EnhancedSeparator.displayName = "EnhancedSeparator"

export { EnhancedSeparator }