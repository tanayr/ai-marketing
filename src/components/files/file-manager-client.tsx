"use client";

import { useState } from "react";
import useOrganization from "@/lib/organizations/useOrganization";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileIcon, MoreVertical, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import useSWR from "swr";
import Image from "next/image";

type FileRecord = {
  id: string;
  fileName: string;
  fileUrl: string;
  contentType: string;
  filePath: string;
  fileSize?: string;
  createdAt: string;
  userId: string;
  // Fields for distinguishing between uploads and assets
  isAsset?: boolean;
  fileType?: string;
  studioTool?: string | null;
};

export function FileManagerClient() {
  const { toast } = useToast();
  const { organization } = useOrganization();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Fetch organization files
  const { data, error, mutate } = useSWR<{ files: FileRecord[] }>(
    organization ? `/api/organizations/${organization.slug}/files` : null,
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }
      return response.json();
    }
  );

  const isLoading = !data && !error;
  const files = data?.files || [];

  // Function to delete a file
  const deleteFile = async (id: string, isAsset: boolean = false) => {
    setIsDeleting(id);
    try {
      const response = await fetch(
        `/api/organizations/${organization?.slug}/files?fileId=${id}&isAsset=${isAsset}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete file');
      }

      // Refresh files list
      await mutate();
      
      toast({
        title: isAsset ? 'Asset deleted' : 'File deleted',
        description: `The ${isAsset ? 'asset' : 'file'} has been deleted successfully.`,
      });
    } catch (error) {
      console.error(`Error deleting ${isAsset ? 'asset' : 'file'}:`, error);
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  // Helper function to format file size
  const formatFileSize = (bytes?: string) => {
    if (!bytes) return "Unknown";
    
    const size = parseInt(bytes, 10);
    if (isNaN(size)) return "Unknown";
    
    if (size < 1024) return `${size} bytes`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Helper function to determine if file is an image
  const isImage = (contentType: string) => {
    return contentType.startsWith("image/");
  };

  return (
    <div>
      {isLoading ? (
        <div className="text-center py-4">Loading files...</div>
      ) : error ? (
        <div className="text-center py-4 text-red-500">
          Error loading files. Please try again.
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          No files found. Upload files using the various tools available in the application.
        </div>
      ) : (
        <Table>
          <TableCaption>A list of your organization's files.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Preview</TableHead>
              <TableHead>File Name</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id}>
                <TableCell>
                  {isImage(file.contentType) ? (
                    <div className="relative h-12 w-12 rounded overflow-hidden">
                      <Image
                        src={file.fileUrl}
                        alt={file.fileName}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <FileIcon className="h-10 w-10 text-muted-foreground" />
                  )}
                </TableCell>
                <TableCell className="font-medium">{file.fileName}</TableCell>
                <TableCell>
                  {file.isAsset ? (
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
                      Asset
                    </span>
                  ) : (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                      Upload
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {file.isAsset ? file.studioTool : file.contentType}
                </TableCell>
                <TableCell>
                  {file.isAsset ? "N/A" : formatFileSize(file.fileSize)}
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(file.createdAt), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>
                        {file.isAsset ? "Asset Actions" : "File Actions"}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="cursor-pointer"
                        >
                          View {file.isAsset ? "Asset" : "File"}
                        </a>
                      </DropdownMenuItem>
                      {file.isAsset && (
                        <DropdownMenuItem asChild>
                          <a
                            href={`/app/studio/${file.studioTool}/editor/${file.id}`}
                            className="cursor-pointer"
                          >
                            Edit in Studio
                          </a>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-red-500 focus:text-red-500"
                        onClick={() => deleteFile(file.id, !!file.isAsset)}
                        disabled={isDeleting === file.id}
                      >
                        {isDeleting === file.id ? (
                          "Deleting..."
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete {file.isAsset ? "Asset" : "File"}
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
