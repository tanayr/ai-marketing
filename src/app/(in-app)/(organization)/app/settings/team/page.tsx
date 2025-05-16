"use client";

import { TeamProvider, TeamContent } from "./_components";

export default function TeamSettingsPage() {
  return (
    <TeamProvider>
      <TeamContent />
    </TeamProvider>
  );
}
