import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="h1">{title}</h1>
        <p className="p1">{description}</p>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

