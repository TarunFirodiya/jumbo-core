import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OfferData {
  id: string;
  offerAmount: string;
  status: string;
  createdAt: string | Date;
}

interface ActiveOffersProps {
  offers?: OfferData[];
}

const statusVariant: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  pending: "default",
  accepted: "secondary",
  rejected: "destructive",
  countered: "outline",
  expired: "secondary",
};

function formatAmount(amount: string) {
  const num = Number(amount);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString("en-IN")}`;
}

function timeAgo(date: string | Date) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function ActiveOffers({ offers = [] }: ActiveOffersProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Active Offers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {offers.map((offer) => (
            <div key={offer.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
              <div>
                <div className="font-bold">{formatAmount(offer.offerAmount)}</div>
                <div className="text-xs text-muted-foreground">{timeAgo(offer.createdAt)}</div>
              </div>
              <Badge variant={statusVariant[offer.status] || "secondary"}>
                {offer.status}
              </Badge>
            </div>
          ))}
          {offers.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-4">
              No active offers
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
