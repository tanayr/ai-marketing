"use client";

import { useState, useEffect } from 'react';
import { RetouchrStudio } from '@/components/studio/retouchr/retouchr-studio';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function RetouchrStudioPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assetId = searchParams.get('id');
  
  const [designData, setDesignData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewDesignDialog, setShowNewDesignDialog] = useState(false);
  const [newDesignName, setNewDesignName] = useState('');
  const [designWidth, setDesignWidth] = useState('800');
  const [designHeight, setDesignHeight] = useState('600');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [isCreating, setIsCreating] = useState(false);

  // Check if we're creating a new design or editing an existing one
  useEffect(() => {
    if (!assetId) {
      // No ID provided, show dialog to create a new design
      setShowNewDesignDialog(true);
      return;
    }
    
    // If we have an asset ID, fetch the design data
    const fetchDesignData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/app/studio/retouchr/${assetId}`);
        
        if (!response.ok) {
          throw new Error('Failed to load design');
        }
        
        const data = await response.json();
        console.log('Design data loaded:', data);
        console.log('Design content:', data?.content);
        console.log('Has fabricCanvas?', !!data?.content?.fabricCanvas);
        
        setDesignData(data);
      } catch (error) {
        console.error('Error loading design:', error);
        toast.error('Failed to load design');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDesignData();
  }, [assetId]);

  // Create a new design
  const handleCreateNewDesign = async () => {
    if (!newDesignName.trim()) {
      toast.error('Please enter a design name');
      return;
    }

    try {
      setIsCreating(true);

      const response = await fetch('/api/app/studio/retouchr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newDesignName.trim(),
          width: parseInt(designWidth) || 800,
          height: parseInt(designHeight) || 600,
          backgroundColor,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create design');
      }

      const data = await response.json();
      setShowNewDesignDialog(false);
      
      // Redirect to the new design
      router.push(`/app/studio/retouchr?id=${data.id}`);
      
    } catch (error) {
      console.error('Error creating design:', error);
      toast.error('Failed to create design');
    } finally {
      setIsCreating(false);
    }
  };

  // Save design changes
  const handleSaveDesign = async (data: any) => {

    if (!assetId) {
      toast.error('No design ID found');
      return;
    }

    const response = await fetch(`/api/app/studio/retouchr/${assetId}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to save design');
    }

    return response.json();
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isLoading ? 'Loading...' : designData?.name || 'Retouchr Studio'}
          </h1>
          <p className="text-muted-foreground">
            Design images with our powerful editor
          </p>
        </div>

        <Button onClick={() => setShowNewDesignDialog(true)}>
          New Design
        </Button>
      </div>

      {/* NewDesign Dialog */}
      <Dialog open={showNewDesignDialog} onOpenChange={setShowNewDesignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Design</DialogTitle>
            <DialogDescription>
              Set up the dimensions and properties for your new design.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="design-name">Design Name</Label>
              <Input
                id="design-name"
                value={newDesignName}
                onChange={(e) => setNewDesignName(e.target.value)}
                placeholder="My Awesome Design"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="design-width">Width (px)</Label>
                <Input
                  id="design-width"
                  value={designWidth}
                  onChange={(e) => setDesignWidth(e.target.value.replace(/\D/g, ''))}
                  type="number"
                  min="50"
                  max="3000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="design-height">Height (px)</Label>
                <Input
                  id="design-height"
                  value={designHeight}
                  onChange={(e) => setDesignHeight(e.target.value.replace(/\D/g, ''))}
                  type="number"
                  min="50"
                  max="3000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="background-color">Background Color</Label>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor }}
                />
                <Input
                  id="background-color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  placeholder="#ffffff"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                // If there's an ID in URL, just close dialog
                const params = new URLSearchParams(window.location.search);
                if (params.get('id')) {
                  setShowNewDesignDialog(false);
                } else {
                  // Otherwise go to main studio page
                  router.push('/app/studio');
                }
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateNewDesign} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Design'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content / Retouchr Studio */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading design...</p>
            </div>
          </div>
        ) : (
          <>
            <RetouchrStudio 
              assetId={assetId || undefined} 
              initialData={designData} 
              onSave={handleSaveDesign} 
            />
            {/* Debug info */}
            {process.env.NODE_ENV === 'development' && designData ? (
              <div className="hidden">
                {/* This div will not be displayed but will be in the DOM for debugging */}
                <div id="debug-design-data" data-has-content={!!designData.content} data-has-fabric-canvas={!!designData?.content?.fabricCanvas}></div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
