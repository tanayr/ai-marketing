"use client";

import { useState } from "react";
import { CreativeInspiration } from "@/db/schema/creative-inspirations";
import { Button } from "@/components/ui/button";
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Pencil, Trash, Plus, Image } from "lucide-react";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreateInspirationForm } from "@/app/super-admin/creative-inspirations/components/CreateInspirationForm";
import { EditInspirationForm } from "@/app/super-admin/creative-inspirations/components/EditInspirationForm";
import { DeleteInspirationDialog } from "@/app/super-admin/creative-inspirations/components/DeleteInspirationDialog";

export default function SuperAdminCreativeInspirationsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentInspiration, setCurrentInspiration] = useState<CreativeInspiration | null>(null);
  
  // Fetch all creative inspirations
  const { data: inspirations, error, mutate } = useSWR<CreativeInspiration[]>(
    "/api/super-admin/creative-inspirations"
  );

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    toast.success("Creative inspiration created successfully");
    mutate();
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    setCurrentInspiration(null);
    toast.success("Creative inspiration updated successfully");
    mutate();
  };

  const handleDeleteSuccess = () => {
    setIsDeleteDialogOpen(false);
    setCurrentInspiration(null);
    toast.success("Creative inspiration deleted successfully");
    mutate();
  };

  const openEditDialog = (inspiration: CreativeInspiration) => {
    setCurrentInspiration(inspiration);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (inspiration: CreativeInspiration) => {
    setCurrentInspiration(inspiration);
    setIsDeleteDialogOpen(true);
  };

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold mb-4">Creative Inspirations</h1>
        <div className="text-red-500">Error loading inspirations: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Creative Inspirations</h2>
          <p className="text-muted-foreground">
            Manage inspirations for the Retouchr studio
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Inspiration
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Creative Inspirations List</CardTitle>
          <CardDescription>
            These inspirations are available to all users in Retouchr Studio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Preview</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Dimensions</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!inspirations ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : inspirations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No creative inspirations found. Create your first one!
                  </TableCell>
                </TableRow>
              ) : (
                inspirations.map((inspiration) => (
                  <TableRow key={inspiration.id}>
                    <TableCell>
                      <div className="relative h-16 w-16 overflow-hidden rounded border">
                        {inspiration.imageUrl && (
                          <img
                            src={inspiration.imageUrl}
                            alt={inspiration.name}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{inspiration.name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                        {inspiration.prompt}
                      </div>
                    </TableCell>
                    <TableCell>
                      {inspiration.width} × {inspiration.height}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {inspiration.tags?.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditDialog(inspiration)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openDeleteDialog(inspiration)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Creative Inspiration</DialogTitle>
          </DialogHeader>
          <CreateInspirationForm onSuccess={handleCreateSuccess} onCancel={() => setIsCreateDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Creative Inspiration</DialogTitle>
          </DialogHeader>
          {currentInspiration && (
            <EditInspirationForm 
              inspiration={currentInspiration} 
              onSuccess={handleEditSuccess} 
              onCancel={() => setIsEditDialogOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <DeleteInspirationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        inspiration={currentInspiration}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
