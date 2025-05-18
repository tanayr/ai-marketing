"use client";

import React, { useState } from 'react';
import { useCanvas } from '../hooks/use-canvas';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Download, Save } from 'lucide-react';
import { toast } from 'sonner';

interface ExportToolProps {
  onSave?: () => Promise<void>;
  isSaving?: boolean;
}

export const ExportTool: React.FC<ExportToolProps> = ({ onSave, isSaving = false }) => {
  const { canvas } = useCanvas();
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [quality, setQuality] = useState(100);
  const [filename, setFilename] = useState('my-design');
  
  // Handle export to file
  const handleExport = () => {
    if (!canvas) return;
    
    try {
      let dataURL: string;
      
      if (format === 'jpeg') {
        dataURL = canvas.toDataURL({
          format: 'jpeg',
          quality: quality / 100,
        });
      } else {
        dataURL = canvas.toDataURL({
          format: 'png',
        });
      }
      
      // Create download link
      const link = document.createElement('a');
      link.download = `${filename}.${format}`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Export successful!', {
        description: `${filename}.${format} has been downloaded.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed', {
        description: 'There was an error exporting your design. Please try again.',
      });
    }
  };
  
  return (
    <div className="space-y-4 p-4">
      <h3 className="font-medium text-sm">Export & Save</h3>
      
      <div className="space-y-3">
        {/* File name */}
        <div className="space-y-2">
          <Label htmlFor="filename">File Name</Label>
          <Input
            id="filename"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="my-design"
          />
        </div>
        
        {/* Format selection */}
        <div className="space-y-2">
          <Label htmlFor="format">Format</Label>
          <Select value={format} onValueChange={(value: 'png' | 'jpeg') => setFormat(value)}>
            <SelectTrigger id="format">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="jpeg">JPEG</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Quality slider (only for JPEG) */}
        {format === 'jpeg' && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="quality">Quality</Label>
              <span className="text-xs text-muted-foreground">{quality}%</span>
            </div>
            <Slider
              id="quality"
              min={10}
              max={100}
              step={1}
              value={[quality]}
              onValueChange={(values) => setQuality(values[0])}
            />
          </div>
        )}
        
        {/* Export button */}
        <Button
          className="w-full"
          onClick={handleExport}
        >
          <Download className="mr-2 h-4 w-4" />
          Export {format.toUpperCase()}
        </Button>
        
        {/* Save button */}
        {onSave && (
          <Button
            variant="outline"
            className="w-full"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Project
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
