import React from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface DetailLayoutProps {
  /** The top navigation or breadcrumb area */
  header?: React.ReactNode;
  /** Optional header with avatar and action buttons (for mobile-first designs) */
  headerWithAvatar?: React.ReactNode;
  /** The left-side context (Contact info, deal value, tags) */
  overview: React.ReactNode;
  /** The main feed (Activity, Notes, Tasks) */
  content: React.ReactNode;
  /** Optional right-side panel (Related items, etc) - generic slot for future use */
  sidebarRight?: React.ReactNode;
  /** Layout variant: 'sidebar' (default) or 'grid' (for 3-column grid layouts) */
  variant?: "sidebar" | "grid";
  className?: string;
}

export function DetailLayout({
  header,
  headerWithAvatar,
  overview,
  content,
  sidebarRight,
  variant = "sidebar",
  className,
}: DetailLayoutProps) {
  // Grid variant: 3-column grid layout (used by seller detail view)
  if (variant === "grid") {
    return (
      <div className={cn("flex flex-col h-full bg-background text-foreground", className)}>
        {/* Standard Header */}
        {header && !headerWithAvatar && (
          <header className="flex-none border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
            <div className="h-full px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center w-full gap-3 sm:gap-4">
              {header}
            </div>
          </header>
        )}

        {/* Enhanced Header with Avatar (for mobile-first designs) */}
        {headerWithAvatar && (
          <header className="flex-none border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
            <div className="h-full px-3 sm:px-4 md:px-6 py-4 sm:py-6">
              {headerWithAvatar}
            </div>
          </header>
        )}

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 min-h-0 flex-1 p-3 sm:p-4 md:p-6 overflow-hidden">
          {/* Left Column: Overview */}
          <div className="lg:col-span-1 min-h-0 flex flex-col">
            <ScrollArea className="flex-1 pr-2 sm:pr-4">
              <div className="space-y-4 sm:space-y-6">
                {overview}
              </div>
            </ScrollArea>
          </div>

          {/* Right Column: Main Content */}
          <div className="lg:col-span-2 min-h-0 flex flex-col">
            <ScrollArea className="flex-1">
              <div className="space-y-4 sm:space-y-6">
                {content}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    );
  }

  // Sidebar variant: Traditional sidebar layout (used by buyer detail view)
  return (
    <div className={cn("flex flex-col h-full bg-background text-foreground", className)}>
      {/* Header */}
      {header && (
        <header className="flex-none border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
          <div className="h-full px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center w-full gap-3 sm:gap-4">
            {header}
          </div>
        </header>
      )}

      {/* Main Layout Area: Flex container to split columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column: Context/Overview */}
        <aside className="hidden lg:flex flex-col w-[320px] xl:w-[350px] border-r bg-muted/10 shrink-0">
          <ScrollArea className="flex-1">
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {overview}
            </div>
          </ScrollArea>
        </aside>

        {/* Center Column: Main Content (Tabs, Activity Feed) */}
        <main className="flex-1 flex flex-col min-w-0">
          <ScrollArea className="flex-1 h-full">
            <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
              {content}
            </div>
          </ScrollArea>
        </main>

        {/* Optional Right Column: For extra density (like Linear/Apollo) */}
        {sidebarRight && (
          <aside className="hidden xl:flex flex-col w-[280px] 2xl:w-[300px] border-l bg-muted/10 shrink-0">
            <ScrollArea className="flex-1">
              <div className="p-4 sm:p-6">
                {sidebarRight}
              </div>
            </ScrollArea>
          </aside>
        )}
      </div>
    </div>
  );
}
