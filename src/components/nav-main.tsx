"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-medium text-muted-foreground/70">
        Platform
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton 
                  tooltip={item.title}
                  className={cn(
                    "group relative flex w-full items-center rounded-xl px-4 py-2.5",
                    "hover:bg-accent/50 hover:text-accent-foreground",
                    "focus-visible:bg-accent focus-visible:text-accent-foreground",
                    "transition-colors duration-200",
                    item.isActive && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  {item.icon && (
                    <item.icon className={cn(
                      "mr-3 h-4 w-4",
                      "transition-transform duration-200 group-hover:scale-110",
                      item.isActive && "text-primary"
                    )} />
                  )}
                  <span className="flex-1 truncate">{item.title}</span>
                  <ChevronRight className={cn(
                    "ml-auto h-4 w-4 text-muted-foreground/70",
                    "transition-transform duration-200",
                    "group-data-[state=open]/collapsible:rotate-90"
                  )} />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton 
                        asChild
                        className="group relative flex w-full items-center rounded-lg px-8 py-2 text-sm
                          hover:bg-accent/50 hover:text-accent-foreground
                          focus-visible:bg-accent focus-visible:text-accent-foreground
                          transition-colors duration-200"
                      >
                        <a href={subItem.url}>
                          <span className="truncate">{subItem.title}</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
