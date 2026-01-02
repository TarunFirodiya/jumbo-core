"use client";

import { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, List, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageTabsProps {
  defaultValue?: "list" | "kanban" | "map";
  listContent: ReactNode;
  kanbanContent: ReactNode;
  mapContent?: ReactNode;
  listLabel?: string;
  kanbanLabel?: string;
  mapLabel?: string;
  className?: string;
}

/**
 * Standardized tabs component for pages with List/Board/Map views
 */
export function PageTabs({
  defaultValue = "list",
  listContent,
  kanbanContent,
  mapContent,
  listLabel = "List",
  kanbanLabel = "Board",
  mapLabel = "Map",
  className,
}: PageTabsProps) {
  const hasMap = mapContent !== undefined;

  return (
    <Tabs defaultValue={defaultValue} className={className || "w-full"}>
      <div className="flex items-center justify-between mb-4">
        <TabsList className={cn(
          "grid",
          hasMap ? "w-[300px] grid-cols-3" : "w-[200px] grid-cols-2"
        )}>
          <TabsTrigger value="list" className="gap-2">
            <List className="size-4" />
            {listLabel}
          </TabsTrigger>
          <TabsTrigger value="kanban" className="gap-2">
            <LayoutGrid className="size-4" />
            {kanbanLabel}
          </TabsTrigger>
          {hasMap && (
            <TabsTrigger value="map" className="gap-2">
              <MapPin className="size-4" />
              {mapLabel}
            </TabsTrigger>
          )}
        </TabsList>
      </div>

      <TabsContent value="list" className="m-0">
        {listContent}
      </TabsContent>
      <TabsContent value="kanban" className="m-0 h-[calc(100vh-380px)]">
        {kanbanContent}
      </TabsContent>
      {hasMap && (
        <TabsContent value="map" className="m-0 h-[calc(100vh-380px)]">
          {mapContent}
        </TabsContent>
      )}
    </Tabs>
  );
}

