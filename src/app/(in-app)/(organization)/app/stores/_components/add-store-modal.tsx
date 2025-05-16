"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Form validation schema
const formSchema = z.object({
  storeUrl: z
    .string()
    .url({ message: "Please enter a valid URL" })
    .min(1, { message: "Store URL is required" }),
});

type FormValues = z.infer<typeof formSchema>;

interface AddStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddStoreModal({ isOpen, onClose }: AddStoreModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      storeUrl: "",
    },
  });

  // Handle form submission
  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    
    try {
      // Call our API endpoint to fetch store info from RapidAPI and save to database
      const response = await fetch('/api/app/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: values.storeUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add store');
      }
      
      // Get the newly created store
      const newStore = await response.json();
      
      // Update the store list via SWR
      // This assumes you're using SWR for data fetching elsewhere
      // mutate('/api/app/stores');
      
      // Reset form and close modal
      form.reset();
      onClose();
      
      // Show success message (implementation depends on your toast system)
      console.log('Store added successfully:', newStore);
    } catch (error) {
      console.error('Error adding store:', error);
      // Here you could show an error toast
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Store</DialogTitle>
          <DialogDescription>
            Enter your Shopify store URL to connect it to your account.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="storeUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://your-store.myshopify.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect Store"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
