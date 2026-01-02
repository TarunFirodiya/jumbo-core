"use client";

import { ReactNode, cloneElement, isValidElement, Children } from "react";
import { PageHeader } from "./page-header";
import { PageContentWrapper } from "./page-content-wrapper";
import { PageTabs } from "./page-tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DialogTrigger } from "@/components/ui/dialog";

interface PageLayoutProps {
  title: string;
  description: string;
  action?: ReactNode;
  stats?: ReactNode;
  tabs?: {
    listContent: ReactNode;
    kanbanContent: ReactNode;
    mapContent?: ReactNode;
    defaultValue?: "list" | "kanban" | "map";
    listLabel?: string;
    kanbanLabel?: string;
    mapLabel?: string;
  };
  children?: ReactNode;
}

/**
 * Template component for standard page layouts
 * Handles the common pattern: Header -> Stats -> Tabs -> Content
 * Action button is displayed as a floating round button on the bottom right
 */
export function PageLayout({
  title,
  description,
  action,
  stats,
  tabs,
  children,
}: PageLayoutProps) {
  // Render floating action button
  const renderFloatingAction = () => {
    if (!action) return null;

    // If action is a Dialog, clone it and replace the trigger with a floating button
    if (isValidElement(action)) {
      const childrenArray = Children.toArray((action.props as { children?: React.ReactNode }).children);
      // Find DialogTrigger - usually the first child
      const triggerIndex = childrenArray.findIndex(
        (child) => {
          if (!isValidElement(child)) return false;
          // Check if it has the dialog-trigger data-slot
          const props = child.props as any;
          return props?.["data-slot"] === "dialog-trigger" || child.type === DialogTrigger;
        }
      );

      if (triggerIndex !== -1) {
        // It's a Dialog with DialogTrigger - preserve all Dialog props and replace trigger
        const dialogTrigger = childrenArray[triggerIndex];
        const otherChildren = childrenArray.filter((_, i) => i !== triggerIndex);

        return cloneElement(action as React.ReactElement<any>, {
          ...(action.props as any),
          children: [
            cloneElement(dialogTrigger as React.ReactElement<any>, {
              ...((dialogTrigger as React.ReactElement<any>).props as any),
              asChild: true,
              children: (
                <Button
                  size="icon"
                  className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg h-14 w-14"
                >
                  <Plus className="size-6" />
                  <span className="sr-only">New</span>
                </Button>
              ),
            }),
            ...otherChildren,
          ],
        });
      }

      // If it's a Button with asChild (Link), create a floating button with the Link
      const actionProps = action.props as { asChild?: boolean; children?: React.ReactNode; className?: string };
      if (actionProps?.asChild && isValidElement(actionProps.children)) {
        const linkChild = actionProps.children;
        return (
          <div className="fixed bottom-6 right-6 z-50">
            {cloneElement(linkChild as React.ReactElement<any>, {
              ...((linkChild as React.ReactElement<any>).props as any),
              children: (
                <Button
                  size="icon"
                  className="rounded-full shadow-lg h-14 w-14"
                >
                  <Plus className="size-6" />
                  <span className="sr-only">New</span>
                </Button>
              ),
            })}
          </div>
        );
      }

      // For regular Button, clone and make it floating
      return (
        <div className="fixed bottom-6 right-6 z-50">
          {cloneElement(action as React.ReactElement<any>, {
            ...(action.props as any),
            size: "icon",
            className: `rounded-full shadow-lg h-14 w-14 ${actionProps?.className || ""}`,
          })}
        </div>
      );
    }

    // Fallback: wrap in floating container
    return (
      <div className="fixed bottom-6 right-6 z-50">
        {action}
      </div>
    );
  };

  return (
    <>
      <PageContentWrapper>
        <PageHeader title={title} description={description} />

        {stats && <div>{stats}</div>}

        {tabs ? (
          <PageTabs
            defaultValue={tabs.defaultValue}
            listContent={tabs.listContent}
            kanbanContent={tabs.kanbanContent}
            mapContent={tabs.mapContent}
            listLabel={tabs.listLabel}
            kanbanLabel={tabs.kanbanLabel}
            mapLabel={tabs.mapLabel}
          />
        ) : (
          children
        )}
      </PageContentWrapper>
      {renderFloatingAction()}
    </>
  );
}

