"use client";

import * as React from "react";
import Link from "next/link";
import { 
  Phone, 
  MapPin, 
  Clock, 
  MoreHorizontal, 
  Mail, 
  Edit, 
  Calendar,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  MessageSquare,
  Save,
  Home
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Rating } from "@/components/kibo-ui/rating";
import { updateVisit } from "@/lib/actions";

export interface VisitDetail {
  id: string;
  property: {
    name: string;
    address: string;
    image: string;
  };
  dateTime: {
    date: string;
    time: string;
  };
  agent: {
    name: string;
    image: string;
  };
  client: {
    name: string;
    type: string;
  };
  status: "Scheduled" | "Pending" | "Completed" | "Cancelled";
  feedback?: string;
  notes?: string;
}

interface VisitDetailViewProps {
  visit: VisitDetail | null;
  id: string;
}

const visitFormSchema = z.object({
  status: z.string(),
  feedback: z.string().optional(),
  notes: z.string().optional(),
  rating: z.number().optional().default(0),
});

type VisitFormValues = z.infer<typeof visitFormSchema>;

export function VisitDetailView({ visit, id }: VisitDetailViewProps) {
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<VisitFormValues>({
    resolver: zodResolver(visitFormSchema) as any,
    defaultValues: {
      status: visit?.status || "Pending",
      feedback: visit?.feedback || "",
      notes: visit?.notes || "",
      rating: 0,
    },
  });

  async function onSubmit(data: VisitFormValues) {
    setIsSaving(true);
    try {
      const result = await updateVisit(id, {
        ...data,
        status: data.status as "pending" | "in_progress" | "completed" | "scheduled" | "cancelled" | "no_show",
      });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
       toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  }

  if (!visit) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Visit not found</h2>
          <p className="text-muted-foreground">The visit with ID {id} does not exist.</p>
          <Button asChild className="mt-4">
            <Link href="/visits">Back to Visits</Link>
          </Button>
        </div>
      </div>
    );
  }

  const Overview = (
    <Card className="h-full border-none shadow-none bg-transparent p-0">
      <div className="space-y-6">
        {/* Property Card */}
        <Card className="overflow-hidden">
          <div className="h-32 bg-muted relative">
            <img src={visit.property.image} alt={visit.property.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-3 left-3 right-3 text-white">
                <h3 className="font-bold text-lg leading-tight truncate">{visit.property.name}</h3>
                <div className="flex items-center gap-1 text-xs opacity-90 truncate">
                    <MapPin className="size-3" />
                    {visit.property.address}
                </div>
            </div>
          </div>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-4">
               <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Status</div>
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                         <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Scheduled">Scheduled</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                         </FormControl>
                      </FormItem>
                    )}
                  />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                   <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Date</div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                          <Calendar className="size-4 text-muted-foreground" />
                          {visit.dateTime.date}
                      </div>
                   </div>
                   <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Time</div>
                       <div className="flex items-center gap-2 text-sm font-medium">
                          <Clock className="size-4 text-muted-foreground" />
                          {visit.dateTime.time}
                      </div>
                   </div>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Agent Card */}
        <Card>
            <CardHeader className="pb-3">
               <CardTitle className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Assigned Agent</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="flex items-center gap-3">
                  <Avatar>
                     <AvatarImage src={visit.agent.image} />
                     <AvatarFallback>{visit.agent.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="overflow-hidden">
                     <p className="text-sm font-medium truncate">{visit.agent.name}</p>
                     <p className="text-xs text-muted-foreground">Field Agent</p>
                  </div>
                  <Button variant="ghost" size="icon" className="ml-auto">
                     <Phone className="size-4" />
                  </Button>
               </div>
            </CardContent>
        </Card>

        {/* Client Card */}
        <Card>
            <CardHeader className="pb-3">
               <CardTitle className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Client</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                       {visit.client.name[0]}
                  </div>
                  <div className="overflow-hidden">
                     <p className="text-sm font-medium truncate">{visit.client.name}</p>
                     <p className="text-xs text-muted-foreground">{visit.client.type}</p>
                  </div>
                   <Button variant="ghost" size="icon" className="ml-auto">
                     <Phone className="size-4" />
                  </Button>
               </div>
            </CardContent>
        </Card>
      </div>
    </Card>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <DetailLayout
          header={
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <Link href="/visits" className="hover:text-foreground transition-colors">Visits</Link>
                <ChevronRight className="size-4 mx-1" />
                <span className="text-foreground font-medium">Visit Details</span>
              </div>
              <div className="flex items-end justify-start gap-2">
                 <Button type="button" variant="outline" size="sm">Cancel</Button>
                 <Button type="submit" size="sm" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                 </Button>
              </div>
            </div>
          }
          overview={Overview}
          content={
            <Card className="h-full border-none shadow-none bg-transparent p-0">
               <Tabs defaultValue="feedback" className="w-full">
                  <TabsList className="gap-6">
                     <TabsTrigger 
                        value="feedback" 
                        className="py-3"
                      >
                        Feedback
                     </TabsTrigger>
                     <TabsTrigger 
                        value="notes" 
                        className="py-3"
                      >
                        Notes
                     </TabsTrigger>
                  </TabsList>
                  
                  <div className="py-6">
                    <TabsContent value="feedback" className="space-y-6 m-0">
                       <Card>
                          <CardHeader>
                             <CardTitle>Visit Feedback</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                              <FormField
                                control={form.control}
                                name="rating"
                                render={({ field }) => (
                                   <FormItem>
                                      <FormLabel>Client Rating</FormLabel>
                                      <FormControl>
                                         <div className="flex items-center gap-2">
                                            <Rating 
                                                value={field.value} 
                                                onValueChange={field.onChange}
                                                className="gap-1"
                                            />
                                            <span className="text-sm text-muted-foreground ml-2">
                                                {field.value ? `${field.value} Stars` : "No rating"}
                                            </span>
                                         </div>
                                      </FormControl>
                                      <FormMessage />
                                   </FormItem>
                                )}
                             />
                             
                             <FormField
                                control={form.control}
                                name="feedback"
                                render={({ field }) => (
                                   <FormItem>
                                      <FormLabel>Feedback Notes</FormLabel>
                                      <FormControl>
                                         <Textarea 
                                            {...field} 
                                            placeholder="Enter feedback from the client..." 
                                            className="min-h-[150px]"
                                         />
                                      </FormControl>
                                      <FormMessage />
                                   </FormItem>
                                )}
                             />
                          </CardContent>
                       </Card>
                    </TabsContent>

                    <TabsContent value="notes" className="m-0">
                       <Card>
                          <CardContent className="p-6">
                             <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Textarea 
                                                    {...field}
                                                    placeholder="Add internal notes about this visit..." 
                                                    className="min-h-[150px]" 
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                             </div>
                          </CardContent>
                       </Card>
                    </TabsContent>
                  </div>
               </Tabs>
            </Card>
          }
        />
      </form>
    </Form>
  );
}
