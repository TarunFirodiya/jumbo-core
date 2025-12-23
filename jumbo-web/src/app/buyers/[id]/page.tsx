"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
  MessageSquare
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getBuyerById } from "@/mock-data/buyers";

export default function BuyerDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [activeTab, setActiveTab] = React.useState("Activity");
  
  const buyer = getBuyerById(id);

  if (!buyer) {
    return (
      <SidebarProvider className="bg-sidebar">
        <DashboardSidebar />
        <div className="h-svh w-full flex flex-col bg-background">
          <DashboardHeader />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Buyer not found</h2>
              <p className="text-muted-foreground">The buyer with ID {id} does not exist.</p>
              <Button asChild className="mt-4">
                <Link href="/buyers">Back to Buyers</Link>
              </Button>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  const tabs = ["Activity", `Visits (${Math.floor(Math.random() * 5)})`, "Preferences", "Matching Homes", "Communication", "Notes (2)"];

  return (
    <SidebarProvider className="bg-sidebar">
      <DashboardSidebar />
      <div className="h-svh overflow-hidden w-full flex flex-col bg-background">
        <DashboardHeader />
        
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
           <div className="max-w-7xl mx-auto space-y-6">
              
              {/* Breadcrumbs */}
              <div className="flex items-center text-sm text-muted-foreground mb-4">
                <Link href="/buyers" className="hover:text-foreground transition-colors">Buyers</Link>
                <ChevronRight className="size-4 mx-1" />
                <span className="text-foreground font-medium">{buyer.name}</span>
              </div>

              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="size-16 md:size-20 border-2 border-background shadow-sm">
                    <AvatarFallback className="text-xl md:text-3xl font-bold">
                        {buyer.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">{buyer.name}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1 text-sm">
                      <MapPin className="size-4" />
                      <span>{buyer.location}</span>
                      <span className="text-muted-foreground/50">•</span>
                      <Clock className="size-4" />
                      <span>Added {buyer.addedDate}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" className="gap-2">
                    <Edit className="size-4" />
                    Edit Details
                  </Button>
                  <Button className="gap-2">
                    <Plus className="size-4" />
                    Log Interaction
                  </Button>
                </div>
              </div>

              {/* Main Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                
                {/* Left Sidebar */}
                <div className="space-y-6">
                  
                  {/* Status & Assignment */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                      <CardTitle className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Status & Assignment</CardTitle>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Current Stage</span>
                        <Badge variant="secondary" className="font-medium px-3 py-1">
                          {buyer.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Assigned Agent</span>
                        <div className="flex items-center gap-2">
                           <Avatar className="size-6">
                              <AvatarImage src={buyer.assignedAgent.avatar} />
                              <AvatarFallback className="text-[10px]">{buyer.assignedAgent.initials}</AvatarFallback>
                           </Avatar>
                           <span className="text-sm font-medium">{buyer.assignedAgent.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Last Contact</span>
                        <span className="text-sm font-medium">{buyer.lastContact}</span>
                      </div>
                       <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Next Follow Up</span>
                        <span className="text-sm font-medium">{buyer.nextFollowUp}</span>
                      </div>
                       <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Source</span>
                        <span className="text-sm font-medium">{buyer.source}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contact Information */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                      <CardTitle className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Contact Information</CardTitle>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <Edit className="size-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-muted p-2 rounded-md shrink-0">
                           <MessageSquare className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                           <p className="text-sm font-medium">{buyer.contact.whatsapp}</p>
                           <p className="text-xs text-muted-foreground">Whatsapp</p>
                        </div>
                        <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 text-muted-foreground hover:text-foreground">
                           <MessageSquare className="size-4" />
                        </Button>
                      </div>
                      <div className="flex items-start gap-3">
                         <div className="bg-muted p-2 rounded-md shrink-0">
                           <Phone className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                           <p className="text-sm font-medium">{buyer.contact.mobile}</p>
                           <p className="text-xs text-muted-foreground">Mobile</p>
                        </div>
                        <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 text-muted-foreground hover:text-foreground">
                           <Phone className="size-4" />
                        </Button>
                      </div>
                      <div className="flex items-start gap-3">
                         <div className="bg-muted p-2 rounded-md shrink-0">
                           <Mail className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                           <p className="text-sm font-medium truncate max-w-[150px] sm:max-w-[180px]">{buyer.contact.email}</p>
                           <p className="text-xs text-muted-foreground">Email</p>
                        </div>
                         <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 text-muted-foreground hover:text-foreground">
                           <Mail className="size-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                   {/* Buying Preferences */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                      <CardTitle className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Buying Preferences</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-xs font-bold text-muted-foreground tracking-wide uppercase">Budget</span>
                           <span className="text-sm font-bold text-foreground">{buyer.preferences.budget}</span>
                        </div>
                         <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-3/4 rounded-full" />
                         </div>
                      </div>
                       <div className="flex items-center justify-between border-b border-border/50 pb-3">
                        <span className="text-sm text-muted-foreground">Property Type</span>
                         <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{buyer.preferences.type}</span>
                         </div>
                      </div>
                       <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Timeline</span>
                        <div className="flex items-center gap-2">
                            <Clock className="size-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{buyer.preferences.timeline}</span>
                         </div>
                      </div>
                    </CardContent>
                  </Card>

                </div>

                {/* Right Content */}
                <div className="lg:col-span-2 space-y-6">
                   
                   {/* Tabs */}
                   <div className="border-b">
                      <div className="flex gap-6 overflow-x-auto no-scrollbar pb-px">
                        {tabs.map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                              "pb-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2",
                              activeTab === tab
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                            )}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                   </div>
                   
                   {/* Tab Content */}
                   <div className="space-y-8 animate-in fade-in duration-500">
                      <div>
                         <h3 className="text-lg font-bold mb-6">Recent Activity</h3>
                         
                         <div className="relative border-l border-muted ml-4 pl-8 space-y-8 pb-4">
                            
                            {/* Note Input */}
                             <div className="mb-10 relative">
                                <div className="absolute -left-8 -translate-x-1/2 top-0 bg-background rounded-full p-1 border border-muted z-10 shadow-sm">
                                   <Avatar className="size-8">
                                      <AvatarFallback className="text-xs">ME</AvatarFallback>
                                   </Avatar>
                                </div>
                                <Card className="p-0 overflow-hidden border-muted shadow-sm group focus-within:ring-1 focus-within:ring-ring">
                                  <div className="p-4">
                                     <Textarea 
                                      placeholder="Add a note or log a call..." 
                                      className="min-h-[80px] border-none focus-visible:ring-0 p-0 resize-none shadow-none text-sm"
                                     />
                                  </div>
                                  <div className="bg-muted/30 p-2 flex items-center justify-between border-t">
                                     <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
                                        <Paperclip className="size-4" />
                                     </Button>
                                     <Button size="sm" className="h-8">
                                        Post Note
                                     </Button>
                                  </div>
                                </Card>
                             </div>

                            {/* Activity Items */}
                            {buyer.activityLog.map((activity, index) => (
                               <div key={index} className="relative">
                                  <div className={cn("absolute -left-8 -translate-x-1/2 top-1 bg-background rounded-full border p-1.5 z-10 shadow-sm text-primary")}>
                                     {activity.icon ? <activity.icon className="size-4" /> : <Eye className="size-4" />}
                                  </div>
                                  <div className="flex flex-col gap-1">
                                     <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-foreground">{activity.title}</h4>
                                        <span className="text-xs text-muted-foreground">{activity.date}</span>
                                     </div>
                                     
                                     {activity.description && (
                                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed bg-muted/30 p-3 rounded-md border border-muted/50">
                                           {activity.description}
                                        </p>
                                     )}

                                     {activity.details && (
                                        <Card className="mt-2 overflow-hidden border-muted shadow-none">
                                           <div className="flex">
                                              <div className="w-24 bg-muted shrink-0 relative flex items-center justify-center">
                                                 <img src="/placeholder.svg" className="w-full h-full object-cover opacity-50" alt="" />
                                                 <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                                    <Eye className="size-6 opacity-20" />
                                                 </div>
                                              </div>
                                              <div className="p-3 flex flex-col justify-center">
                                                 <span className="text-base font-bold text-foreground block">{activity.details.price}</span>
                                                 <span className="text-xs text-muted-foreground block">{activity.details.specs}</span>
                                              </div>
                                           </div>
                                        </Card>
                                     )}

                                     {activity.badges && (
                                        <div className="flex gap-2 mt-1">
                                           {activity.badges.map(b => (
                                              <Badge key={b} variant="secondary" className="text-xs font-normal border px-2 py-0.5">
                                                 {b}
                                              </Badge>
                                           ))}
                                        </div>
                                     )}
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>

                </div>
              </div>

           </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
