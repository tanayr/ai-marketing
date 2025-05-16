"use client";

import React from 'react';
import { appConfig } from '@/lib/config';
import useUser from "@/lib/users/useUser";
import Link from "next/link";
import { UserDropdown } from "@/components/in-app/user-dropdown";
import { InAppFooter } from "@/components/layout/in-app-footer";
import { PageLoader } from "@/components/in-app/page-loader";

function UserLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background">
        <div className="container max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-6">
              <h1 className="text-xl font-semibold">
                {appConfig.projectName}
              </h1>
            </Link>

            {/* Account Dropdown */}
            <UserDropdown user={user || null} variant="compact" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto py-6 px-4 flex-1">
        {children}
      </main>

      <InAppFooter />
    </div>
  );
}

export default UserLayout