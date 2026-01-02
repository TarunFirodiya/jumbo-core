"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid,
  ChartArea, 
  Mail,
  Calendar,
  FileText,
  Folder,
  HelpCircle,
  Settings,
  ChevronRight,
  ChevronDown,
  Sparkles,
  PanelLeftClose,
  MoreHorizontal,
  ChevronsUpDown,
  Atom,
  LogOut,
  UserCircle,
  CreditCard,
  Globe,
  House,
  LucidePersonStanding,
  Banknote,
  Handshake,
} from "lucide-react";

import { useDashboardStore } from "@/store/dashboard-store";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

const menuItems = [
  {
    title: "AI Assistant",
    icon: Sparkles,
    href: "#",
    isGradient: true,
  },
  {
    title: "Dashboard",
    icon: LayoutGrid,
    href: "/",
  },
  {
    title: "Buyers",
    icon: LucidePersonStanding,
    href: "/buyers",
  },
  {
    title: "Sellers",
    icon: Banknote,
    href: "/sellers",
  },
  {
    title: "Visits",
    icon: Calendar,
    href: "/visits",
  },
  {
    title: "Listings",
    icon: House,
    href: "/listings",
  },
  {
    title: "Offers",
    icon: Handshake,
    href: "/offers",
  },
];


export function DashboardSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const [foldersOpen, setFoldersOpen] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);
  const activeTab = useDashboardStore((state) => state.activeTab);
  const setActiveTab = useDashboardStore((state) => state.setActiveTab);
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const userInitials = mounted && profile?.fullName
    ? profile.fullName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : mounted && user?.email?.[0].toUpperCase() || "U";

  const userName = mounted ? (profile?.fullName || user?.email?.split('@')[0] || "User") : "User";
  const userEmail = mounted ? (profile?.email || user?.email || "") : "";

  // Only calculate active state on client to avoid hydration mismatch
  const getIsActive = (item: typeof menuItems[0]) => {
    if (!mounted) return false;
    return item.href === "/" 
      ? pathname === "/" 
      : pathname.startsWith(item.href);
  };

  return (
    <Sidebar collapsible="offcanvas" className="font-sans lg:border-r-0!" {...props}>
      <SidebarHeader className="p-3 sm:p-4 lg:p-5 pb-0">
        <div className="flex items-center gap-2">
          <div className="flex size-5 items-center justify-center rounded bg-gradient-to-b from-black to-[#760000] text-white">
            <Atom className="size-3" />
          </div>
          <span className="font-semibold text-base sm:text-lg">Jumbo Core</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 sm:px-4 lg:px-5">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = getIsActive(item);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="h-9 sm:h-[38px] cursor-pointer"
                    >
                      <Link
                        href={item.href}
                        onClick={() => setActiveTab(item.title)}
                      >
                        <item.icon
                          className={`size-4 sm:size-5 ${
                            item.isGradient ? "text-[#6e3ff3]" : ""
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            item.isGradient
                              ? "bg-clip-text text-transparent bg-linear-to-r from-[#6e3ff3] to-[#df3674]"
                              : ""
                          }`}
                        >
                          {item.title}
                        </span>
                        {isActive && (
                          <ChevronRight className="ml-auto size-4 text-muted-foreground opacity-60" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        
      </SidebarContent>

      <SidebarFooter className="px-3 sm:px-4 lg:px-5 pb-3 sm:pb-4 lg:pb-5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-9 sm:h-[38px]">
              <Link href="#">
                <HelpCircle className="size-4 sm:size-5" />
                <span className="text-sm">Help Center</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-9 sm:h-[38px]">
              <Link href="#">
                <Settings className="size-4 sm:size-5" />
                <span className="text-sm">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

       

        {mounted && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors">
                <Avatar className="size-7 sm:size-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs sm:text-sm truncate">{userName}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                    {userEmail}
                  </p>
                </div>
                <ChevronsUpDown className="size-4 text-muted-foreground shrink-0" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem>
                <UserCircle className="size-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard className="size-4 mr-2" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="size-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
                <LogOut className="size-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {!mounted && (
          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg">
            <Avatar className="size-7 sm:size-8">
              <AvatarFallback className="text-xs">U</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs sm:text-sm truncate">User</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                Loading...
              </p>
            </div>
            <ChevronsUpDown className="size-4 text-muted-foreground shrink-0" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
