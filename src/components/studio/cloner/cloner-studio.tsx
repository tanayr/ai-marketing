"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFileUpload } from "@/lib/uploads/useFileUpload";
import { FileUploader } from "@/components/uploads/file-uploader";
import { UrlInput } from "@/components/uploads/url-input";
import { ImagePreview } from "./image-preview";
import { PromptEditor } from "./prompt-editor";
import { GenerationSettings, type GenerationSettings as Settings } from "./generation-settings";
import { Loader2, RefreshCw } from "lucide-react";

export default function ClonerStudio() {
  const { toast } = useToast();
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [settings, setSettings] = useState<Settings>({
    model: "gpt-image-1",
    size: "1024x1024",
    style: "vivid",
  });
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [assetId, setAssetId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Handle source image upload
  const handleImageUploaded = (imageUrl: string) => {
    setSourceImage(imageUrl);
    setGeneratedImage(null); // Reset any previous generation
  };

  // Generate image through the API
  const handleGenerateImage = async () => {
    if (!sourceImage || !prompt.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both an image and a prompt.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/studio/cloner/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          sourceImage,
          settings,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setAssetId(data.asset.id);
        toast({
          title: "Image generated",
          description: "Your image was successfully created and saved as an asset.",
        });
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle tab switching between file upload and URL input
  const handleInputMethodChange = (value: string) => {
    // Reset source image when changing input method
    setSourceImage(null);
    setGeneratedImage(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {!sourceImage ? (
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-medium mb-4">Upload or enter an image URL</h2>
            <Tabs defaultValue="upload" onValueChange={handleInputMethodChange}>
              <TabsList className="mb-4">
                <TabsTrigger value="upload">Upload Image</TabsTrigger>
                <TabsTrigger value="url">Image URL</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload">
                <FileUploader
                  onFileUploaded={handleImageUploaded}
                  acceptTypes="image/*"
                  buttonText="Choose Image"
                  path="uploads/cloner/sources"
                  maxSizeMB={10}
                />
              </TabsContent>
              
              <TabsContent value="url">
                <UrlInput
                  onFileUploaded={handleImageUploaded}
                  path="uploads/cloner/sources"
                  placeholder="Enter image URL..."
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-medium mb-4">Source Image</h2>
              <ImagePreview src={sourceImage} alt="Source image" />
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setSourceImage(null)}
              >
                Change Image
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-medium mb-4">Generation Settings</h2>
              
              <PromptEditor 
                value={prompt}
                onChange={setPrompt}
                maxLength={4000}
                className="mb-6"
              />
              
              <GenerationSettings
                settings={settings}
                onChange={setSettings}
                className="mb-6"
              />
              
              <Button
                onClick={handleGenerateImage}
                disabled={isGenerating || !prompt.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>Generate Image</>
                )}
              </Button>
            </CardContent>
          </Card>
          
          {generatedImage && (
            <Card className="col-span-1 lg:col-span-2">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">Generated Result</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateImage}
                    disabled={isGenerating}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ImagePreview src={generatedImage} alt="Generated image" />
                  
                  <div className="space-y-4">
                    <h3 className="font-medium">Image Details</h3>
                    <p className="text-sm text-muted-foreground">{prompt}</p>
                    <p className="text-sm">
                      <span className="font-medium">Model:</span> {settings.model}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Size:</span> {settings.size}
                    </p>
                    {settings.model === "dall-e-3" && (
                      <p className="text-sm">
                        <span className="font-medium">Style:</span> {settings.style}
                      </p>
                    )}
                    <div className="pt-4">
                      <Button asChild>
                        <a
                          href={`/app/assets/${assetId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View in Asset Library
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
