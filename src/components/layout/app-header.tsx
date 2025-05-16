"use client";

import { appConfig } from "@/lib/config";
import Link from "next/link";
import { UserButton } from "@/components/layout/user-button";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/app" className="flex items-center space-x-2">
              <span className="text-lg font-bold">{appConfig.projectName}</span>
            </Link>
          </div>

          {/* User Menu */}
          <UserButton />
        </div>
      </div>
    </header>
  );
} 