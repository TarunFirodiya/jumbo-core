"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  Search,
  MessageSquare,
  UserPlus,
  Command,
  MoreVertical,
  Bell,
  LogOut,
  User,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import * as React from "react";

export function DashboardHeader() {
  const [mounted, setMounted] = React.useState(false);
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

  return (
    <header className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 border-b bg-card sticky top-0 z-10 w-full">
      <SidebarTrigger className="-ml-1 sm:-ml-2" />
      <h1 className="text-base sm:text-lg font-medium flex-1 truncate">Dashboard</h1>

      <div className="hidden md:block relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
        <Input
          placeholder="Search Anything..."
          className="pl-10 pr-14 w-[180px] lg:w-[220px] h-9 bg-card border"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-muted px-1 py-0.5 rounded text-xs text-muted-foreground">
          <Command className="size-3" />
          <span>K</span>
        </div>
      </div>

      <ThemeToggle />

      {mounted ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Bell className="size-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Notifications</h4>
                <p className="text-sm text-muted-foreground">
                  You have no new notifications.
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        <Button variant="ghost" size="icon" className="hidden sm:flex">
          <Bell className="size-5" />
        </Button>
      )}

      {/* User Menu */}
      {mounted ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{profile?.fullName || user?.email}</p>
              <p className="text-xs text-muted-foreground">{profile?.role || "User"}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="size-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="size-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button variant="ghost" size="icon" className="hidden sm:flex">
          <Avatar className="h-8 w-8">
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </Button>
      )}

      {mounted ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="sm:hidden h-8 w-8">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Search className="size-4 mr-2" />
              Search
            </DropdownMenuItem>
            <DropdownMenuItem>
              <MessageSquare className="size-4 mr-2" />
              Messages
            </DropdownMenuItem>
            <DropdownMenuItem>
              <UserPlus className="size-4 mr-2" />
              Invite
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="size-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button variant="ghost" size="icon" className="sm:hidden h-8 w-8">
          <MoreVertical className="size-4" />
        </Button>
      )}
    </header>
  );
}
