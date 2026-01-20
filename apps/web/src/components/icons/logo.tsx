import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: {
    icon: "h-5 w-5",
    container: "h-8 w-8",
    text: "text-lg",
    blur: "blur-md",
  },
  md: {
    icon: "h-6 w-6",
    container: "h-10 w-10",
    text: "text-xl",
    blur: "blur-lg",
  },
  lg: {
    icon: "h-8 w-8",
    container: "h-14 w-14",
    text: "text-2xl",
    blur: "blur-xl",
  },
};

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const config = sizeConfig[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative">
        <div
          className={cn(
            "flex items-center justify-center rounded-xl",
            "bg-gradient-to-br from-[oklch(0.75_0.15_195)] to-[oklch(0.6_0.18_200)]",
            "neon-glow-subtle",
            config.container
          )}
        >
          <Play
            className={cn(config.icon, "text-white fill-white/90 ml-0.5")}
          />
        </div>
        <div
          className={cn(
            "absolute inset-0 rounded-xl",
            "bg-[oklch(0.75_0.15_195)]",
            config.blur,
            "opacity-40 -z-10"
          )}
        />
      </div>
      {showText && (
        <span
          className={cn(
            "font-bold tracking-tight text-white",
            config.text
          )}
        >
          WatchParty
        </span>
      )}
    </div>
  );
}
