"use client";

import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  className?: string;
}

export function PromptEditor({ 
  value, 
  onChange, 
  maxLength = 1000,
  className 
}: PromptEditorProps) {
  const [charCount, setCharCount] = useState(0);
  
  useEffect(() => {
    setCharCount(value.length);
  }, [value]);
  
  const getCharCountColor = () => {
    const percentage = charCount / maxLength;
    if (percentage > 0.9) return 'text-destructive';
    if (percentage > 0.75) return 'text-warning';
    return 'text-muted-foreground';
  };
  
  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-2">
        <Label htmlFor="prompt" className="text-base">Prompt</Label>
        <Badge variant="outline" className={getCharCountColor()}>
          {charCount}/{maxLength}
        </Badge>
      </div>
      
      <Textarea
        id="prompt"
        placeholder="Describe what you want to generate..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[120px]"
        maxLength={maxLength}
      />
      
      <p className="text-sm text-muted-foreground mt-2">
        Use detailed descriptions for better results.
      </p>
    </div>
  );
}
