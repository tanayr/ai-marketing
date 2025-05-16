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
  FormMessage,
  FormDescription
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
  businessName: z.string().min(2, {
    message: "Business name must be at least 2 characters."
  }),
  productService: z.string().min(3, {
    message: "Product/service name must be at least 3 characters."
  }),
  headline1: z.string().max(30, {
    message: "Headline 1 must be 30 characters or less."
  }).optional(),
  headline2: z.string().max(30, {
    message: "Headline 2 must be 30 characters or less."
  }).optional(),
  description: z.string().min(20, {
    message: "Description must be at least 20 characters."
  }).max(200, {
    message: "Description must be 200 characters or less."
  }),
  keywords: z.string().min(5, {
    message: "Keywords must be at least 5 characters."
  }),
  adType: z.enum(["search", "display", "responsive"]),
});

type FormValues = z.infer<typeof formSchema>;

interface AdCopyResult {
  headlines: string[];
  descriptions: string[];
}

export default function GoogleAdForm() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAds, setGeneratedAds] = useState<AdCopyResult | null>(null);
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: "",
      productService: "",
      headline1: "",
      headline2: "",
      description: "",
      keywords: "",
      adType: "search"
    }
  });

  // Form submission handler
  async function onSubmit(values: FormValues) {
    setIsGenerating(true);
    
    try {
      // This would typically be an API call
      // For now, we'll simulate a response
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock headlines based on inputs
      const headlines = [
        `${values.productService} - Best Choice`,
        `Top Rated ${values.productService}`,
        `${values.businessName} ${values.productService}`,
        values.headline1 || `Premium ${values.productService}`,
        values.headline2 || `${values.productService} Solutions`
      ];
      
      // Generate mock descriptions based on inputs
      const descriptions = [
        `${values.description.slice(0, 88)}...`,
        `Looking for ${values.productService}? ${values.businessName} offers the best solution for your needs.`,
        `${values.businessName}: Quality ${values.productService} at competitive prices. Visit today!`
      ];
      
      setGeneratedAds({ headlines, descriptions });
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
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., AI Marketing Suite" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="productService"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product/Service</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Marketing Automation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="headline1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Headline 1 (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Max 30 characters" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      {field.value?.length || 0}/30
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="headline2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Headline 2 (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Max 30 characters" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      {field.value?.length || 0}/30
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your product or service..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    {field.value.length}/200
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keywords</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., marketing, automation, AI" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Separate keywords with commas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="adType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ad Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ad type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="search">Search Ad</SelectItem>
                      <SelectItem value="display">Display Ad</SelectItem>
                      <SelectItem value="responsive">Responsive Ad</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Google Ads"
              )}
            </Button>
          </form>
        </Form>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-4">Generated Google Ads</h3>
        
        {!generatedAds ? (
          <div className="bg-muted/20 border border-border rounded-md p-8 text-center">
            <p className="text-muted-foreground">
              Fill out the form and generate Google ads to see results here
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium mb-2">Headlines</h4>
              <div className="space-y-2">
                {generatedAds.headlines.map((headline, index) => (
                  <Card key={`headline-${index}`}>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center">
                        <p className="text-sm">{headline}</p>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyToClipboard(headline)}
                          title="Copy to clipboard"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Descriptions</h4>
              <div className="space-y-2">
                {generatedAds.descriptions.map((description, index) => (
                  <Card key={`description-${index}`}>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-sm">{description}</p>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => copyToClipboard(description)}
                          title="Copy to clipboard"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
