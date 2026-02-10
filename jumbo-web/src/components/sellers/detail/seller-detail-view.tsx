"use client";

import * as React from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  ChevronRight,
  Home,
  Eye,
  Pencil,
  Plus,
  Trash2,
  Globe,
  Calendar,
  User,
  ExternalLink,
  Loader2,
  MessageCircle,
  MessageSquare,
  CheckSquare,
  StickyNote,
  Clock,
  ArrowLeft,
  Image as ImageIcon,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DetailLayout } from "@/components/shared/detail-layout";
import { toast } from "sonner";
import {
  sellerLeadStatusOptions,
  sellerLeadSourceOptions,
  updateSellerLeadSchema,
} from "@/lib/validations/seller";
import type { SellerLeadWithRelations, AuditLogWithRelations } from "@/types";
import { format } from "date-fns";
import { DateTimePicker } from "@/components/ui/date-time-picker";

// Status badge colors
const statusColors: Record<string, { bg: string; text: string }> = {
  new: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
  proposal_sent: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" },
  proposal_accepted: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400" },
  dropped: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
};

// Action icons for audit logs
const actionIcons: Record<string, typeof Eye> = {
  create: Plus,
  update: Pencil,
  delete: Trash2,
};

interface SellerDetailViewProps {
  sellerLead: SellerLeadWithRelations | null;
  id: string;
}

type FormValues = z.infer<typeof updateSellerLeadSchema>;

export function SellerDetailView({ sellerLead, id }: SellerDetailViewProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [auditLogs, setAuditLogs] = React.useState<AuditLogWithRelations[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = React.useState(true);

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

  // Fetch audit logs
  React.useEffect(() => {
    async function fetchAuditLogs() {
      if (!id) return;
      setIsLoadingLogs(true);
      try {
        const response = await fetch(
          `/api/v1/audit-logs?entityType=seller_lead&entityId=${id}`
        );
        if (response.ok) {
          const data = await response.json();
          setAuditLogs(data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch audit logs:", error);
      } finally {
        setIsLoadingLogs(false);
      }
    }
    fetchAuditLogs();
  }, [id]);

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
      const logsResponse = await fetch(
        `/api/v1/audit-logs?entityType=seller_lead&entityId=${id}`
      );
      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setAuditLogs(logsData.data || []);
      }
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

  const statusColor = statusColors[sellerLead.status || "new"];

  // Calculate last contact date from communications
  const lastContactDate = React.useMemo(() => {
    if (sellerLead.communications && sellerLead.communications.length > 0) {
      const sorted = [...sellerLead.communications].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      return sorted[0].createdAt;
    }
    return null;
  }, [sellerLead.communications]);

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
      {sellerLead.listings && sellerLead.listings.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="flex gap-4 p-4 sm:p-6">
            <div className="relative size-20 sm:size-24 rounded-lg overflow-hidden shrink-0 bg-muted">
              {sellerLead.listings[0].images && sellerLead.listings[0].images.length > 0 ? (
                <Image
                  src={sellerLead.listings[0].images[0]}
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
                    {(sellerLead.listings[0] as any).unit?.bhk || sellerLead.unit?.bhk || "N/A"} BHK Apartment
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {(sellerLead.listings[0] as any).unit?.building?.name || sellerLead.building?.name}
                    {((sellerLead.listings[0] as any).unit?.building?.locality || sellerLead.building?.locality) &&
                      ` • ${(sellerLead.listings[0] as any).unit?.building?.locality || sellerLead.building?.locality}`}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {sellerLead.listings[0].status === "inspection_pending"
                    ? "Inspection Pending"
                    : sellerLead.listings[0].status || "Draft"}
                </Badge>
              </div>
              {sellerLead.listings[0].askingPrice && (
                <p className="text-sm font-medium">
                  ${(Number(sellerLead.listings[0].askingPrice) / 1000000).toFixed(1)}M
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
                    Unit {sellerLead.unit.unitNumber} • {sellerLead.unit.bhk} BHK
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
            <span className="hidden sm:inline">Communication</span>
            <span className="sm:hidden">Comm</span>
          </TabsTrigger>
          <TabsTrigger
            value="tasks"
            className="data-[state=active]:bg-muted data-[state=active]:shadow-sm px-2 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap"
          >
            <CheckSquare className="size-3 sm:size-4 mr-1 sm:mr-2" />
            Tasks
          </TabsTrigger>
          <TabsTrigger
            value="listings"
            className="data-[state=active]:bg-muted data-[state=active]:shadow-sm px-2 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap"
          >
            <Home className="size-3 sm:size-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Listings</span>
            <span className="sm:hidden">List</span>
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
        <TabsContent value="activity" className="m-0 h-full">
          <Card className="h-full border-none shadow-sm">
            <CardContent className="p-4 sm:p-6">
              {isLoadingLogs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center text-muted-foreground">
                  <Clock className="size-8 sm:size-12 mb-3 opacity-20" />
                  <p className="text-sm sm:text-base">No activity recorded yet.</p>
                </div>
              ) : (
                <div className="relative border-l border-muted ml-2 sm:ml-4 pl-4 sm:pl-8 space-y-6 sm:space-y-8 pb-4">
                  {auditLogs.map((log) => {
                    const Icon = actionIcons[log.action] || Eye;
                    const actionLabels: Record<string, string> = {
                      create: "Created",
                      update: "Updated",
                      delete: "Deleted",
                    };
                    return (
                      <div key={log.id} className="relative">
                        <div
                          className={cn(
                            "absolute -left-2 sm:-left-4 -translate-x-1/2 top-1 bg-background rounded-full border p-1 sm:p-1.5 z-10 shadow-sm",
                            log.action === "create" && "text-emerald-600",
                            log.action === "update" && "text-blue-600",
                            log.action === "delete" && "text-red-600"
                          )}
                        >
                          <Icon className="size-3 sm:size-4" />
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                            <h4 className="text-sm font-bold text-foreground">
                              {actionLabels[log.action] || log.action}
                            </h4>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {log.createdAt
                                ? new Date(log.createdAt).toLocaleString()
                                : ""}
                            </span>
                          </div>
                          {log.performedBy && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <User className="size-3" />
                              {log.performedBy.fullName}
                            </p>
                          )}
                          {log.changes && Object.keys(log.changes).length > 0 && (
                            <div className="text-xs sm:text-sm text-muted-foreground mt-1 bg-muted/30 p-2 sm:p-3 rounded-md border overflow-x-auto">
                              {Object.entries(log.changes).map(([field, change]) => (
                                <div key={field} className="text-xs break-words">
                                  <span className="font-medium">{field}</span>:{" "}
                                  <span className="line-through opacity-50">
                                    {String(change.old ?? "-")}
                                  </span>{" "}
                                  →{" "}
                                  <span className="font-medium">{String(change.new ?? "-")}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication" className="m-0 h-full">
          <Card className="h-full border-none shadow-sm">
            <CardContent className="p-4 sm:p-6">
              {sellerLead.communications && sellerLead.communications.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {sellerLead.communications.map((comm) => (
                    <div
                      key={comm.id}
                      className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg"
                    >
                      <div className="mt-1 shrink-0">
                        {comm.channel === "call" && (
                          <Phone className="size-4 sm:size-5 text-blue-500" />
                        )}
                        {comm.channel === "email" && (
                          <Mail className="size-4 sm:size-5 text-amber-500" />
                        )}
                        {comm.channel === "whatsapp" && (
                          <MessageCircle className="size-4 sm:size-5 text-green-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <span className="font-semibold text-sm capitalize">
                            {comm.direction} {comm.channel}
                          </span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {comm.createdAt
                              ? new Date(comm.createdAt).toLocaleString()
                              : ""}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                          {comm.content || "No content provided"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center text-muted-foreground">
                  <MessageSquare className="size-8 sm:size-12 mb-3 opacity-20" />
                  <p className="text-sm sm:text-base">No communication history found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="m-0 h-full">
          <Card className="h-full border-none shadow-sm">
            <CardContent className="p-4 sm:p-6">
              {sellerLead.tasks && sellerLead.tasks.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {sellerLead.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg"
                    >
                      <div
                        className={cn(
                          "mt-1 p-1 rounded-full shrink-0",
                          task.status === "completed"
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-400"
                        )}
                      >
                        <CheckSquare className="size-3 sm:size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                          <h4
                            className={cn(
                              "font-medium text-sm sm:text-base break-words",
                              task.status === "completed" && "line-through text-muted-foreground"
                            )}
                          >
                            {task.title}
                          </h4>
                          <Badge
                            variant={task.priority === "urgent" ? "destructive" : "secondary"}
                            className="w-fit text-xs"
                          >
                            {task.priority}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                          {task.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 whitespace-nowrap">
                            <Calendar className="size-3" /> Due:{" "}
                            {task.dueAt
                              ? new Date(task.dueAt).toLocaleDateString()
                              : "No date"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center text-muted-foreground">
                  <CheckSquare className="size-8 sm:size-12 mb-3 opacity-20" />
                  <p className="text-sm sm:text-base">No tasks created yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="listings" className="m-0 h-full">
          <Card className="h-full border-none shadow-sm">
            <CardContent className="p-4 sm:p-6">
              {sellerLead.listings && sellerLead.listings.length > 0 ? (
                <div className="space-y-4">
                  {sellerLead.listings.map((listing) => (
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
                          <h3 className="font-semibold text-sm truncate">
                            {(listing as any).unit?.bhk || sellerLead.unit?.bhk || "N/A"} BHK Apartment
                          </h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {(listing as any).unit?.building?.name || sellerLead.building?.name}
                            {((listing as any).unit?.building?.locality || sellerLead.building?.locality) &&
                              ` • ${(listing as any).unit?.building?.locality || sellerLead.building?.locality}`}
                          </p>
                          {listing.askingPrice && (
                            <p className="text-sm font-medium mt-1">
                              ${(Number(listing.askingPrice) / 1000000).toFixed(1)}M
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

        <TabsContent value="notes" className="m-0 h-full">
          <Card className="h-full border-none shadow-sm">
            <CardContent className="p-4 sm:p-6">
            </CardContent>
          </Card>
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
