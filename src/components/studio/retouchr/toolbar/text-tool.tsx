"use client";

import React, { useState } from 'react';
import { useCanvas } from '../hooks/use-canvas';
import { fabric, FabricIText } from '../utils/fabric-imports';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ColorPicker } from '../utils/color-picker';

// Font options
const FONT_OPTIONS = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
];

export const TextTool: React.FC = () => {
  const { canvas, selectedObjects } = useCanvas();
  const [textValue, setTextValue] = useState('Add your text');
  
  // Text properties for new text
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState(24);
  const [textColor, setTextColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('');
  
  // Update selected text
  const updateSelectedText = (property: string, value: any) => {
    if (!canvas || selectedObjects.length === 0) return;
    
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === 'text') {
      activeObject.set(property, value);
      canvas.renderAll();
    }
  };
  
  // Add new text to canvas
  const addText = () => {
    if (!canvas) return;
    
    const text = new fabric.Text(textValue, {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center',
      fontFamily,
      fontSize,
      fill: textColor,
      backgroundColor: backgroundColor || undefined,
    });
    
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };
  
  // Get current text value from selected object
  const getCurrentTextValue = () => {
    if (!canvas || selectedObjects.length === 0) return textValue;
    
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === 'text') {
      return (activeObject as fabric.Text).text;
    }
    
    return textValue;
  };
  
  return (
    <div className="space-y-4 p-4">
      <h3 className="font-medium text-sm">Text Tool</h3>
      
      {/* Text input */}
      <div className="space-y-2">
        <Label htmlFor="text-input">Text</Label>
        <Input
          id="text-input"
          value={getCurrentTextValue()}
          onChange={(e) => {
            setTextValue(e.target.value);
            if (selectedObjects.length > 0) {
              updateSelectedText('text', e.target.value);
            }
          }}
        />
      </div>
      
      {/* Font family */}
      <div className="space-y-2">
        <Label htmlFor="font-family">Font</Label>
        <Select
          value={fontFamily}
          onValueChange={(value) => {
            setFontFamily(value);
            updateSelectedText('fontFamily', value);
          }}
        >
          <SelectTrigger id="font-family">
            <SelectValue placeholder="Select font" />
          </SelectTrigger>
          <SelectContent>
            {FONT_OPTIONS.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Font size */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="font-size">Size</Label>
          <span className="text-xs text-muted-foreground">{fontSize}px</span>
        </div>
        <Slider
          id="font-size"
          min={8}
          max={72}
          step={1}
          value={[fontSize]}
          onValueChange={(values) => {
            setFontSize(values[0]);
            updateSelectedText('fontSize', values[0]);
          }}
        />
      </div>
      
      {/* Text color */}
      <div className="space-y-2">
        <Label>Text Color</Label>
        <ColorPicker
          color={textColor}
          onChange={(color) => {
            setTextColor(color);
            updateSelectedText('fill', color);
          }}
        />
      </div>
      
      {/* Background color */}
      <div className="space-y-2">
        <Label>Background Color</Label>
        <div className="flex items-center gap-2">
          <ColorPicker
            color={backgroundColor}
            onChange={(color) => {
              setBackgroundColor(color);
              updateSelectedText('backgroundColor', color || undefined);
            }}
            allowTransparent
          />
          {backgroundColor && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setBackgroundColor('');
                updateSelectedText('backgroundColor', undefined);
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>
      
      {/* Add text button */}
      <Button onClick={addText} className="w-full mt-4">
        Add Text
      </Button>
    </div>
  );
};
