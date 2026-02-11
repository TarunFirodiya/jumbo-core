"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Phone,
  Mail,
  Pencil,
  Home,
  Calendar,
  Loader2,
  MessageCircle,
  MessageSquare,
  CheckSquare,
  StickyNote,
  Clock,
  ArrowLeft,
  Image as ImageIcon,
  Plus,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { DetailLayout } from "@/components/shared/detail-layout";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { NotesTab, TasksTab, ActivityTab, CommunicationTab } from "@/components/shared/tabs";
import { toast } from "sonner";
import {
  sellerLeadStatusOptions,
  sellerLeadSourceOptions,
  updateSellerLeadSchema,
} from "@/lib/validations/seller";
import type { SellerLeadWithRelations, TaskItem, CommunicationItem, ListingWithRelations } from "@/types";

// Status badge colors
const statusColors: Record<string, { bg: string; text: string }> = {
  new: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
  proposal_sent: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" },
  proposal_accepted: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400" },
  dropped: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
};

interface SellerDetailViewProps {
  sellerLead: SellerLeadWithRelations | null;
  id: string;
  agentId: string;
  tasks: TaskItem[];
  communications: CommunicationItem[];
  listings: ListingWithRelations[];
}

type FormValues = z.infer<typeof updateSellerLeadSchema>;

export function SellerDetailView({
  sellerLead,
  id,
  agentId,
  tasks: initialTasks,
  communications,
  listings,
}: SellerDetailViewProps) {
  const [isSaving, setIsSaving] = React.useState(false);

  // Contact info comes from the linked contact record
  const contactName = (sellerLead as any)?.contact?.name || "";
  const contactPhone = (sellerLead as any)?.contact?.phone || "";
  const contactEmail = (sellerLead as any)?.contact?.email || "";

  const form = useForm<FormValues>({
    resolver: zodResolver(updateSellerLeadSchema),
    defaultValues: {
      name: contactName,
      phone: contactPhone,
      email: contactEmail,
      status: sellerLead?.status || "new",
      source: sellerLead?.source,
      sourceUrl: sellerLead?.sourceUrl || "",
      isNri: sellerLead?.isNri || false,
      followUpDate: sellerLead?.followUpDate
        ? new Date(sellerLead.followUpDate).toISOString().slice(0, 16)
        : "",
    },
  });

  async function onSubmit(data: FormValues) {
    setIsSaving(true);
    try {
      const payload = {
        ...data,
        followUpDate: data.followUpDate ? new Date(data.followUpDate).toISOString() : null,
      };

      const response = await fetch(`/api/v1/seller-leads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update seller lead");
      }

      toast.success("Seller lead updated successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (!sellerLead) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Seller Lead not found</h2>
          <p className="text-muted-foreground">
            The seller lead with ID {id} does not exist.
          </p>
          <Button asChild className="mt-4">
            <Link href="/sellers">Back to Sellers</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Calculate last contact date from communications
  const lastContactDate = React.useMemo(() => {
    if (communications && communications.length > 0) {
      const sorted = [...communications].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      return sorted[0].createdAt;
    }
    return null;
  }, [communications]);

  const lastContactText = lastContactDate
    ? formatDistanceToNow(new Date(lastContactDate), { addSuffix: true })
    : "Never";

  // Header with Avatar and Actions
  const headerWithAvatar = (
    <div className="flex flex-col gap-4">
      {/* Navigation and Actions Row */}
      <div className="flex items-center justify-between">
        <Link
          href="/sellers"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Sellers</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" asChild className="flex-shrink-0">
            <Link href="/sellers">Cancel</Link>
          </Button>
          <Button type="submit" size="sm" disabled={isSaving} className="flex-shrink-0">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <span className="hidden sm:inline">{isSaving ? "Saving..." : "Save Changes"}</span>
            <span className="sm:hidden">{isSaving ? "Saving..." : "Save"}</span>
          </Button>
        </div>
      </div>

      {/* Avatar, Name, and Action Buttons */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <Avatar className="size-16 sm:size-20 border-4 border-background shadow-lg shrink-0">
            <AvatarFallback className="text-2xl sm:text-3xl font-bold">
              {(contactName || "?")
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold truncate">{contactName || "Unknown"}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Last Contact: {lastContactText}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            asChild
            size="sm"
            variant="outline"
            className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950"
          >
            <a
              href={`https://wa.me/91${(contactPhone || "").replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="size-4 sm:size-5" />
            </a>
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href={`tel:${contactPhone}`}>
              <Phone className="size-4 sm:size-5" />
            </a>
          </Button>
          {contactEmail && (
            <Button asChild size="sm" variant="outline">
              <a href={`mailto:${contactEmail}`}>
                <Mail className="size-4 sm:size-5" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  // Overview Card
  const overview = (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Status */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Status
            </label>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => {
                const currentStatus = field.value || sellerLead.status || "new";
                const currentStatusColor = statusColors[currentStatus] || statusColors.new;
                return (
                  <FormItem>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={currentStatus || "new"}
                    >
                      <FormControl>
                        <SelectTrigger className="h-auto p-0 border-0 bg-transparent hover:bg-transparent shadow-none focus:ring-0 w-fit group">
                          <SelectValue>
                            <Badge
                              className={cn(
                                currentStatusColor?.bg,
                                currentStatusColor?.text,
                                "cursor-pointer group-hover:opacity-80 transition-opacity",
                                "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium"
                              )}
                            >
                              {sellerLeadStatusOptions.find((s) => s.value === currentStatus)
                                ?.label || currentStatus}
                              <Pencil className="size-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sellerLeadStatusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>

          {/* Assigned To */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Assigned To
            </label>
            <div className="flex items-center gap-2">
              {sellerLead.assignedTo ? (
                <>
                  <Avatar className="size-6">
                    <AvatarFallback className="text-xs">
                      {sellerLead.assignedTo.fullName
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .slice(0, 2) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{sellerLead.assignedTo.fullName}</span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Unassigned</span>
              )}
            </div>
          </div>

          {/* Next Follow Up */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Next Follow Up
            </label>
            <FormField
              control={form.control}
              name="followUpDate"
              render={({ field }) => {
                const dateValue = field.value ? new Date(field.value) : undefined;
                return (
                  <FormItem>
                    <FormControl>
                      <DateTimePicker
                        date={dateValue}
                        setDate={(date) => {
                          if (date) {
                            const isoString = date.toISOString();
                            field.onChange(isoString.slice(0, 16));
                          } else {
                            field.onChange("");
                          }
                        }}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>

          {/* Source */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Source
            </label>
            <Badge variant="outline" className="px-3 py-1.5 text-sm">
              {sellerLeadSourceOptions.find((s) => s.value === sellerLead.source)?.label ||
                sellerLead.source}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Listing Interest Card */}
      {listings.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="flex gap-4 p-4 sm:p-6">
            <div className="relative size-20 sm:size-24 rounded-lg overflow-hidden shrink-0 bg-muted">
              {listings[0].images && listings[0].images.length > 0 ? (
                <Image
                  src={listings[0].images[0]}
                  alt="Listing"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="size-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm sm:text-base truncate">
                    {listings[0].unit?.bhk || sellerLead.unit?.bhk || "N/A"} BHK Apartment
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {listings[0].unit?.building?.name || sellerLead.building?.name}
                    {(listings[0].unit?.building?.locality || sellerLead.building?.locality) &&
                      ` \u2022 ${listings[0].unit?.building?.locality || sellerLead.building?.locality}`}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {listings[0].status === "inspection_pending"
                    ? "Inspection Pending"
                    : listings[0].status || "Draft"}
                </Badge>
              </div>
              {listings[0].askingPrice && (
                <p className="text-sm font-medium">
                  \u20B9{(Number(listings[0].askingPrice) / 100000).toFixed(1)}L
                </p>
              )}
            </div>
          </div>
        </Card>
      ) : sellerLead.building ? (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Interested In
              </label>
              <div className="space-y-1">
                <p className="text-sm font-medium">{sellerLead.building.name}</p>
                {sellerLead.unit && (
                  <p className="text-xs text-muted-foreground">
                    Unit {sellerLead.unit.unitNumber} \u2022 {sellerLead.unit.bhk} BHK
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );

  // Content (Tabs)
  const content = (
    <Tabs defaultValue="activity" className="w-full h-full flex flex-col min-h-0">
      <div className="bg-card rounded-lg border p-1 mb-4 overflow-x-auto">
        <TabsList className="w-full justify-start h-auto bg-transparent p-0 gap-1 sm:gap-2 min-w-max sm:min-w-0">
          <TabsTrigger
            value="activity"
            className="data-[state=active]:bg-muted data-[state=active]:shadow-sm px-2 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap"
          >
            <Clock className="size-3 sm:size-4 mr-1 sm:mr-2" />
            Activity
          </TabsTrigger>
          <TabsTrigger
            value="communication"
            className="data-[state=active]:bg-muted data-[state=active]:shadow-sm px-2 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap"
          >
            <MessageSquare className="size-3 sm:size-4 mr-1 sm:mr-2" />
            Communication
          </TabsTrigger>
          <TabsTrigger
            value="tasks"
            className="data-[state=active]:bg-muted data-[state=active]:shadow-sm px-2 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap"
          >
            <CheckSquare className="size-3 sm:size-4 mr-1 sm:mr-2" />
            Tasks
            {initialTasks.filter((t) => t.status !== "completed").length > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                {initialTasks.filter((t) => t.status !== "completed").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="listings"
            className="data-[state=active]:bg-muted data-[state=active]:shadow-sm px-2 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap"
          >
            <Home className="size-3 sm:size-4 mr-1 sm:mr-2" />
            Listings
            {listings.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                {listings.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="data-[state=active]:bg-muted data-[state=active]:shadow-sm px-2 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap"
          >
            <StickyNote className="size-3 sm:size-4 mr-1 sm:mr-2" />
            Notes
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="flex-1 overflow-y-auto pr-0 sm:pr-1 pb-4 sm:pb-10 min-h-0">
        {/* ============ ACTIVITY TAB ============ */}
        <TabsContent value="activity" className="m-0 h-full">
          <ActivityTab entityType="seller_lead" entityId={id} />
        </TabsContent>

        {/* ============ COMMUNICATION TAB ============ */}
        <TabsContent value="communication" className="m-0 h-full">
          <CommunicationTab
            entityType="seller_lead"
            entityId={id}
            agentId={agentId}
            communications={communications}
          />
        </TabsContent>

        {/* ============ TASKS TAB ============ */}
        <TabsContent value="tasks" className="m-0 h-full">
          <TasksTab
            entityType="seller_lead"
            entityId={id}
            initialTasks={initialTasks}
          />
        </TabsContent>

        {/* ============ LISTINGS TAB ============ */}
        <TabsContent value="listings" className="m-0 h-full">
          <Card className="h-full border-none shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold">Listings</h3>
                <Button asChild size="sm" className="gap-1.5">
                  <Link href={`/listings/new${sellerLead.buildingId ? `?buildingId=${sellerLead.buildingId}` : ""}${sellerLead.unitId ? `&unitId=${sellerLead.unitId}` : ""}`}>
                    <Plus className="size-4" />
                    Add Listing
                  </Link>
                </Button>
              </div>
              {listings.length > 0 ? (
                <div className="space-y-4">
                  {listings.map((listing) => (
                    <Card key={listing.id} className="overflow-hidden">
                      <div className="flex gap-4 p-4">
                        <div className="relative size-20 rounded-lg overflow-hidden shrink-0 bg-muted">
                          {listing.images && listing.images.length > 0 ? (
                            <Image
                              src={listing.images[0]}
                              alt="Listing"
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <ImageIcon className="size-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-sm truncate">
                                {listing.unit?.bhk || sellerLead.unit?.bhk || "N/A"} BHK Apartment
                              </h3>
                              <p className="text-xs text-muted-foreground truncate">
                                {listing.unit?.building?.name || sellerLead.building?.name}
                                {(listing.unit?.building?.locality || sellerLead.building?.locality) &&
                                  ` \u2022 ${listing.unit?.building?.locality || sellerLead.building?.locality}`}
                              </p>
                            </div>
                            <Badge variant="secondary" className="shrink-0">
                              {listing.status === "inspection_pending"
                                ? "Inspection Pending"
                                : listing.status || "Draft"}
                            </Badge>
                          </div>
                          {listing.askingPrice && (
                            <p className="text-sm font-medium mt-1">
                              \u20B9{(Number(listing.askingPrice) / 100000).toFixed(1)}L
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center text-muted-foreground">
                  <Home className="size-8 sm:size-12 mb-3 opacity-20" />
                  <p className="text-sm sm:text-base">No listings associated with this lead.</p>
                  {sellerLead.building && (
                    <div className="mt-4 text-left max-w-md mx-auto bg-muted/20 p-3 sm:p-4 rounded-lg w-full">
                      <p className="text-xs sm:text-sm font-semibold mb-2">Interested in:</p>
                      <p className="text-xs sm:text-sm break-words">
                        <strong>Building:</strong> {sellerLead.building.name}
                      </p>
                      {sellerLead.unit && (
                        <p className="text-xs sm:text-sm mt-1 break-words">
                          <strong>Unit:</strong> {sellerLead.unit.unitNumber} ({sellerLead.unit.bhk}{" "}
                          BHK)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ NOTES TAB ============ */}
        <TabsContent value="notes" className="m-0 h-full">
          <NotesTab entityType="seller_lead" entityId={id} />
        </TabsContent>
      </div>
    </Tabs>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col">
        <DetailLayout
          variant="grid"
          headerWithAvatar={headerWithAvatar}
          overview={overview}
          content={content}
        />
      </form>
    </Form>
  );
}
