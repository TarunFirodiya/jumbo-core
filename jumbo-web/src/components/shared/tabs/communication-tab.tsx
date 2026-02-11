"use client";

import * as React from "react";
import {
  Loader2,
  MessageSquare,
  PhoneCall,
  Mail,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { logCommunication } from "@/lib/actions";
import { toast } from "sonner";
import type { CommunicationItem } from "@/types";

interface CommunicationTabProps {
  entityType: "lead" | "seller_lead";
  entityId: string;
  agentId: string;
  communications: CommunicationItem[];
}

function ChannelIcon({ channel }: { channel: string }) {
  switch (channel?.toLowerCase()) {
    case "whatsapp":
      return <MessageSquare className="size-4" />;
    case "call":
    case "phone":
      return <PhoneCall className="size-4" />;
    case "email":
      return <Mail className="size-4" />;
    default:
      return <MessageSquare className="size-4" />;
  }
}

export function CommunicationTab({
  entityType,
  entityId,
  agentId,
  communications,
}: CommunicationTabProps) {
  const [isCommDialogOpen, setIsCommDialogOpen] = React.useState(false);
  const [commChannel, setCommChannel] = React.useState<"call" | "whatsapp">("call");
  const [commDirection, setCommDirection] = React.useState("outbound");
  const [commContent, setCommContent] = React.useState("");
  const [isLoggingComm, setIsLoggingComm] = React.useState(false);

  async function handleLogCommunication() {
    if (!commContent.trim()) return;
    setIsLoggingComm(true);
    try {
      const payload: Record<string, unknown> = {
        agentId,
        channel: commChannel,
        direction: commDirection as "inbound" | "outbound",
        content: commContent.trim(),
      };
      if (entityType === "lead") {
        payload.leadId = entityId;
      } else {
        payload.sellerLeadId = entityId;
      }
      const result = await logCommunication(payload as any);
      if (result.success) {
        toast.success("Communication logged");
        setCommContent("");
        setIsCommDialogOpen(false);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to log communication");
    } finally {
      setIsLoggingComm(false);
    }
  }

  const logButtons = (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => {
          setCommChannel("call");
          setIsCommDialogOpen(true);
        }}
      >
        <PhoneCall className="size-4" />
        Log Call
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => {
          setCommChannel("whatsapp");
          setIsCommDialogOpen(true);
        }}
      >
        <MessageSquare className="size-4" />
        Log WhatsApp
      </Button>
    </div>
  );

  return (
    <>
      <Card>
        <CardContent className="p-6">
          {communications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="size-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No communications recorded yet</p>
              <p className="text-sm mt-1">Call logs and messages will appear here.</p>
              <div className="flex items-center justify-center gap-3 mt-4">
                {logButtons}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-end gap-2">
                {logButtons}
              </div>
              {communications.map((comm) => (
                <Card key={comm.id}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-full shrink-0",
                        comm.direction === "outbound" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                      )}>
                        <ChannelIcon channel={comm.channel} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm capitalize">{comm.channel || "Unknown"}</span>
                          {comm.direction === "outbound" ? (
                            <ArrowUpRight className="size-3.5 text-blue-500" />
                          ) : (
                            <ArrowDownLeft className="size-3.5 text-green-500" />
                          )}
                          <span className="text-xs text-muted-foreground capitalize">{comm.direction}</span>
                        </div>
                        {comm.content && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{comm.content}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{comm.createdAt}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCommDialogOpen} onOpenChange={setIsCommDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Log {commChannel === "call" ? "Call" : "WhatsApp Message"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Direction</label>
              <Select value={commDirection} onValueChange={setCommDirection}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outbound">Outbound</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={commContent}
                onChange={(e) => setCommContent(e.target.value)}
                placeholder="Describe the communication..."
                className="mt-1 min-h-[100px]"
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleLogCommunication}
                disabled={isLoggingComm || !commContent.trim()}
              >
                {isLoggingComm ? (
                  <><Loader2 className="size-4 animate-spin mr-1" /> Logging...</>
                ) : (
                  "Log Communication"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
