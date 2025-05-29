"use client";

import { useState, useEffect, useRef } from "react";
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
import { Loader2, RefreshCw, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { StreamingImageProgress } from "./streaming-image-progress";

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
  
  // State for streaming image generation
  const [partialImages, setPartialImages] = useState<Array<{index: number, base64: string}>>([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Handle source image upload
  const handleImageUploaded = (imageUrl: string) => {
    setSourceImage(imageUrl);
    setGeneratedImage(null); // Reset any previous generation
    setPartialImages([]); // Clear partial images
    setGenerationProgress(0);
  };

  // Main generate image function - decides between streaming and standard generation
  const handleGenerateImage = async () => {
    if (!sourceImage || !prompt.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both an image and a prompt.",
        variant: "destructive",
      });
      return;
    }

    // Clear previous generation state
    setGeneratedImage(null);
    setPartialImages([]);
    setGenerationProgress(0);
    setIsGenerating(true);

    // Use streaming or standard generation based on settings
    if (settings.streamingEnabled) {
      await handleStreamingGeneration();
    } else {
      await handleStandardGeneration();
    }
  };

  // Handle standard (non-streaming) image generation
  const handleStandardGeneration = async () => {
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

  // Handle streaming image generation with partial images
  const handleStreamingGeneration = async () => {
    // Create a new AbortController for this request
    abortControllerRef.current = new AbortController();
    
    // Ensure we're using the gpt-4.1 model for streaming
    // Our backend enforces this, but we should also adjust UI state
    if (settings.model !== 'gpt-4.1') {
      toast({
        title: "Model adjusted",
        description: "Streaming requires GPT-4.1. Model has been automatically selected.",
      });
      
      // Update settings to use gpt-4.1
      setSettings(prev => ({
        ...prev,
        model: 'gpt-4.1'
      }));
    }
    
    try {
      const response = await fetch("/api/studio/cloner/stream-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          sourceImage,
          settings: {
            ...settings,
            model: 'gpt-4.1', // Enforce gpt-4.1 for streaming
            partialImages: settings.partialImages || 2
          },
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }
      
      if (!response.body) {
        throw new Error("No response body received");
      }
      
      // Process the streamed events
      await processStreamingResponse(response.body);
      
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast({
          title: "Generation cancelled",
          description: "Image generation was cancelled",
        });
      } else {
        toast({
          title: "Generation failed",
          description: error instanceof Error ? error.message : "Failed to generate image",
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Process streaming response and handle partial images
  const processStreamingResponse = async (stream: ReadableStream) => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    
    let partialImagesReceived = 0;
    const maxPartialImages = settings.partialImages || 2;
    let finalImageReceived = false;
    let buffer = '';
    let responseId: string | null = null;
    let finalImageBase64: string | null = null;
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Decode the chunk and add to buffer
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // Process complete SSE events from the buffer
        let eventIndex;
        while ((eventIndex = buffer.indexOf('\n\n')) >= 0) {
          const eventData = buffer.slice(0, eventIndex);
          buffer = buffer.slice(eventIndex + 2); // +2 to skip the double newline
          
          // Process event - look for data: lines
          const lines = eventData.split('\n');
          let dataJson = '';
          let eventType = '';
          
          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventType = line.slice(7); // Extract event type for debugging
              console.log(line); // Log the event type for debugging
            } else if (line.startsWith('data:')) {
              dataJson = line.slice(5); // Extract the JSON data
            }
          }
          
          // Process the JSON data if we found any
          if (dataJson) {
            try {
              const data = JSON.parse(dataJson);
              console.log('Stream event:', data.type);
              
              // Store response ID if present
              if (data.response?.id && !responseId) {
                responseId = data.response.id;
                console.log('Response ID:', responseId);
              }
              
              // Handle partial image events
              if (data.type === 'response.image_generation_call.partial_image') {
                // Handle partial image
                partialImagesReceived++;
                console.log(`Received partial image ${data.partial_image_index}`);
                
                // Add debugging for the content
                console.log('Partial image data structure:', JSON.stringify(data).substring(0, 100) + '...');
                
                // Check multiple possible locations for image data
                const base64Data = data.partial_image_b64 || 
                                  (data.content && data.content.image_b64) ||
                                  data.image_b64;
                
                if (base64Data) {
                  setPartialImages(prev => [...prev, {
                    index: data.partial_image_index || partialImagesReceived - 1,
                    base64: base64Data
                  }]);
                  
                  // Update progress based on the number of partial images
                  const progressPercent = Math.min(
                    Math.round((partialImagesReceived / (maxPartialImages + 1)) * 100),
                    90 // Cap at 90% until final image
                  );
                  setGenerationProgress(progressPercent);
                } else {
                  console.warn('Partial image event missing image data');
                }
              } 
              // Store the final image when found in any event
              else if (data.type === 'response.image_generation_call.completed' ||
                        (data.type === 'response.image_generation_call' && 
                         data.status === 'completed')) {
                
                console.log('Completed event received, full data:', JSON.stringify(data).substring(0, 200) + '...');
                
                // Look for image data in various locations
                const imageData = data.result || 
                                 (data.content && data.content.image_b64) ||
                                 data.image_b64 ||
                                 (data.item && data.item.content && data.item.content.image_b64) ||
                                 (data.response && data.response.output && data.response.output[0] && 
                                  data.response.output[0].content && data.response.output[0].content.image_b64);
                
                if (imageData && !finalImageReceived) {
                  finalImageReceived = true;
                  finalImageBase64 = imageData;
                  console.log('Found final image in completed event');
                  setGenerationProgress(100);
                  await saveGeneratedImage(imageData);
                } else if (!finalImageReceived) {
                  console.log('No image data in completed event, waiting for final response');
                }
              }
              // Look for the final image in any content output
              else if (data.type === 'response.completed' && !finalImageReceived) {
                console.log('Final response completed event');
                
                // Try to extract the image from the final response
                if (data.response && data.response.output) {
                  for (const output of data.response.output) {
                    if (output.type === 'image_generation_call' && output.content) {
                      const imageData = output.content.image_b64 || output.result;
                      if (imageData) {
                        finalImageReceived = true;
                        finalImageBase64 = imageData;
                        console.log('Found final image in response.completed event');
                        setGenerationProgress(100);
                        await saveGeneratedImage(imageData);
                        break;
                      }
                    }
                  }
                }
                
                // If we still haven't found the image, check if we have any partial images
                if (!finalImageReceived && partialImagesReceived > 0) {
                  const lastPartialImage = [...partialImages].pop();
                  if (lastPartialImage) {
                    console.log('Using last partial image as final image');
                    finalImageReceived = true;
                    finalImageBase64 = lastPartialImage.base64;
                    setGenerationProgress(100);
                    await saveGeneratedImage(lastPartialImage.base64);
                  }
                }
              }
              // Check for image data in content_part events
              else if (data.type === 'response.content_part.added' && !finalImageReceived) {
                // Try to find image data in content part
                if (data.content && data.content.type === 'image' && data.content.image_b64) {
                  finalImageReceived = true;
                  finalImageBase64 = data.content.image_b64;
                  console.log('Found final image in content_part.added event');
                  setGenerationProgress(100);
                  await saveGeneratedImage(data.content.image_b64);
                }
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
              console.error('Raw data JSON:', dataJson.substring(0, 100) + '...');
            }
          }
        }
      }
      
      // Final check - if we didn't find a final image but have partial images
      if (!finalImageReceived && partialImagesReceived > 0) {
        const lastPartialImage = [...partialImages].pop();
        if (lastPartialImage) {
          console.log('Using last partial image as final image (fallback)');
          setGenerationProgress(100);
          await saveGeneratedImage(lastPartialImage.base64);
        }
      }
    } finally {
      reader.releaseLock();
    }
  };

  // Save the generated image from streaming response
  const saveGeneratedImage = async (base64Image: string) => {
    try {
      const response = await fetch("/api/studio/cloner/save-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base64Image,
          prompt,
          settings,
          sourceImage,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to save generated image");
      }
      
      const data = await response.json();
      setAssetId(data.asset.id);
      setGeneratedImage(data.imageUrl);
      
      toast({
        title: "Image generated",
        description: "Your image was successfully created and saved as an asset.",
      });
    } catch (error) {
      toast({
        title: "Failed to save image",
        description: "The image was generated but could not be saved",
        variant: "destructive",
      });
    }
  };

  // Cancel ongoing generation
  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
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
              
              {isGenerating && (
                <div className="mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Generation Progress</span>
                    <span className="text-sm">{generationProgress}%</span>
                  </div>
                  <Progress value={generationProgress} className="mb-4" />
                  <Button 
                    variant="destructive" 
                    className="w-full mb-2"
                    onClick={handleCancelGeneration}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel Generation
                  </Button>
                </div>
              )}
              
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
          
          {/* Show streaming progress with partial images */}
          {isGenerating && partialImages.length > 0 && (
            <StreamingImageProgress
              partialImages={partialImages}
              progress={generationProgress}
              isGenerating={isGenerating}
            />
          )}
          
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
