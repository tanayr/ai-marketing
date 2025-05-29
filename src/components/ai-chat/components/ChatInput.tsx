'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Image, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from './ImageUpload';

interface ChatInputProps {
  onSubmit: (message: string, image?: { file: File; base64: string }) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ 
  onSubmit, 
  disabled = false, 
  placeholder = "Ask me to help with your design..." 
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{
    file: File;
    base64: string;
    preview: string;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // For image analysis, require either text input or uploaded image
    if (uploadedImage) {
      const messageText = input.trim() || "Please analyze this reference image and provide step-by-step instructions to recreate the text elements using Retouchr tools.";
      onSubmit(messageText, uploadedImage);
      setInput('');
      setUploadedImage(null);
      setShowImageUpload(false);
    } else if (input.trim()) {
      onSubmit(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleImageUpload = (file: File, base64: string) => {
    const preview = URL.createObjectURL(file);
    setUploadedImage({ file, base64, preview });
    setShowImageUpload(false);
  };

  const removeImage = () => {
    if (uploadedImage?.preview) {
      URL.revokeObjectURL(uploadedImage.preview);
    }
    setUploadedImage(null);
  };

  const toggleImageUpload = () => {
    setShowImageUpload(!showImageUpload);
  };

  const canSubmit = (input.trim() || uploadedImage) && !disabled;

  return (
    <div className="space-y-3">
      {/* Image upload area */}
      {(showImageUpload || uploadedImage) && (
        <div className="space-y-2">
          {uploadedImage ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Reference Image</span>
              </div>
              <ImageUpload
                uploadedImage={{
                  file: uploadedImage.file,
                  preview: uploadedImage.preview
                }}
                onRemove={removeImage}
                onImageUpload={handleImageUpload}
                disabled={disabled}
              />
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Add Reference Image</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleImageUpload}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <ImageUpload
                onImageUpload={handleImageUpload}
                disabled={disabled}
              />
            </div>
          )}
        </div>
      )}

      {/* Chat input */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-2">
            {/* Message input */}
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={uploadedImage ? "Add additional instructions (optional)..." : placeholder}
              disabled={disabled}
              className="min-h-[44px] max-h-32 resize-none"
              rows={1}
            />
            
            {/* Image upload hint */}
            {uploadedImage && !input.trim() && (
              <p className="text-xs text-muted-foreground">
                💡 I'll analyze your image and provide recreation steps. Add specific requests above if needed.
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleImageUpload}
              disabled={disabled}
              className={`h-10 w-10 p-0 ${uploadedImage ? 'bg-primary/10 border-primary' : ''}`}
              title="Add reference image for analysis"
            >
              <Image className="h-4 w-4" />
            </Button>
            
            <Button
              type="submit"
              disabled={!canSubmit}
              size="sm"
              className="h-10 w-10 p-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Status text */}
        {uploadedImage && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Ready for image analysis - will recreate text elements from your reference
          </div>
        )}
      </form>
    </div>
  );
}
