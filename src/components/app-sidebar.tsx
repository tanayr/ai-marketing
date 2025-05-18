"use client"

import * as React from "react"
import {
  Store,
  FileImage,
  Paintbrush,
  ShoppingBag,
  CreditCard,
  Settings,
  Users,
  Layers
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

// Application navigation data
const data = {
  user: {
    name: "User",
    email: "user@example.com",
    avatar: "/avatars/user.jpg",
  },
  navMain: [
    {
      title: "Studios",
      url: "/app/studio",
      icon: Paintbrush,
      items: [], // Currently empty as specified
    },
    {
      title: "My Assets",
      url: "/app/assets",
      icon: FileImage,
      items: [
        {
          title: "All Assets",
          url: "/app/assets",
        },
        {
          title: "Create New",
          url: "/app/studio",
        },
      ],
    },
    {
      title: "My Products",
      url: "/app/products",
      icon: ShoppingBag,
      items: [
        {
          title: "Product Catalog",
          url: "/app/products",
        },
      ],
    },
  ],
  navBottom: [
    {
      title: "My Stores",
      url: "/app/stores",
      icon: Store,
      items: [
        {
          title: "Stores",
          url: "/app/stores",
        },
        {
          title: "Products",
          url: "/app/stores/products", 
        },
      ],
    },
    {
      title: "Billing",
      url: "/app/settings/billing",
      icon: CreditCard,
      items: [],
    },
    {
      title: "Settings",
      url: "/app/settings",
      icon: Settings,
      items: [
        {
          title: "General",
          url: "/app/settings",
        },
        {
          title: "Team",
          url: "/app/settings/team",
        },
      ],
    },
  ],
  // Keep some projects for the team switcher
  teams: [
    {
      name: "Marketing Team",
      logo: Layers,
      plan: "Enterprise",
    },
  ],
}

export function AppSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar 
      collapsible="icon" 
      className={cn(
        "bg-gradient-to-b from-background/80 to-background border-r border-border/40 backdrop-blur-xl",
        className
      )}
      {...props}
    >
      <SidebarHeader className="border-b border-border/40 bg-background/50">
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent className="px-4 py-4">
        <div className="space-y-6">
          {/* Top navigation section */}
          <NavMain items={data.navMain} />
          
          {/* Bottom navigation section with separator */}
          <div className="pt-4 mt-6 border-t border-border/40">
            <NavMain items={data.navBottom} />
          </div>
        </div>
      </SidebarContent>
      <SidebarFooter className="border-t border-border/40 bg-background/50 p-4">
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail className="bg-border/40" />
    </Sidebar>
  )
}
