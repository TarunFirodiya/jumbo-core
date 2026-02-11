"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { markListingAsSold } from "@/lib/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface MarkSoldDialogProps {
  listingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MarkSoldDialog({ listingId, open, onOpenChange }: MarkSoldDialogProps) {
  const router = useRouter();
  const [soldBy, setSoldBy] = React.useState<string>("");
  const [sellingPrice, setSellingPrice] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleSubmit() {
    if (!soldBy) return;
    setIsSubmitting(true);
    try {
      const price = sellingPrice ? Number(sellingPrice) : undefined;
      const result = await markListingAsSold(
        listingId,
        soldBy as "jumbo" | "owner" | "other_agent",
        price
      );
      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to mark as sold");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark Listing as Sold</DialogTitle>
          <DialogDescription>
            Record the sale details for this listing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Sold By *</Label>
            <Select value={soldBy} onValueChange={setSoldBy}>
              <SelectTrigger>
                <SelectValue placeholder="Select who sold it..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jumbo">Jumbo</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="other_agent">Other Agent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Selling Price (optional)</Label>
            <Input
              type="number"
              placeholder="e.g. 8500000"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !soldBy}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin mr-1.5" />
                Submitting...
              </>
            ) : (
              "Confirm Sale"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
