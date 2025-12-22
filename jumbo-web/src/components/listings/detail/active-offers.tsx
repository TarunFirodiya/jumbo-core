import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const mockOffers = [
    { id: 1, amount: "₹1.45 Cr", date: "2 days ago", status: "Negotiating" },
    { id: 2, amount: "₹1.40 Cr", date: "5 days ago", status: "Rejected" },
];

export function ActiveOffers() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Active Offers</CardTitle>
      </CardHeader>
      <CardContent>
         <div className="space-y-4">
            {mockOffers.map((offer) => (
                <div key={offer.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div>
                        <div className="font-bold">{offer.amount}</div>
                        <div className="text-xs text-muted-foreground">{offer.date}</div>
                    </div>
                    <Badge variant={offer.status === "Negotiating" ? "default" : "destructive"}>
                        {offer.status}
                    </Badge>
                </div>
            ))}
            {mockOffers.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-4">
                    No active offers
                </div>
            )}
         </div>
      </CardContent>
    </Card>
  );
}

