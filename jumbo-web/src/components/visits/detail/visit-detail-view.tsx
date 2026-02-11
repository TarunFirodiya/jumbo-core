"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Phone,
  MapPin,
  Clock,
  Calendar,
  User,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Home,
  IndianRupee,
  ExternalLink,
  MapPinned,
  Loader2,
  AlertTriangle,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Separator } from "@/components/ui/separator";
import { DetailLayout } from "@/components/shared/detail-layout";
import { Rating, RatingButton } from "@/components/kibo-ui/rating";
import { NotesTab } from "@/components/shared/tabs/notes-tab";
import { ActivityTab } from "@/components/shared/tabs/activity-tab";
import {
  confirmVisit,
  cancelVisit,
  completeVisit,
} from "@/lib/actions/visit-workflows";

// ─── Types ──────────────────────────────────────────────────────

export interface VisitDetailData {
  id: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled";
  scheduledAt: string | null;
  buyer: {
    name: string;
    phone: string | null;
    email: string | null;
    budgetMin: number | null;
    budgetMax: number | null;
    leadId: string | null;
  };
  listing: {
    title: string;
    address: string;
    image: string;
    price: number | null;
    listingId: string | null;
    mapUrl: string | null;
  };
  agent: {
    name: string;
    phone: string | null;
    avatarUrl: string;
  };
  otpVerified: boolean;
  otpCode: string | null;
  checkInLat: number | null;
  checkInLng: number | null;
  feedbackRating: number | null;
  feedbackText: string | null;
  cancellationReason: string | null;
  completedAt: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
}

interface VisitDetailViewProps {
  visit: VisitDetailData | null;
  id: string;
}

// ─── Constants ──────────────────────────────────────────────────

const CANCELLATION_REASONS = [
  "Seller Unavailable",
  "Tenant Unavailable",
  "Customer No-Show",
  "Other",
] as const;

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }
> = {
  scheduled: {
    label: "Scheduled",
    variant: "secondary",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  confirmed: {
    label: "Confirmed",
    variant: "default",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  completed: {
    label: "Completed",
    variant: "default",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  cancelled: {
    label: "Cancelled",
    variant: "destructive",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
};

// ─── Helpers ────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number | null): string {
  if (amount == null) return "—";
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

// ─── Component ──────────────────────────────────────────────────

export function VisitDetailView({ visit, id }: VisitDetailViewProps) {
  const router = useRouter();

  // ── Cancel Modal State ──
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState("");
  const [cancelNotes, setCancelNotes] = React.useState("");
  const [isCancelling, setIsCancelling] = React.useState(false);

  // ── Complete Modal State ──
  const [completeOpen, setCompleteOpen] = React.useState(false);
  const [otpValue, setOtpValue] = React.useState("");
  const [feedbackRating, setFeedbackRating] = React.useState(0);
  const [feedbackText, setFeedbackText] = React.useState("");
  const [isCompleting, setIsCompleting] = React.useState(false);
  const [geoStatus, setGeoStatus] = React.useState<
    "idle" | "fetching" | "success" | "denied" | "error"
  >("idle");
  const [geoCoords, setGeoCoords] = React.useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // ── Confirm State ──
  const [isConfirming, setIsConfirming] = React.useState(false);

  // ── Not Found ──
  if (!visit) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Visit not found</h2>
          <p className="text-muted-foreground mt-1">
            The visit with ID {id} does not exist.
          </p>
          <Button asChild className="mt-4">
            <Link href="/visits">Back to Visits</Link>
          </Button>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[visit.status] ?? STATUS_CONFIG.scheduled;
  const isViewOnly =
    visit.status === "completed" || visit.status === "cancelled";

  // ── Actions ──

  async function handleConfirm() {
    setIsConfirming(true);
    try {
      const result = await confirmVisit(id);
      if (result.success) {
        toast.success("Visit confirmed");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to confirm visit");
    } finally {
      setIsConfirming(false);
    }
  }

  async function handleCancel() {
    if (!cancelReason) {
      toast.error("Please select a cancellation reason");
      return;
    }
    setIsCancelling(true);
    try {
      const result = await cancelVisit(id, cancelReason, cancelNotes || undefined);
      if (result.success) {
        toast.success("Visit cancelled");
        setCancelOpen(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to cancel visit");
    } finally {
      setIsCancelling(false);
    }
  }

  function requestGeolocation() {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus("fetching");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus("success");
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeoStatus("denied");
        } else {
          setGeoStatus("error");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handleCompleteOpen() {
    setCompleteOpen(true);
    // Auto-request geolocation when opening
    requestGeolocation();
  }

  async function handleComplete() {
    if (otpValue.length !== 4) {
      toast.error("Please enter the 4-digit OTP");
      return;
    }

    // Use (0,0) if geolocation was denied/error (handle gracefully)
    const location = geoCoords ?? { lat: 0, lng: 0 };

    setIsCompleting(true);
    try {
      const result = await completeVisit(id, otpValue, {
        latitude: location.lat,
        longitude: location.lng,
      }, {
        rating: feedbackRating || undefined,
        text: feedbackText || undefined,
      });
      if (result.success) {
        toast.success("Visit completed successfully");
        setCompleteOpen(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to complete visit");
    } finally {
      setIsCompleting(false);
    }
  }

  // ─── Header ───────────────────────────────────────────────────

  const Header = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
      {/* Left: Breadcrumb + Visit Info */}
      <div className="space-y-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <Link
            href="/visits"
            className="hover:text-foreground transition-colors"
          >
            Visits
          </Link>
          <ChevronRight className="size-4 mx-1" />
          <span className="text-foreground font-medium">Visit Details</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div data-testid="visit-datetime" className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-lg font-semibold">
              <Calendar className="size-5 text-muted-foreground" />
              {formatDate(visit.scheduledAt)}
            </div>
            <div className="flex items-center gap-1.5 text-lg font-semibold">
              <Clock className="size-5 text-muted-foreground" />
              {formatTime(visit.scheduledAt)}
            </div>
          </div>
          <span
            data-testid="visit-id"
            className="text-xs text-muted-foreground font-mono"
          >
            {visit.id.slice(0, 8)}
          </span>
          <Badge
            data-testid="visit-status-badge"
            variant={statusCfg.variant}
            className={cn("text-xs font-medium", statusCfg.className)}
          >
            {statusCfg.label}
          </Badge>
        </div>
      </div>

      {/* Right: Action Buttons */}
      {!isViewOnly && (
        <div className="flex items-center gap-2">
          {visit.status === "scheduled" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelOpen(true)}
              >
                <XCircle className="size-4 mr-1.5" />
                Cancel Visit
              </Button>
              <Button
                size="sm"
                onClick={handleConfirm}
                disabled={isConfirming}
              >
                {isConfirming ? (
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4 mr-1.5" />
                )}
                Confirm
              </Button>
            </>
          )}
          {visit.status === "confirmed" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelOpen(true)}
              >
                <XCircle className="size-4 mr-1.5" />
                Cancel Visit
              </Button>
              <Button size="sm" onClick={handleCompleteOpen}>
                <CheckCircle2 className="size-4 mr-1.5" />
                Complete Visit
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );

  // ─── Overview (Left Sidebar) ──────────────────────────────────

  const Overview = (
    <div className="space-y-4">
      {/* Listing Card */}
      <Card data-testid="listing-card" className="overflow-hidden">
        <div className="h-32 bg-muted relative">
          <img
            src={visit.listing.image}
            alt={visit.listing.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <h3 className="font-bold text-sm leading-tight truncate">
              {visit.listing.title}
            </h3>
            {visit.listing.address && (
              <div className="flex items-center gap-1 text-xs opacity-90 truncate mt-0.5">
                <MapPin className="size-3 shrink-0" />
                {visit.listing.address}
              </div>
            )}
          </div>
        </div>
        <CardContent className="pt-4 space-y-3">
          {visit.listing.price && (
            <div className="flex items-center gap-2 text-sm">
              <IndianRupee className="size-4 text-muted-foreground" />
              <span className="font-semibold">
                {formatCurrency(visit.listing.price)}
              </span>
            </div>
          )}
          <div className="flex gap-2">
            {visit.listing.listingId && (
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link href={`/listings/${visit.listing.listingId}`}>
                  <Home className="size-3.5 mr-1.5" />
                  View Listing
                </Link>
              </Button>
            )}
            {visit.listing.mapUrl && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={visit.listing.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="size-3.5" />
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Buyer Card */}
      <Card data-testid="buyer-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
            Buyer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {visit.buyer.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {visit.buyer.name}
              </p>
              {visit.buyer.phone && (
                <a
                  href={`tel:${visit.buyer.phone}`}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  <Phone className="size-3" />
                  {visit.buyer.phone}
                </a>
              )}
            </div>
            {visit.buyer.phone && (
              <Button variant="ghost" size="icon" className="shrink-0" asChild>
                <a href={`tel:${visit.buyer.phone}`}>
                  <Phone className="size-4" />
                </a>
              </Button>
            )}
          </div>
          {(visit.buyer.budgetMin || visit.buyer.budgetMax) && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Budget:</span>{" "}
              {visit.buyer.budgetMin && visit.buyer.budgetMax
                ? `${formatCurrency(visit.buyer.budgetMin)} – ${formatCurrency(visit.buyer.budgetMax)}`
                : visit.buyer.budgetMax
                  ? `Up to ${formatCurrency(visit.buyer.budgetMax)}`
                  : `From ${formatCurrency(visit.buyer.budgetMin)}`}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agent Card */}
      <Card data-testid="agent-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
            Assigned Agent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarImage src={visit.agent.avatarUrl} />
              <AvatarFallback>{visit.agent.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {visit.agent.name}
              </p>
              <p className="text-xs text-muted-foreground">Field Agent</p>
            </div>
            {visit.agent.phone && (
              <Button variant="ghost" size="icon" className="shrink-0" asChild>
                <a href={`tel:${visit.agent.phone}`}>
                  <Phone className="size-4" />
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Visit Info Card (for completed/cancelled) */}
      {visit.status === "completed" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Completion Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">OTP Verified</span>
              <Badge
                variant={visit.otpVerified ? "default" : "secondary"}
                className={cn(
                  "text-xs",
                  visit.otpVerified
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : ""
                )}
              >
                {visit.otpVerified ? "Yes" : "No"}
              </Badge>
            </div>
            {visit.checkInLat && visit.checkInLng && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Location</span>
                <a
                  href={`https://www.google.com/maps?q=${visit.checkInLat},${visit.checkInLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <MapPinned className="size-3" />
                  View on Map
                </a>
              </div>
            )}
            {visit.feedbackRating != null && visit.feedbackRating > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Rating</span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "size-3.5",
                        i < visit.feedbackRating!
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30"
                      )}
                    />
                  ))}
                </div>
              </div>
            )}
            {visit.feedbackText && (
              <div>
                <span className="text-muted-foreground text-xs block mb-1">
                  Feedback
                </span>
                <p className="text-sm bg-muted/50 p-2 rounded-md">
                  {visit.feedbackText}
                </p>
              </div>
            )}
            {visit.completedAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Completed At</span>
                <span className="text-xs">
                  {formatDate(visit.completedAt)},{" "}
                  {formatTime(visit.completedAt)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {visit.status === "cancelled" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Cancellation Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {visit.cancellationReason && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Reason</span>
                <Badge variant="outline" className="text-xs">
                  {visit.cancellationReason}
                </Badge>
              </div>
            )}
            {visit.cancelledAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Cancelled At</span>
                <span className="text-xs">
                  {formatDate(visit.cancelledAt)},{" "}
                  {formatTime(visit.cancelledAt)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );

  // ─── Main Content (Tabs) ──────────────────────────────────────

  const Content = (
    <Tabs defaultValue="timeline" className="w-full">
      <TabsList>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
      </TabsList>

      <div className="py-4">
        <TabsContent value="timeline" className="m-0">
          <ActivityTab entityType="visit" entityId={id} />
        </TabsContent>

        <TabsContent value="notes" className="m-0">
          <NotesTab entityType="visit" entityId={id} />
        </TabsContent>
      </div>
    </Tabs>
  );

  // ─── Render ───────────────────────────────────────────────────

  return (
    <>
      <DetailLayout header={Header} overview={Overview} content={Content} />

      {/* ── Cancel Modal ── */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Visit</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this visit.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Cancellation Reason</Label>
              <Select value={cancelReason} onValueChange={setCancelReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  {CANCELLATION_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes..."
                value={cancelNotes}
                onChange={(e) => setCancelNotes(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelOpen(false)}
              disabled={isCancelling}
            >
              Go Back
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isCancelling || !cancelReason}
            >
              {isCancelling ? (
                <Loader2 className="size-4 mr-1.5 animate-spin" />
              ) : (
                <XCircle className="size-4 mr-1.5" />
              )}
              Cancel Visit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Complete Modal ── */}
      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Complete Visit</DialogTitle>
            <DialogDescription>
              Verify the OTP and capture visit details to mark as complete.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* OTP Section */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">OTP Verification</Label>
              <p className="text-xs text-muted-foreground">
                Enter the 4-digit OTP provided to the buyer.
              </p>
              <InputOTP
                maxLength={4}
                value={otpValue}
                onChange={setOtpValue}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Separator />

            {/* Geolocation Section */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Location Capture</Label>
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                {geoStatus === "idle" && (
                  <>
                    <MapPinned className="size-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm">Waiting for location...</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={requestGeolocation}
                    >
                      Retry
                    </Button>
                  </>
                )}
                {geoStatus === "fetching" && (
                  <>
                    <Loader2 className="size-5 text-primary animate-spin" />
                    <p className="text-sm">Fetching location...</p>
                  </>
                )}
                {geoStatus === "success" && geoCoords && (
                  <>
                    <CheckCircle2 className="size-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-700 dark:text-green-400">
                        Location captured
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {geoCoords.lat.toFixed(6)}, {geoCoords.lng.toFixed(6)}
                      </p>
                    </div>
                  </>
                )}
                {geoStatus === "denied" && (
                  <>
                    <AlertTriangle className="size-5 text-amber-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                        Location permission denied
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Visit can still be completed without location.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={requestGeolocation}
                    >
                      Retry
                    </Button>
                  </>
                )}
                {geoStatus === "error" && (
                  <>
                    <AlertTriangle className="size-5 text-red-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">
                        Location error
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Could not retrieve location. You can still proceed.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={requestGeolocation}
                    >
                      Retry
                    </Button>
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* Feedback Section */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Feedback</Label>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Star Rating
                </Label>
                <div className="flex items-center gap-2">
                  <Rating
                    value={feedbackRating}
                    onValueChange={setFeedbackRating}
                    className="gap-1"
                  >
                    <RatingButton />
                    <RatingButton />
                    <RatingButton />
                    <RatingButton />
                    <RatingButton />
                  </Rating>
                  <span className="text-sm text-muted-foreground ml-2">
                    {feedbackRating ? `${feedbackRating}/5` : "No rating"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Comments
                </Label>
                <Textarea
                  placeholder="How did the visit go?"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCompleteOpen(false)}
              disabled={isCompleting}
            >
              Go Back
            </Button>
            <Button
              onClick={handleComplete}
              disabled={isCompleting || otpValue.length !== 4}
            >
              {isCompleting ? (
                <Loader2 className="size-4 mr-1.5 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4 mr-1.5" />
              )}
              Complete Visit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
