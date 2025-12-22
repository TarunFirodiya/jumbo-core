import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, MessageCircle } from "lucide-react";

interface SellerCardProps {
  seller: {
    fullName: string;
    email: string | null;
    phone: string;
  };
}

export function SellerCard({ seller }: SellerCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Seller Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${seller.fullName}`} />
            <AvatarFallback>S</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{seller.fullName}</p>
            <p className="text-xs text-muted-foreground">Property Owner</p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2">
           <Button className="w-full justify-start" size="sm">
              <Phone className="size-4 mr-2" />
              Call Seller
           </Button>
            <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="justify-start">
                    <Mail className="size-4 mr-2" />
                    Email
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                    <MessageCircle className="size-4 mr-2" />
                    WhatsApp
                </Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}

