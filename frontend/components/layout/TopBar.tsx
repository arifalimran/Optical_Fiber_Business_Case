"use client";

import { Bell, Search, Menu, LogOut, User, Settings as SettingsIcon, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth/useAuth";

interface TopBarProps {
  onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user, logout } = useAuth();

  // Get user initials for avatar
  const getInitials = () => {
    if (!user) return 'U';
    const names = user.fullName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return user.fullName.substring(0, 2).toUpperCase();
  };

  // Get role badge color
  const getRoleBadge = () => {
    if (!user) return null;
    const colors = {
      ADMIN: 'text-purple-600 bg-purple-100',
      APPROVER: 'text-blue-600 bg-blue-100',
      ANALYST: 'text-green-600 bg-green-100',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${colors[user.role]}`}>
        {user.role}
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-md px-6 shadow-sm">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden hover:bg-primary/10"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input
            type="search"
            placeholder="Search projects, reports..."
            className="w-full rounded-xl border border-border bg-muted/30 pl-10 pr-4 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-background transition-all duration-200 hover:bg-muted/50"
          />
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right Side Actions */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-10 w-10">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-600" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="space-y-2 p-2">
              <div className="rounded-lg border p-3 text-sm">
                <p className="font-medium">Project Update</p>
                <p className="text-xs text-muted-foreground">
                  HDD Machine installation completed for Site A
                </p>
                <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
              </div>
              <div className="rounded-lg border p-3 text-sm">
                <p className="font-medium">Budget Alert</p>
                <p className="text-xs text-muted-foreground">
                  Project costs approaching 80% of budget
                </p>
                <p className="text-xs text-muted-foreground mt-1">5 hours ago</p>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.fullName || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || ''}
                </p>
                <div className="mt-1">{getRoleBadge()}</div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <SettingsIcon className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Users className="mr-2 h-4 w-4" />
              Team
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 focus:text-red-600"
              onClick={() => logout()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Logout Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => logout()}
          className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900 transition-all duration-200 hover:shadow-md hover:scale-105"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline font-medium">Logout</span>
        </Button>
      </div>
    </header>
  );
}
