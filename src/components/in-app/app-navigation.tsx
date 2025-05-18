"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Store,
  FileImage,
  Paintbrush,
  ShoppingBag,
  Settings,
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
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type NavItemProps = {
  href: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
  isNew?: boolean;
  isCollapsed?: boolean;
  isExternal?: boolean;
};

function NavItem({
  href,
  icon: Icon,
  children,
  className,
  isNew,
  isCollapsed,
  isExternal,
}: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  const content = (
    <Link
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
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

type AppNavigationProps = {
  isCollapsed?: boolean;
  className?: string;
};

export function AppNavigation({ isCollapsed, className }: AppNavigationProps) {
  return (
    <div className={cn("flex flex-col h-full flex-grow", className)}>
      {/* Top Navigation */}
      <div className="flex-shrink-0">
        <nav className={cn("space-y-1", isCollapsed ? "px-2" : "px-2")}>
          <NavItem href="/app" icon={LayoutDashboard} isCollapsed={isCollapsed}>
            Dashboard
          </NavItem>
          
          {/* Studio section */}
          <NavItem 
            href="/app/studio" 
            icon={Paintbrush} 
            isCollapsed={isCollapsed}
            isNew
          >
            Studios
          </NavItem>
          
          {/* Assets section */}
          <NavItem 
            href="/app/assets" 
            icon={FileImage} 
            isCollapsed={isCollapsed}
          >
            My Assets
          </NavItem>
          
          {/* Products section */}
          <NavItem 
            href="/app/products" 
            icon={ShoppingBag} 
            isCollapsed={isCollapsed}
          >
            My Products
          </NavItem>
        </nav>
      </div>

      {/* This empty div will take up all available space */}
      <div className="flex-grow"></div>

      {/* Bottom Navigation */}
      <div className="flex-shrink-0 mt-auto">
        {/* Divider */}
        <div
          className={cn(
            "my-2 border-t border-border/40",
            isCollapsed ? "mx-2" : "mx-2"
          )}
        />

        {/* Bottom items */}
        <div className={cn("space-y-1", isCollapsed ? "px-2" : "px-2")}>
          {/* Stores section */}
          <NavItem 
            href="/app/stores" 
            icon={Store} 
            isCollapsed={isCollapsed}
          >
            My Stores
          </NavItem>
          
          {/* Settings dropdown */}
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
        </div>
      </div>
    </div>
  );
}
