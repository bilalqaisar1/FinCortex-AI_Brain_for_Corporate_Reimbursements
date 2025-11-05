"use client";

import { cn } from "@/lib/utils";

interface AnimatedBackgroundProps {
  className?: string;
  variant?: "default" | "minimal" | "intense";
  shapes?: number;
}

const AnimatedBackground = ({ 
  className, 
  variant = "default",
  shapes = 3 
}: AnimatedBackgroundProps) => {
  const getOpacity = () => {
    switch (variant) {
      case "minimal": return "opacity-5";
      case "intense": return "opacity-20";
      default: return "opacity-10";
    }
  };

  const getShapeCount = () => {
    switch (variant) {
      case "minimal": return 2;
      case "intense": return 5;
      default: return shapes;
    }
  };

  const renderShapes = () => {
    const shapeCount = getShapeCount();
    const shapesArray = [];

    for (let i = 0; i < shapeCount; i++) {
      const isEven = i % 2 === 0;
      const isAccent = i % 3 === 1;
      
      shapesArray.push(
        <div
          key={i}
          className={cn(
            "absolute rounded-full animate-float",
            isEven ? "w-20 h-20" : "w-32 h-32",
            isAccent ? "bg-accent-gradient" : "bg-primary-gradient",
            i === 0 && "left-[10%] top-[20%]",
            i === 1 && "right-[10%] top-[30%]",
            i === 2 && "left-[70%] top-[60%]",
            i === 3 && "left-[20%] top-[70%]",
            i === 4 && "right-[20%] top-[10%]"
          )}
          style={{
            animationDelay: `${i * -5}s`,
            animationDuration: `${20 + i * 5}s`
          }}
        />
      );
    }

    return shapesArray;
  };

  return (
    <div className={cn("fixed inset-0 -z-10", getOpacity(), className)}>
      <div className="absolute inset-0 w-full h-full">
        {renderShapes()}
      </div>
    </div>
  );
};

export default AnimatedBackground;
