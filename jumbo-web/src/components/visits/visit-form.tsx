"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

// Form Schema
const formSchema = z.object({
  buyerId: z.string().min(1, "Please select a buyer."),
  listingId: z.string().min(1, "Please select a listing."),
  date: z.date(),
});

type FormValues = z.infer<typeof formSchema>;

interface BuyerOption {
  id: string;
  name: string | null;
  phone: string | null;
  status: string | null;
}

interface ListingOption {
  id: string;
  price: string | null;
  bhk: number | null;
  size: number | null;
  buildingName: string | null;
  locality: string | null;
}

interface VisitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultBuyerId?: string;
  defaultListingId?: string;
  hideBuyerSelect?: boolean;
  hideListingSelect?: boolean;
  onSuccess?: () => void;
}

export function VisitForm({
  open,
  onOpenChange,
  defaultBuyerId,
  defaultListingId,
  hideBuyerSelect = false,
  hideListingSelect = false,
  onSuccess,
}: VisitFormProps) {
  const [buyers, setBuyers] = React.useState<BuyerOption[]>([]);
  const [listings, setListings] = React.useState<ListingOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      buyerId: defaultBuyerId || "",
      listingId: defaultListingId || "",
    },
  });

  // Fetch options when modal opens
  React.useEffect(() => {
    if (open) {
      const fetchOptions = async () => {
        try {
          setIsLoading(true);
          const response = await fetch("/api/v1/visits/options");
          const data = await response.json();
          if (data.data) {
            setBuyers(data.data.buyers || []);
            setListings(data.data.listings || []);
          }
        } catch (error) {
          toast.error("Failed to load options");
        } finally {
          setIsLoading(false);
        }
      };
      fetchOptions();
    }
  }, [open]);

  // Update form defaults if props change
  React.useEffect(() => {
    if (defaultBuyerId) form.setValue("buyerId", defaultBuyerId);
    if (defaultListingId) form.setValue("listingId", defaultListingId);
  }, [defaultBuyerId, defaultListingId, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch("/api/v1/visits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to create visit");
      }
      
      toast.success("Visit scheduled successfully");
      onSuccess?.();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error("Failed to schedule visit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule New Visit</DialogTitle>
          <DialogDescription>
            Select a buyer, listing, and time for the visit.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {!hideBuyerSelect && (
              <FormField
                control={form.control}
                name="buyerId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Buyer</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isLoading}
                          >
                            {field.value
                              ? buyers.find((buyer) => buyer.id === field.value)?.name || "Unknown Buyer"
                              : "Select buyer..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search buyer..." />
                          <CommandList>
                            <CommandEmpty>No buyer found.</CommandEmpty>
                            <CommandGroup>
                              {buyers.map((buyer) => (
                                <CommandItem
                                  value={buyer.name || ""}
                                  key={buyer.id}
                                  onSelect={() => {
                                    form.setValue("buyerId", buyer.id);
                                  }}
                                  className="flex flex-col items-start gap-1 py-3"
                                >
                                  <div className="flex w-full items-center justify-between">
                                    <span className="font-medium">{buyer.name}</span>
                                    {field.value === buyer.id && (
                                      <Check className="h-4 w-4" />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground w-full">
                                    <span>{buyer.phone}</span>
                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 capitalize">
                                      {buyer.status?.replace("_", " ")}
                                    </Badge>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {!hideListingSelect && (
              <FormField
                control={form.control}
                name="listingId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Listing</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isLoading}
                          >
                            {field.value
                              ? listings.find((listing) => listing.id === field.value)?.buildingName || "Unknown Listing"
                              : "Select listing..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search listing..." />
                          <CommandList>
                            <CommandEmpty>No listing found.</CommandEmpty>
                            <CommandGroup>
                              {listings.map((listing) => (
                                <CommandItem
                                  value={listing.buildingName || ""}
                                  key={listing.id}
                                  onSelect={() => {
                                    form.setValue("listingId", listing.id);
                                  }}
                                  className="flex flex-col items-start gap-1 py-3"
                                >
                                  <div className="flex w-full items-center justify-between">
                                    <span className="font-medium">{listing.buildingName}</span>
                                    {field.value === listing.id && (
                                      <Check className="h-4 w-4" />
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <span className="font-medium text-foreground">
                                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumSignificantDigits: 3 }).format(Number(listing.price))}
                                    </span>
                                    <span>•</span>
                                    <span>{listing.bhk} BHK</span>
                                    <span>•</span>
                                    <span>{listing.size} sq.ft</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate w-full">
                                    {listing.locality}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date & Time</FormLabel>
                  <DateTimePicker
                    date={field.value}
                    setDate={field.onChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Schedule Visit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

