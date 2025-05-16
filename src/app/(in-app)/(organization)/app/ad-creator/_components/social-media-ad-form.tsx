"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Copy } from "lucide-react";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

// Form schema validation
const formSchema = z.object({
  productName: z.string().min(2, {
    message: "Product name must be at least 2 characters."
  }),
  description: z.string().min(20, {
    message: "Description must be at least 20 characters."
  }),
  targetAudience: z.string().min(5, {
    message: "Target audience must be at least 5 characters."
  }),
  platform: z.enum(["facebook", "instagram", "twitter", "linkedin"]),
  tone: z.enum(["professional", "casual", "humorous", "persuasive"])
});

type FormValues = z.infer<typeof formSchema>;

export default function SocialMediaAdForm() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAds, setGeneratedAds] = useState<string[]>([]);
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: "",
      description: "",
      targetAudience: "",
      platform: "facebook",
      tone: "professional"
    }
  });

  // Form submission handler
  async function onSubmit(values: FormValues) {
    setIsGenerating(true);
    
    try {
      // This would typically be an API call
      // For now, we'll simulate a response
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulated response
      const mockGeneratedAds = [
        `✨ Introducing ${values.productName}! The perfect solution for ${values.targetAudience}. ${values.description.split('.')[0]}. Learn more! #ProductLaunch #Innovation`,
        
        `Are you tired of ordinary solutions? ${values.productName} changes everything for ${values.targetAudience}. Discover how: [Link] #GameChanger`,
        
        `${values.targetAudience} love ${values.productName} because it ${values.description.toLowerCase().includes('because') ? values.description.split('because')[1].trim() : 'solves real problems'}. Try it today!`
      ];
      
      setGeneratedAds(mockGeneratedAds);
    } catch (error) {
      console.error("Error generating ads:", error);
    } finally {
      setIsGenerating(false);
    }
  }

  // Copy ad text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product/Service Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., AI Marketing Suite" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your product or service in detail..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="targetAudience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Audience</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Small business owners, Marketers" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="twitter">Twitter</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="tone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tone</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="humorous">Humorous</SelectItem>
                        <SelectItem value="persuasive">Persuasive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Ad Copy"
              )}
            </Button>
          </form>
        </Form>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-4">Generated Ad Copy</h3>
        
        {generatedAds.length === 0 ? (
          <div className="bg-muted/20 border border-border rounded-md p-8 text-center">
            <p className="text-muted-foreground">
              Fill out the form and generate ad copy to see results here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {generatedAds.map((ad, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm whitespace-pre-wrap">{ad}</p>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => copyToClipboard(ad)}
                      title="Copy to clipboard"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
