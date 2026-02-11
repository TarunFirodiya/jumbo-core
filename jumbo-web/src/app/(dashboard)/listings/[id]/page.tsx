import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import * as listingService from "@/services/listing.service";
import * as taskService from "@/services/task.service";
import { requireAuth } from "@/lib/auth";
import { ListingDetailView } from "@/components/listings/detail/listing-detail-view";
import type { TaskItem } from "@/types";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Validate UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Invalid Listing ID</h2>
          <p className="text-muted-foreground">The listing ID format is invalid.</p>
          <Button asChild className="mt-4">
            <Link href="/listings">Back to Listings</Link>
          </Button>
        </div>
      </div>
    );
  }

  const [listing, { profile }, tasksData] = await Promise.all([
    listingService.getListingByIdWithRelations(id),
    requireAuth(),
    taskService.getTasksByListingId(id),
  ]);

  if (!listing) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Listing not found</h2>
          <p className="text-muted-foreground">The listing with ID {id} does not exist.</p>
          <Button asChild className="mt-4">
            <Link href="/listings">Back to Listings</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Serialize tasks for client component
  const tasks: TaskItem[] = tasksData.map((t: any) => ({
    id: t.id,
    title: t.title,
    description: t.description || "",
    priority: t.priority || "medium",
    status: t.status || "open",
    dueAt: t.dueAt ? new Date(t.dueAt).toISOString() : null,
    completedAt: t.completedAt ? new Date(t.completedAt).toISOString() : null,
    creatorName: t.creator?.fullName || "",
    assigneeName: t.assignee?.fullName || "",
  }));

  const agentId = profile.id;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Back Navigation */}
      <div>
        <Button variant="ghost" size="sm" asChild className="pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground">
          <Link href="/listings">
            <ChevronLeft className="size-4 mr-1" />
            Back to Listings
          </Link>
        </Button>
      </div>

      <ListingDetailView
        listing={JSON.parse(JSON.stringify(listing))}
        agentId={agentId}
        tasks={tasks}
      />
    </div>
  );
}
