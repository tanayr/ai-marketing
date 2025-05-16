"use client";

import React, { useState, useEffect } from "react";
import useUser from "@/lib/users/useUser";
import useOrganization from "@/lib/organizations/useOrganization";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Boxes,
  LifeBuoy,
  Settings,
  Menu,
  ChevronLeft,
  FileText,
  Map,
  CreditCard,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { InAppFooter } from "@/components/layout/in-app-footer";
import { UserDropdown } from "@/components/in-app/user-dropdown";
import { PageLoader } from "@/components/in-app/page-loader";
import { OrganizationSwitcher } from "@/components/in-app/organization-switcher";

function NavItem({
  href,
  icon: Icon,
  children,
  className,
  isNew,
  isCollapsed,
}: {
  href: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
  isNew?: boolean;
  isCollapsed?: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  const content = (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        isCollapsed && "justify-center px-2",
        className
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5",
          "transition-transform duration-100",
          isActive ? "text-inherit" : "text-inherit"
        )}
      />
      {!isCollapsed && (
        <>
          <span>{children}</span>
          {isNew && (
            <Badge
              variant="secondary"
              className="ml-auto text-[10px] h-4 bg-accent/10 text-accent font-medium"
            >
              New
            </Badge>
          )}
        </>
      )}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {children}
          {isNew && " (New)"}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

function SidebarContent({ className, isCollapsed }: { className?: string; isCollapsed?: boolean }) {
  const { user } = useUser();

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Organization Switcher */}
      <div className={cn("mb-6", isCollapsed ? "px-2" : "px-2")}>
        <OrganizationSwitcher isCollapsed={isCollapsed} />
      </div>

      {/* Main Navigation */}
      <nav className={cn("space-y-1 flex-1", isCollapsed ? "px-2" : "px-2")}>
        <NavItem href="/app" icon={LayoutDashboard} isCollapsed={isCollapsed}>
          Dashboard
        </NavItem>
        <NavItem href="/app/stuff" icon={Boxes} isCollapsed={isCollapsed}>
          Stuff
        </NavItem>
        <NavItem href="/app/support" icon={LifeBuoy} isCollapsed={isCollapsed}>
          Support
        </NavItem>
        <NavItem
          href="https://docs.indiekit.com"
          icon={FileText}
          isCollapsed={isCollapsed}
          className="!text-muted-foreground hover:!text-accent-foreground"
        >
          Documentation
        </NavItem>
        <NavItem
          href="https://roadmap.indiekit.com"
          icon={Map}
          isCollapsed={isCollapsed}
          className="!text-muted-foreground hover:!text-accent-foreground"
        >
          Roadmap
        </NavItem>
      </nav>

      {/* Divider */}
      <div
        className={cn(
          "my-2 border-t border-border/40",
          isCollapsed ? "mx-2" : "mx-2"
        )}
      />

      {/* Bottom Navigation */}
      <div className={cn("space-y-1", isCollapsed ? "px-2" : "px-2")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                "rounded-md",
                isCollapsed && "justify-center px-2"
              )}
            >
              <Settings className="h-5 w-5 text-inherit" />
              {!isCollapsed && "Settings"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={isCollapsed ? "center" : "start"}
            className="w-48"
          >
            <DropdownMenuItem asChild>
              <Link href="/app/settings" className="flex items-center font-medium">
                <Settings className="h-4 w-4 mr-2 text-inherit" />
                General
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/app/settings/team" className="flex items-center font-medium">
                <Users className="h-4 w-4 mr-2 text-inherit" />
                Team
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/app/settings/billing" className="flex items-center font-medium">
                <CreditCard className="h-4 w-4 mr-2 text-inherit" />
                Billing
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <UserDropdown 
          user={user || null} 
          variant={isCollapsed ? "compact" : "full"} 
        />
      </div>
    </div>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoading: isUserLoading } = useUser();
  const { organization, isLoading: isOrgLoading } = useOrganization();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Close mobile menu when route changes
  const pathname = usePathname();
  useEffect(() => {
    // Remove the setIsMobileOpen call since we no longer need it
  }, [pathname]);

  useEffect(() => {
    if (!isUserLoading && !isOrgLoading && !organization) {
      router.push("/app/create-organization");
    }
  }, [isUserLoading, isOrgLoading, organization, pathname, router]);

  if (isUserLoading || isOrgLoading) {
    return <PageLoader />;
  }

  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-background">
        {/* Desktop Sidebar */}
        <div
          className={cn(
            "hidden md:flex flex-col border-r border-border/40",
            isCollapsed ? "w-[80px]" : "w-64",
            "transition-all duration-300"
          )}
        >
          <div className="p-3 flex-1">
            <SidebarContent isCollapsed={isCollapsed} />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="mb-3 mx-auto hover:bg-accent"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 text-inherit transition-transform duration-100",
                isCollapsed && "rotate-180"
              )}
            />
            <span className="sr-only">
              {isCollapsed ? "Expand" : "Collapse"} Sidebar
            </span>
          </Button>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-border/40 bg-background z-30 px-4">
          <div className="flex items-center justify-between h-full">
            <div className="w-[180px]">
              <OrganizationSwitcher />
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-accent">
                  <Menu className="h-5 w-5 text-inherit" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 p-0 pt-16">
                <div className="p-3">
                  <SidebarContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-auto md:pt-0 pt-16">
            <div className="p-6 max-w-7xl mx-auto w-full">{children}</div>
          </div>
          <InAppFooter />
        </div>
      </div>
    </TooltipProvider>
  );
}

export default AppLayout;
