import { User, LogOut } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserDropdownProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  variant?: "full" | "compact";
  triggerClassName?: string;
}

const getInitials = (name?: string | null, email?: string | null) => {
  if (name) {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase();
  }
  if (email) {
    return email
      .split("@")[0]
      .slice(0, 2)
      .toUpperCase();
  }
  return "U";
};

export function UserDropdown({ user, variant = "compact", triggerClassName }: UserDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "gap-2 px-2 py-1.5",
            variant === "full" && "w-full justify-start",
            triggerClassName
          )}
        >
          <Avatar className="h-8 w-8 rounded-full">
            <AvatarImage src={user?.image || undefined} alt="" />
            <AvatarFallback>
              {getInitials(user?.name, user?.email)}
            </AvatarFallback>
          </Avatar>
          {variant === "full" && (
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-medium leading-none">
                {user?.name || 'Anonymous'}
              </span>
              {user?.email && (
                <span className="text-xs text-muted-foreground mt-1">
                  {user.email}
                </span>
              )}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center gap-3 p-2 pb-3">
          <Avatar className="h-9 w-9 rounded-full">
            <AvatarImage src={user?.image || undefined} alt="" />
            <AvatarFallback>
              {getInitials(user?.name, user?.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-none">
              {user?.name || 'Anonymous'}
            </span>
            <span className="text-xs text-muted-foreground">
              {user?.email}
            </span>
          </div>
        </div>
        <DropdownMenuItem asChild>
          <Link href="/app/account" className="flex items-center font-medium">
            <User className="h-4 w-4 mr-2 text-inherit" />
            Account Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => signOut()}
          className="flex items-center text-destructive focus:text-destructive font-medium"
        >
          <LogOut className="h-4 w-4 mr-2 text-inherit" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 