import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContentWrapperProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper component for page content that provides consistent spacing
 * between sections. Use this for pages that are rendered within the
 * dashboard layout (which already provides the main wrapper and padding).
 */
export function PageContentWrapper({ children, className }: PageContentWrapperProps) {
  return (
    <div className={cn("space-y-4 sm:space-y-6", className)}>
      {children}
    </div>
  );
}

