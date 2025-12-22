import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, MessageCircle } from "lucide-react";

interface AgentCardProps {
  agent: {
    fullName: string;
    role: string;
    email: string | null;
    phone: string;
  };
}

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Listing Agent</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${agent.fullName}`} />
            <AvatarFallback>{agent.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{agent.fullName}</p>
            <p className="text-xs text-muted-foreground capitalize">{agent.role.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Button variant="outline" size="icon" className="w-full" title="Call">
            <Phone className="size-4" />
          </Button>
          <Button variant="outline" size="icon" className="w-full" title="Email">
            <Mail className="size-4" />
          </Button>
          <Button variant="outline" size="icon" className="w-full" title="WhatsApp">
            <MessageCircle className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

