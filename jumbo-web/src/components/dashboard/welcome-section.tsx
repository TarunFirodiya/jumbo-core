"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Plus, Download, Upload, FileText } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";

export function WelcomeSection() {
  const [mounted, setMounted] = useState(false);
  const { profile, user } = useAuth();
  const [stats, setStats] = useState<{ newLeads: number; followUps: number } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Fetch today's stats for the user
    const fetchStats = async () => {
      if (!profile && !user) {
        setStats({ newLeads: 0, followUps: 0 });
        return;
      }

      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch new leads assigned to user today
        const leadsResponse = await fetch(`/api/v1/leads?status=new&page=1&limit=100`);
        let todayLeads = 0;
        let todayFollowUps = 0;

        if (leadsResponse.ok) {
          const leadsData = await leadsResponse.json();
          const userLeads = profile?.id 
            ? leadsData.data?.filter((lead: any) => lead.assignedAgentId === profile.id) || []
            : [];
          
          // Filter leads created today
          todayLeads = userLeads.filter((lead: any) => {
            if (!lead.createdAt) return false;
            const leadDate = new Date(lead.createdAt).toISOString().split('T')[0];
            return leadDate === today;
          }).length;
        }

        // Fetch seller leads with follow-up dates today
        const sellerLeadsResponse = await fetch(`/api/v1/seller-leads?page=1&limit=100`);
        if (sellerLeadsResponse.ok) {
          const sellerLeadsData = await sellerLeadsResponse.json();
          const userSellerLeads = profile?.id
            ? sellerLeadsData.data?.filter((lead: any) => lead.assignedToId === profile.id) || []
            : [];
          
          todayFollowUps = userSellerLeads.filter((lead: any) => {
            if (!lead.followUpDate) return false;
            const followUpDate = new Date(lead.followUpDate).toISOString().split('T')[0];
            return followUpDate === today;
          }).length;
        }

        setStats({
          newLeads: todayLeads,
          followUps: todayFollowUps,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
        // Set default stats if fetch fails
        setStats({ newLeads: 0, followUps: 0 });
      }
    };

    fetchStats();
  }, [mounted, profile, user]);

  const userName = mounted && profile?.fullName 
    ? profile.fullName.split(' ')[0] // First name only
    : mounted && user?.email?.split('@')[0] || 'User';

  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
      <div className="space-y-2 sm:space-y-5">
        <h2 className="text-lg sm:text-[24px] font-medium leading-relaxed">
          Welcome Back, {userName}!
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          {stats !== null ? (
            stats.newLeads > 0 || stats.followUps > 0 ? (
              <>
                Today you have{" "}
                {stats.newLeads > 0 && (
                  <span className="text-foreground font-medium">
                    {stats.newLeads} new {stats.newLeads === 1 ? 'lead' : 'leads'}
                  </span>
                )}
                {stats.newLeads > 0 && stats.followUps > 0 && ", "}
                {stats.followUps > 0 && (
                  <span className="text-foreground font-medium">
                    {stats.followUps} follow-up{stats.followUps === 1 ? '' : 's'} due
                  </span>
                )}
              </>
            ) : (
              "You're all caught up for today!"
            )
          ) : (
            <span>Loading your dashboard...</span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 sm:gap-3 h-8 sm:h-9 text-xs sm:text-sm">
              <span className="hidden xs:inline">Import/Export</span>
              <span className="xs:hidden">
                <Download className="size-4" />
              </span>
              <ChevronDown className="size-3 sm:size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Upload className="size-4 mr-2" />
              Import CSV
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Upload className="size-4 mr-2" />
              Import Excel
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="size-4 mr-2" />
              Export CSV
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FileText className="size-4 mr-2" />
              Export PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button size="sm" className="gap-2 sm:gap-3 h-8 sm:h-9 text-xs sm:text-sm bg-linear-to-b from-foreground to-foreground/90 text-background">
          <Plus className="size-3 sm:size-4" />
          <span className="hidden xs:inline">Create New</span>
          <span className="xs:hidden">New</span>
        </Button>
      </div>
    </div>
  );
}
