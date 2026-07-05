type BharatTaglineProps = {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
};

const sizeClasses = {
  sm: "text-xs sm:text-sm",
  md: "text-sm sm:text-base",
  lg: "text-base sm:text-lg md:text-xl",
  xl: "font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold tracking-[0.08em]",
};

export function BharatTagline({ className = "", size = "md" }: BharatTaglineProps) {
  return (
    <p
      className={`bharat-tagline-shimmer ${size !== "xl" ? "font-medium tracking-[0.12em]" : ""} ${sizeClasses[size]} ${className}`}
    >
      Built for Bharat, Ready for the World
    </p>
  );
}
