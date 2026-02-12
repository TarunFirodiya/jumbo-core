"use client";

import * as React from "react";
import Link from "next/link";
import {
  Phone,
  MapPin,
  Mail,
  ChevronRight,
  Save,
  Loader2,
  MessageSquare,
  Calendar,
  Star,
  Clock,
  FileText,
  CheckSquare,
  StickyNote,
  Plus,
  Home,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DetailLayout } from "@/components/shared/detail-layout";
import { StatusBadge } from "@/components/ui/status-badge";
import { TagInput } from "@/components/ui/tag-input";
import { BuildingMultiSelect } from "@/components/ui/building-multi-select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/ui/date-time-picker";

import { NotesTab, TasksTab, ActivityTab, CommunicationTab } from "@/components/shared/tabs";

import { updateBuyer, createVisit } from "@/lib/actions";
import type { TaskItem } from "@/types";
import { toast } from "sonner";

// ============================================
// TYPES
// ============================================

export interface BuyerDetail {
  id: string;
  name: string;
  status: string;
  stage: string;
  addedDate: string;

  contact: { mobile: string; email: string; whatsapp: string };

  source: string;
  locality: string;
  zone: string;
  pipeline: boolean;
  dropReason: string;
  referredBy: string;
  lastContactedAt: string;

  meta: {
    leadId: string;
    externalId: string;
    sourceListingId: string;
    testListingId: string;
    createdBy: string;
    updatedAt: string;
    createdAt: string;
  };

  assignedAgent: { name: string; avatar?: string; initials: string };

  requirements: {
    budgetMin: number | null;
    budgetMax: number | null;
    bhk: number[];
    localities: string[];
  };

  preferences: {
    configuration: string[];
    maxCap: string;
    landmark: string;
    propertyType: string;
    floorPreference: string;
    khata: string;
    mainDoorFacing: string;
    mustHaves: string[];
    buyReason: string;
    preferredBuildings: string[];
  };

  visits: {
    id: string;
    scheduledAt: string;
    status: string;
    listingId: string;
    visitorName: string;
    feedbackRating: number | null;
    assignedVaName: string;
  }[];

  communications: {
    id: string;
    channel: string;
    direction: string;
    content: string;
    createdAt: string;
  }[];

  activityLog: {
    type: string;
    title: string;
    date: string;
    description?: string;
    iconName?: string;
  }[];
}

interface BuyerDetailViewProps {
  buyer: BuyerDetail | null;
  id: string;
  agentId: string;
  tasks: TaskItem[];
}

// ============================================
// FORM SCHEMA
// ============================================

const buyerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  mobile: z.string().optional(),
  whatsapp: z.string().optional(),
  locality: z.string().optional(),
  zone: z.string().optional(),
  pipeline: z.boolean(),
  dropReason: z.string().optional(),
  referredBy: z.string().optional(),
  budgetMin: z.number().nullable(),
  budgetMax: z.number().nullable(),
  bhk: z.array(z.number()),
  localities: z.array(z.string()),
  propertyType: z.string().optional(),
  configuration: z.array(z.string()),
  maxCap: z.string().optional(),
  landmark: z.string().optional(),
  floorPreference: z.string().optional(),
  khata: z.string().optional(),
  mainDoorFacing: z.string().optional(),
  mustHaves: z.array(z.string()),
  buyReason: z.string().optional(),
  preferredBuildings: z.array(z.string()),
});

type BuyerFormValues = z.infer<typeof buyerFormSchema>;

// ============================================
// CONSTANTS
// ============================================

const BHK_OPTIONS = [1, 2, 3, 4, 5];

const FLOOR_PREFERENCE_OPTIONS = [
  { value: "lower", label: "Lower" },
  { value: "middle", label: "Middle" },
  { value: "top", label: "Top" },
];

const KHATA_OPTIONS = [
  { value: "khata_a", label: "Khata A" },
  { value: "khata_b", label: "Khata B" },
];


// ============================================
// COMPONENT
// ============================================

// ============================================
// LISTING OPTION TYPE
// ============================================

interface ListingOption {
  id: string;
  jumboId: string | null;
  status: string | null;
  price: string | null;
  unitNumber: string | null;
  bhk: number | null;
  floor: number | null;
  size: number | null;
  buildingName: string | null;
  locality: string | null;
}

export function BuyerDetailView({ buyer, id, agentId, tasks: initialTasks }: BuyerDetailViewProps) {
  const [isSaving, setIsSaving] = React.useState(false);

  // ── Schedule Visit Modal State ──
  const [scheduleVisitOpen, setScheduleVisitOpen] = React.useState(false);
  const [scheduleDate, setScheduleDate] = React.useState<Date | undefined>(undefined);
  const [selectedListingId, setSelectedListingId] = React.useState("");
  const [liveListings, setLiveListings] = React.useState<ListingOption[]>([]);
  const [isLoadingListings, setIsLoadingListings] = React.useState(false);
  const [isScheduling, setIsScheduling] = React.useState(false);

  // Fetch active listings when modal opens
  React.useEffect(() => {
    if (!scheduleVisitOpen) return;
    let cancelled = false;
    async function fetchListings() {
      setIsLoadingListings(true);
      try {
        const res = await fetch("/api/v1/visits/options");
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) {
            setLiveListings(json.data?.listings ?? []);
          }
        }
      } catch (err) {
        console.error("Failed to fetch listings:", err);
      } finally {
        if (!cancelled) setIsLoadingListings(false);
      }
    }
    fetchListings();
    return () => { cancelled = true; };
  }, [scheduleVisitOpen]);

  async function handleScheduleVisit() {
    if (!selectedListingId) {
      toast.error("Please select a listing");
      return;
    }
    if (!scheduleDate) {
      toast.error("Please pick a date and time");
      return;
    }
    setIsScheduling(true);
    try {
      const result = await createVisit({
        leadId: id,
        listingId: selectedListingId,
        scheduledAt: scheduleDate,
      });
      if (result.success) {
        toast.success(result.message || "Visit scheduled successfully");
        setScheduleVisitOpen(false);
        setScheduleDate(undefined);
        setSelectedListingId("");
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to schedule visit");
    } finally {
      setIsScheduling(false);
    }
  }

  const form = useForm<BuyerFormValues>({
    resolver: zodResolver(buyerFormSchema),
    defaultValues: {
      name: buyer?.name || "",
      email: buyer?.contact?.email || "",
      mobile: buyer?.contact?.mobile || "",
      whatsapp: buyer?.contact?.whatsapp || "",
      locality: buyer?.locality || "",
      zone: buyer?.zone || "",
      pipeline: buyer?.pipeline ?? false,
      dropReason: buyer?.dropReason || "",
      referredBy: buyer?.referredBy || "",
      budgetMin: buyer?.requirements?.budgetMin ?? null,
      budgetMax: buyer?.requirements?.budgetMax ?? null,
      bhk: buyer?.requirements?.bhk ?? [],
      localities: buyer?.requirements?.localities ?? [],
      propertyType: buyer?.preferences?.propertyType || "",
      configuration: buyer?.preferences?.configuration ?? [],
      maxCap: buyer?.preferences?.maxCap || "",
      landmark: buyer?.preferences?.landmark || "",
      floorPreference: buyer?.preferences?.floorPreference || "",
      khata: buyer?.preferences?.khata || "",
      mainDoorFacing: buyer?.preferences?.mainDoorFacing || "",
      mustHaves: buyer?.preferences?.mustHaves ?? [],
      buyReason: buyer?.preferences?.buyReason || "",
      preferredBuildings: buyer?.preferences?.preferredBuildings ?? [],
    },
  });

  async function onSubmit(data: BuyerFormValues) {
    setIsSaving(true);
    try {
      const result = await updateBuyer(id, {
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        whatsapp: data.whatsapp,
        locality: data.locality,
        zone: data.zone,
        pipeline: data.pipeline,
        dropReason: data.dropReason,
        referredBy: data.referredBy,
        budget_min: data.budgetMin ?? undefined,
        budget_max: data.budgetMax ?? undefined,
        bhk: data.bhk,
        localities: data.localities,
        propertyType: data.propertyType,
        configuration: data.configuration,
        maxCap: data.maxCap,
        landmark: data.landmark,
        floorPreference: data.floorPreference,
        khata: data.khata,
        mainDoorFacing: data.mainDoorFacing,
        mustHaves: data.mustHaves,
        buyReason: data.buyReason,
        preferredBuildings: data.preferredBuildings,
      });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  }

  if (!buyer) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Buyer not found</h2>
          <p className="text-muted-foreground">The buyer with ID {id} does not exist.</p>
          <Button asChild className="mt-4">
            <Link href="/buyers">Back to Buyers</Link>
          </Button>
        </div>
      </div>
    );
  }

  const openTasks = initialTasks.filter((t) => t.status !== "completed");

  // ============================================
  // SIDEBAR
  // ============================================

  const Overview = (
    <Card className="h-full border-none shadow-none bg-transparent p-0">
      <div className="space-y-6">
        {/* Profile Card */}
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <Avatar className="size-24 mx-auto border-4 border-background shadow-md">
              <AvatarFallback className="text-2xl font-bold">
                {buyer.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{buyer.name}</h2>
              {(buyer.locality || buyer.zone) && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground mt-1 text-sm">
                  <MapPin className="size-4" />
                  <span>{[buyer.locality, buyer.zone].filter(Boolean).join(", ")}</span>
                </div>
              )}
              <div className="flex items-center justify-center gap-2 mt-2">
                {buyer.source && (
                  <Badge variant="secondary">{buyer.source}</Badge>
                )}
                <Badge variant={buyer.pipeline ? "default" : "outline"}>
                  {buyer.pipeline ? "Pipeline" : "Not in Pipeline"}
                </Badge>
              </div>
            </div>
          </CardContent>
          <div className="border-t p-4 bg-muted/20">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Stage</div>
                <div className="mt-1.5">
                  <StatusBadge status={buyer.stage} />
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Agent</div>
                <div className="text-sm font-medium mt-1 truncate">{buyer.assignedAgent.name}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Contact Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Contact Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full text-primary">
                <Phone className="size-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Mobile</p>
                <p className="text-sm font-medium">{buyer.contact.mobile || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full text-primary">
                <Mail className="size-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium truncate w-40">{buyer.contact.email || "—"}</p>
              </div>
            </div>
            {buyer.lastContactedAt && (
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full text-primary">
                  <Calendar className="size-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Last Contacted</p>
                  <p className="text-sm font-medium">{buyer.lastContactedAt}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lead Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Lead Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {buyer.meta.leadId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lead ID</span>
                <span className="font-medium font-mono text-xs">{buyer.meta.leadId}</span>
              </div>
            )}
            {buyer.meta.externalId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">External ID</span>
                <span className="font-medium font-mono text-xs">{buyer.meta.externalId}</span>
              </div>
            )}
            {buyer.meta.sourceListingId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source Listing</span>
                <span className="font-medium font-mono text-xs">{buyer.meta.sourceListingId}</span>
              </div>
            )}
            {buyer.referredBy && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Referred By</span>
                <span className="font-medium">{buyer.referredBy}</span>
              </div>
            )}
            {buyer.meta.createdBy && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created By</span>
                <span className="font-medium">{buyer.meta.createdBy}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span className="font-medium">{buyer.meta.createdAt}</span>
            </div>
            {buyer.meta.updatedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span className="font-medium">{buyer.meta.updatedAt}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Card>
  );

  // ============================================
  // RENDER
  // ============================================

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="h-full">
        <DetailLayout
          header={
            <>
              <div className="flex items-center text-sm text-muted-foreground min-w-0">
                <Link href="/buyers" className="hover:text-foreground transition-colors truncate">Buyers</Link>
                <ChevronRight className="size-4 mx-1 shrink-0" />
                <span className="text-foreground font-medium truncate">{buyer.name}</span>
              </div>
              <div className="flex items-center justify-end gap-2 shrink-0">
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link href="/buyers">Cancel</Link>
                </Button>
                <Button type="submit" size="sm" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-1" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="size-4 mr-1" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </>
          }
          overview={Overview}
          content={
            <Card className="h-full border-none shadow-none bg-transparent p-0">
              <Tabs defaultValue="details" className="w-full">
                <ScrollArea className="w-full">
                  <TabsList className="gap-4">
                    <TabsTrigger value="details" className="py-3 gap-1.5">
                      <FileText className="size-4" />
                      Details
                    </TabsTrigger>
                    <TabsTrigger value="tasks" className="py-3 gap-1.5">
                      <CheckSquare className="size-4" />
                      Tasks
                      {openTasks.length > 0 && (
                        <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{openTasks.length}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="visits" className="py-3 gap-1.5">
                      <Calendar className="size-4" />
                      Visits
                      {buyer.visits.length > 0 && (
                        <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{buyer.visits.length}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="communications" className="py-3 gap-1.5">
                      <MessageSquare className="size-4" />
                      Communication
                      {buyer.communications.length > 0 && (
                        <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{buyer.communications.length}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="py-3 gap-1.5">
                      <Clock className="size-4" />
                      Activity
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="py-3 gap-1.5">
                      <StickyNote className="size-4" />
                      Notes
                    </TabsTrigger>
                  </TabsList>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>

                <div className="py-6">
                  {/* ============ DETAILS TAB ============ */}
                  <TabsContent value="details" className="space-y-6 m-0">
                    {/* Card 1: Contact Info */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Contact Information</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="mobile"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mobile Number</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="whatsapp"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>WhatsApp</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    {/* Card 2: Lead Fields */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Lead Details</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="locality"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Locality</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="zone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Zone</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="pipeline"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Pipeline</FormLabel>
                                <p className="text-xs text-muted-foreground">Include in active pipeline</p>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="dropReason"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Drop Reason</FormLabel>
                              <FormControl><Input {...field} placeholder="If dropped, specify reason" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="referredBy"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Referred By</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    {/* Card 3: Requirements */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Requirements</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="budgetMin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Budget Min (&#8377;)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                  placeholder="e.g. 5000000"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="budgetMax"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Budget Max (&#8377;)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                  placeholder="e.g. 10000000"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="bhk"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>BHK</FormLabel>
                              <FormControl>
                                <div className="flex flex-wrap gap-4">
                                  {BHK_OPTIONS.map((bhk) => (
                                    <label key={bhk} className="flex items-center gap-2 cursor-pointer">
                                      <Checkbox
                                        checked={field.value.includes(bhk)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            field.onChange([...field.value, bhk].sort());
                                          } else {
                                            field.onChange(field.value.filter((v) => v !== bhk));
                                          }
                                        }}
                                      />
                                      <span className="text-sm">{bhk} BHK</span>
                                    </label>
                                  ))}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="localities"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Preferred Localities</FormLabel>
                              <FormControl>
                                <TagInput
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="Add localities..."
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    {/* Card 4: Preferences */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Preferences</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="propertyType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Property Type</FormLabel>
                              <FormControl>
                                <Select onValueChange={field.onChange} value={field.value || ""}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="apartment">Apartment</SelectItem>
                                    <SelectItem value="villa">Villa</SelectItem>
                                    <SelectItem value="penthouse">Penthouse</SelectItem>
                                    <SelectItem value="plot">Plot</SelectItem>
                                    <SelectItem value="commercial">Commercial</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="mainDoorFacing"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Main Door Facing</FormLabel>
                              <FormControl>
                                <Select onValueChange={field.onChange} value={field.value || ""}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select facing" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="north">North</SelectItem>
                                    <SelectItem value="south">South</SelectItem>
                                    <SelectItem value="east">East</SelectItem>
                                    <SelectItem value="west">West</SelectItem>
                                    <SelectItem value="northeast">North-East</SelectItem>
                                    <SelectItem value="northwest">North-West</SelectItem>
                                    <SelectItem value="southeast">South-East</SelectItem>
                                    <SelectItem value="southwest">South-West</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="configuration"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Configuration</FormLabel>
                              <FormControl>
                                <TagInput
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="e.g. 2BHK, 3BHK"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="floorPreference"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Floor Preference</FormLabel>
                              <FormControl>
                                <Select onValueChange={field.onChange} value={field.value || ""}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select preference" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {FLOOR_PREFERENCE_OPTIONS.map((opt) => (
                                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="maxCap"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max Cap</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="landmark"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Landmark</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="khata"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Khata</FormLabel>
                              <FormControl>
                                <Select onValueChange={field.onChange} value={field.value || ""}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select khata" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {KHATA_OPTIONS.map((opt) => (
                                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="mustHaves"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Must Haves</FormLabel>
                              <FormControl>
                                <TagInput
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="e.g. Parking, Balcony"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="buyReason"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Buy Reason</FormLabel>
                              <FormControl><Input {...field} placeholder="Investment, Self-use, etc." /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="preferredBuildings"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Preferred Buildings</FormLabel>
                              <FormControl>
                                <BuildingMultiSelect
                                  value={field.value}
                                  onChange={field.onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* ============ TASKS TAB ============ */}
                  <TabsContent value="tasks" className="m-0">
                    <TasksTab entityType="lead" entityId={id} initialTasks={initialTasks} />
                  </TabsContent>

                  {/* ============ VISITS TAB ============ */}
                  <TabsContent value="visits" className="m-0">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            Visit History
                          </h3>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => setScheduleVisitOpen(true)}
                          >
                            <Plus className="size-4 mr-1.5" />
                            Schedule Visit
                          </Button>
                        </div>
                        {buyer.visits.length === 0 ? (
                          <div className="text-center py-12 text-muted-foreground">
                            <Calendar className="size-12 mx-auto mb-3 opacity-40" />
                            <p className="font-medium">No visits recorded yet</p>
                            <p className="text-sm mt-1">Schedule a visit using the button above.</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b text-left">
                                  <th className="pb-3 font-medium text-muted-foreground">Scheduled</th>
                                  <th className="pb-3 font-medium text-muted-foreground">Status</th>
                                  <th className="pb-3 font-medium text-muted-foreground">Listing</th>
                                  <th className="pb-3 font-medium text-muted-foreground">Visitor</th>
                                  <th className="pb-3 font-medium text-muted-foreground">Rating</th>
                                  <th className="pb-3 font-medium text-muted-foreground">Agent</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {buyer.visits.map((visit) => (
                                  <tr key={visit.id} className="hover:bg-muted/50">
                                    <td className="py-3">{visit.scheduledAt || "—"}</td>
                                    <td className="py-3">
                                      <Badge variant={visit.status === "completed" ? "default" : "secondary"}>
                                        {visit.status}
                                      </Badge>
                                    </td>
                                    <td className="py-3 font-mono text-xs">{visit.listingId ? visit.listingId.slice(0, 8) + "..." : "—"}</td>
                                    <td className="py-3">{visit.visitorName || "—"}</td>
                                    <td className="py-3">
                                      {visit.feedbackRating != null ? (
                                        <div className="flex items-center gap-1">
                                          <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                                          <span>{visit.feedbackRating}</span>
                                        </div>
                                      ) : "—"}
                                    </td>
                                    <td className="py-3">{visit.assignedVaName || "—"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* ============ COMMUNICATIONS TAB ============ */}
                  <TabsContent value="communications" className="m-0">
                    <CommunicationTab
                      entityType="lead"
                      entityId={id}
                      agentId={agentId}
                      communications={buyer.communications}
                    />
                  </TabsContent>

                  {/* ============ ACTIVITY TAB ============ */}
                  <TabsContent value="activity" className="m-0">
                    <ActivityTab entityType="lead" entityId={id} />
                  </TabsContent>

                  {/* ============ NOTES TAB ============ */}
                  <TabsContent value="notes" className="m-0">
                    <NotesTab entityType="lead" entityId={id} />
                  </TabsContent>
                </div>
              </Tabs>
            </Card>
          }
        />
      </form>

      {/* ── Schedule Visit Modal ── */}
      <Dialog open={scheduleVisitOpen} onOpenChange={(open) => {
        setScheduleVisitOpen(open);
        if (!open) {
          setScheduleDate(undefined);
          setSelectedListingId("");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Visit</DialogTitle>
            <DialogDescription>
              Schedule a property visit for {buyer?.name || "this buyer"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Listing Select */}
            <div className="space-y-2">
              <Label>Listing</Label>
              {isLoadingListings ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="size-4 animate-spin" />
                  Loading listings...
                </div>
              ) : liveListings.length === 0 ? (
                <div className="text-sm text-muted-foreground py-2">
                  No active listings available.
                </div>
              ) : (
                <Select value={selectedListingId} onValueChange={setSelectedListingId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a listing..." />
                  </SelectTrigger>
                  <SelectContent>
                    {liveListings.map((listing) => {
                      const displayId = listing.jumboId || listing.id.slice(0, 8);
                      const label = [
                        displayId,
                        listing.buildingName,
                        listing.unitNumber ? `Unit ${listing.unitNumber}` : null,
                        listing.bhk ? `${listing.bhk}BHK` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ");
                      return (
                        <SelectItem key={listing.id} value={listing.id}>
                          <div className="flex items-center gap-2">
                            <Home className="size-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate">{label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Date & Time Picker */}
            <div className="space-y-2">
              <Label>Date &amp; Time</Label>
              <DateTimePicker date={scheduleDate} setDate={setScheduleDate} />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setScheduleVisitOpen(false)}
              disabled={isScheduling}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleScheduleVisit}
              disabled={isScheduling || !selectedListingId || !scheduleDate}
            >
              {isScheduling ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Calendar className="size-4 mr-1.5" />
                  Schedule Visit
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
