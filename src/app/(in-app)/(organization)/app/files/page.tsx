import { Metadata } from "next";
import { FileManagerClient } from "@/components/files/file-manager-client";

export const metadata: Metadata = {
  title: "Files Manager",
  description: "Manage your organization's files",
};

export default function FilesPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Files Manager</h1>
          <p className="text-muted-foreground">
            View and manage all your organization's files in one place
          </p>
        </div>
      </div>
      
      <FileManagerClient />
    </div>
  );
}
