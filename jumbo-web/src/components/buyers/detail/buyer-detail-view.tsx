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
  Plus, 
  Eye,
  UserPlus,
  Paperclip,
  ChevronRight,
  MessageSquare,
  Save
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DetailLayout } from "@/components/shared/detail-layout";
import { Rating } from "@/components/kibo-ui/rating";
// import { Status } from "@/components/kibo-ui/status"; // Using standard Badge/Select for business status for now as kibo status is specific to system status

import { updateBuyer } from "@/lib/actions";
import { toast } from "sonner";

export interface BuyerDetail {
  id: string;
  name: string;
  location: string;
  addedDate: string;
  status: string;
  assignedAgent: {
    name: string;
    avatar?: string;
    initials: string;
  };
  lastContact: string;
  nextFollowUp: string;
  source: string;
  contact: {
    whatsapp: string;
    mobile: string;
    email: string;
  };
  preferences: {
    budget: string;
    type: string;
    timeline: string;
  };
  activityLog: {
    type: string;
    title: string;
    date: string;
    description?: string;
    details?: {
      price: string;
      specs: string;
      image: string;
    };
    badges?: string[];
    iconName?: string;
  }[];
}

interface BuyerDetailViewProps {
  buyer: BuyerDetail | null;
  id: string;
}

const buyerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.string().optional(),
  status: z.string(),
  assignedAgent: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  mobile: z.string().optional(),
  whatsapp: z.string().optional(),
  budget: z.string().optional(),
  propertyType: z.string().optional(),
  timeline: z.string().optional(),
  rating: z.number(),
});

type BuyerFormValues = z.infer<typeof buyerFormSchema>;

// ... imports

export function BuyerDetailView({ buyer, id }: BuyerDetailViewProps) {
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<BuyerFormValues>({
    resolver: zodResolver(buyerFormSchema),
    defaultValues: {
      name: buyer?.name || "",
      location: buyer?.location || "",
      status: buyer?.status || "New",
      assignedAgent: buyer?.assignedAgent?.name || "",
      email: buyer?.contact?.email || "",
      mobile: buyer?.contact?.mobile || "",
      whatsapp: buyer?.contact?.whatsapp || "",
      budget: buyer?.preferences?.budget || "",
      propertyType: buyer?.preferences?.type || "",
      timeline: buyer?.preferences?.timeline || "",
      rating: 0,
    },
  });

  async function onSubmit(data: BuyerFormValues) {
    setIsSaving(true);
    try {
      const result = await updateBuyer(id, data);
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
              <div className="flex items-center justify-center gap-2 text-muted-foreground mt-1 text-sm">
                <MapPin className="size-4" />
                <span>{buyer.location}</span>
              </div>
            </div>

            <div className="flex justify-center gap-2">
               <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                       <FormControl>
                          <Rating 
                            value={field.value} 
                            onValueChange={field.onChange}
                            className="gap-1"
                          />
                       </FormControl>
                    </FormItem>
                  )}
                />
            </div>
          </CardContent>
          <div className="border-t p-4 bg-muted/20">
            <div className="grid grid-cols-2 gap-4 text-center">
               <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Status</div>
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                         <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger className="h-8 mt-1">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="New">New</SelectItem>
                                <SelectItem value="Contacted">Contacted</SelectItem>
                                <SelectItem value="Qualified">Qualified</SelectItem>
                                <SelectItem value="Lost">Lost</SelectItem>
                              </SelectContent>
                            </Select>
                         </FormControl>
                      </FormItem>
                    )}
                  />
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
                    <p className="text-sm font-medium">{buyer.contact.mobile}</p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="bg-primary/10 p-2 rounded-full text-primary">
                    <Mail className="size-4" />
                 </div>
                 <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium truncate w-40">{buyer.contact.email}</p>
                 </div>
              </div>
           </CardContent>
        </Card>
      </div>
    </Card>
  );

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
                 <Button type="button" variant="outline" size="sm" className="flex-shrink-0">Cancel</Button>
                 <Button type="submit" size="sm" disabled={isSaving} className="flex-shrink-0">
                    {isSaving ? "Saving..." : "Save Changes"}
                 </Button>
              </div>
            </>
          }
          overview={Overview}
          content={
            <Card className="h-full border-none shadow-none bg-transparent p-0">
               <Tabs defaultValue="details" className="w-full">
                  <TabsList className="gap-6">
                     <TabsTrigger 
                        value="details" 
                        className="py-3"
                      >
                        Details
                     </TabsTrigger>
                     <TabsTrigger 
                        value="activity" 
                        className="py-3"
                      >
                        Activity
                     </TabsTrigger>
                     <TabsTrigger 
                        value="notes" 
                        className="py-3"
                      >
                        Notes
                     </TabsTrigger>
                  </TabsList>
                  
                  <div className="py-6">
                    <TabsContent value="details" className="space-y-6 m-0">
                       <Card>
                          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                   <FormItem>
                                      <FormLabel>Full Name</FormLabel>
                                      <FormControl>
                                         <Input {...field} />
                                      </FormControl>
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
                                      <FormControl>
                                         <Input {...field} />
                                      </FormControl>
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
                                      <FormControl>
                                         <Input {...field} />
                                      </FormControl>
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
                                      <FormControl>
                                         <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                   </FormItem>
                                )}
                             />
                          </CardContent>
                       </Card>

                       <Card>
                          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <FormField
                                control={form.control}
                                name="budget"
                                render={({ field }) => (
                                   <FormItem>
                                      <FormLabel>Budget Range</FormLabel>
                                      <FormControl>
                                         <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                   </FormItem>
                                )}
                             />
                             <FormField
                                control={form.control}
                                name="propertyType"
                                render={({ field }) => (
                                   <FormItem>
                                      <FormLabel>Property Type</FormLabel>
                                      <FormControl>
                                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger>
                                               <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                               <SelectItem value="Apartment">Apartment</SelectItem>
                                               <SelectItem value="Villa">Villa</SelectItem>
                                               <SelectItem value="Plot">Plot</SelectItem>
                                               <SelectItem value="Commercial">Commercial</SelectItem>
                                            </SelectContent>
                                         </Select>
                                      </FormControl>
                                      <FormMessage />
                                   </FormItem>
                                )}
                             />
                             <FormField
                                control={form.control}
                                name="timeline"
                                render={({ field }) => (
                                   <FormItem>
                                      <FormLabel>Timeline</FormLabel>
                                      <FormControl>
                                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger>
                                               <SelectValue placeholder="Select timeline" />
                                            </SelectTrigger>
                                            <SelectContent>
                                               <SelectItem value="Immediate">Immediate</SelectItem>
                                               <SelectItem value="1-3 Months">1-3 Months</SelectItem>
                                               <SelectItem value="3-6 Months">3-6 Months</SelectItem>
                                               <SelectItem value="6+ Months">6+ Months</SelectItem>
                                            </SelectContent>
                                         </Select>
                                      </FormControl>
                                      <FormMessage />
                                   </FormItem>
                                )}
                             />
                             <FormField
                                control={form.control}
                                name="location"
                                render={({ field }) => (
                                   <FormItem>
                                      <FormLabel>Preferred Location</FormLabel>
                                      <FormControl>
                                         <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                   </FormItem>
                                )}
                             />
                          </CardContent>
                       </Card>
                    </TabsContent>

                    <TabsContent value="activity" className="m-0">
                       <Card>
                          <CardContent className="p-6">
                            <h3 className="text-lg font-bold mb-6">Recent Activity</h3>
                             <div className="relative border-l border-muted ml-4 pl-8 space-y-8 pb-4">
                                {buyer.activityLog.map((activity, index) => (
                                   <div key={index} className="relative">
                                      <div className={cn("absolute -left-8 -translate-x-1/2 top-1 bg-background rounded-full border p-1.5 z-10 shadow-sm text-primary")}>
                                         <Eye className="size-4" />
                                      </div>
                                      <div className="flex flex-col gap-1">
                                         <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-bold text-foreground">{activity.title}</h4>
                                            <span className="text-xs text-muted-foreground">{activity.date}</span>
                                         </div>
                                         {activity.description && (
                                            <p className="text-sm text-muted-foreground mt-1 bg-muted/30 p-3 rounded-md border">
                                               {activity.description}
                                            </p>
                                         )}
                                      </div>
                                   </div>
                                ))}
                             </div>
                          </CardContent>
                       </Card>
                    </TabsContent>

                    <TabsContent value="notes" className="m-0">
                       <Card>
                          <CardContent className="p-6">
                             <div className="space-y-4">
                                <Textarea placeholder="Add a note..." className="min-h-[100px]" />
                                <div className="flex justify-end">
                                   <Button>Add Note</Button>
                                </div>
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
