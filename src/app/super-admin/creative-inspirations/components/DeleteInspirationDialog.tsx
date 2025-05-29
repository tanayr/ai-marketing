"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { CreativeInspiration } from "@/db/schema/creative-inspirations";

interface DeleteInspirationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspiration: CreativeInspiration | null;
  onSuccess: () => void;
}

export function DeleteInspirationDialog({
  open,
  onOpenChange,
  inspiration,
  onSuccess,
}: DeleteInspirationDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!inspiration) return;

    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/super-admin/creative-inspirations/${inspiration.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete inspiration");
      }

      onSuccess();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred");
      }
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!inspiration) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Creative Inspiration</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{inspiration.name}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
