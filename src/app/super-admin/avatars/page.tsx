"use client";

import { useState } from "react";
import { Avatar } from "@/db/schema/avatars";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Avatar form schema
const avatarFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  imageUrl: z.string().url("Must be a valid URL"),
  examples: z.array(z.string().url("Must be a valid URL")).min(1, "At least one example image is required"),
});

type AvatarFormValues = z.infer<typeof avatarFormSchema>;

export default function SuperAdminAvatarsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<Avatar | null>(null);
  const [newExampleUrl, setNewExampleUrl] = useState("");
  
  // Fetch all common avatars
  const { data: avatars, error, mutate } = useSWR<Avatar[]>(
    "/api/super-admin/avatars"
  );

  const form = useForm<AvatarFormValues>({
    resolver: zodResolver(avatarFormSchema),
    defaultValues: {
      name: "",
      imageUrl: "",
      examples: [],
    },
  });

  const handleAddExample = () => {
    if (!newExampleUrl) return;
    try {
      // Validate the URL
      z.string().url().parse(newExampleUrl);
      const examples = form.getValues().examples || [];
      form.setValue("examples", [...examples, newExampleUrl]);
      setNewExampleUrl("");
    } catch (error) {
      toast.error("Please enter a valid URL");
    }
  };

  const handleRemoveExample = (index: number) => {
    const examples = form.getValues().examples;
    form.setValue(
      "examples",
      examples.filter((_, i) => i !== index)
    );
  };

  const handleCreateAvatar = async (values: AvatarFormValues) => {
    try {
      const response = await fetch("/api/app/studio/lookr/avatars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, isCommon: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create avatar");
      }

      toast.success("Common avatar created successfully");
      setIsCreateDialogOpen(false);
      form.reset();
      mutate();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred");
      }
    }
  };

  const handleEditAvatar = async (values: AvatarFormValues) => {
    if (!currentAvatar) return;

    try {
      const response = await fetch(`/api/app/studio/lookr/avatars/${currentAvatar.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, isCommon: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update avatar");
      }

      toast.success("Avatar updated successfully");
      setIsEditDialogOpen(false);
      setCurrentAvatar(null);
      mutate();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred");
      }
    }
  };

  const handleDeleteAvatar = async () => {
    if (!currentAvatar) return;

    try {
      const response = await fetch(`/api/app/studio/lookr/avatars/${currentAvatar.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete avatar");
      }

      toast.success("Avatar deleted successfully");
      setIsDeleteDialogOpen(false);
      setCurrentAvatar(null);
      mutate();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred");
      }
    }
  };

  const openEditDialog = (avatar: Avatar) => {
    setCurrentAvatar(avatar);
    form.reset({
      name: avatar.name,
      imageUrl: avatar.imageUrl,
      examples: avatar.examples || [],
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (avatar: Avatar) => {
    setCurrentAvatar(avatar);
    setIsDeleteDialogOpen(true);
  };

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold mb-4">Common Avatars</h1>
        <div className="text-red-500">Error loading avatars: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Common Avatars</h2>
          <p className="text-muted-foreground">
            Manage avatars that are available to all organizations
          </p>
        </div>
        <Button onClick={() => {
          form.reset({
            name: "",
            imageUrl: "",
            examples: [],
          });
          setIsCreateDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Create Common Avatar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Common Avatars List</CardTitle>
          <CardDescription>
            These avatars are available to all organizations in Lookr Studio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Preview</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Examples</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {avatars?.filter(a => a.isCommon).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No common avatars found. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
              {avatars?.filter(a => a.isCommon).map((avatar) => (
                <TableRow key={avatar.id}>
                  <TableCell>
                    <div className="relative h-16 w-16 rounded-md overflow-hidden">
                      <img
                        src={avatar.imageUrl}
                        alt={avatar.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{avatar.name}</TableCell>
                  <TableCell>{avatar.examples?.length || 0} examples</TableCell>
                  <TableCell>{avatar.createdById}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditDialog(avatar)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openDeleteDialog(avatar)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Avatar Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Common Avatar</DialogTitle>
            <DialogDescription>
              Create a new common avatar that will be available to all organizations
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateAvatar)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Professional Model" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/avatar.jpg" {...field} />
                    </FormControl>
                    <FormDescription>
                      URL to the base image of the avatar
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Example Images Section */}
              <div className="space-y-2">
                <Label>Example Images</Label>
                <div className="flex space-x-2">
                  <Input
                    value={newExampleUrl}
                    onChange={(e) => setNewExampleUrl(e.target.value)}
                    placeholder="https://example.com/example.jpg"
                  />
                  <Button type="button" onClick={handleAddExample}>
                    Add
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Add URLs to example images showing the avatar with different products
                </div>
                
                {form.formState.errors.examples && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.examples.message}
                  </p>
                )}
                
                {/* Display added examples */}
                <div className="space-y-2 mt-2">
                  {form.watch("examples")?.map((example, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="flex-1 truncate">{example}</div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveExample(index)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button type="submit">Create Avatar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Avatar Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Common Avatar</DialogTitle>
            <DialogDescription>
              Update the common avatar properties
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditAvatar)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar Image URL</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      URL to the base image of the avatar
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Example Images Section */}
              <div className="space-y-2">
                <Label>Example Images</Label>
                <div className="flex space-x-2">
                  <Input
                    value={newExampleUrl}
                    onChange={(e) => setNewExampleUrl(e.target.value)}
                    placeholder="https://example.com/example.jpg"
                  />
                  <Button type="button" onClick={handleAddExample}>
                    Add
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Add URLs to example images showing the avatar with different products
                </div>
                
                {form.formState.errors.examples && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.examples.message}
                  </p>
                )}
                
                {/* Display added examples */}
                <div className="space-y-2 mt-2">
                  {form.watch("examples")?.map((example, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="flex-1 truncate">{example}</div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveExample(index)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button type="submit">Update Avatar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Avatar Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Avatar</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this common avatar? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAvatar}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
