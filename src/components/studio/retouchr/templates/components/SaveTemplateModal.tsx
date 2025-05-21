"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTemplateCreator } from '../hooks/useTemplateCreator';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Modal for saving canvas as a template
 */
export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { createTemplateFromCanvas, generatePreview, previewUrl, isSaving, checkIsSuperAdmin } = useTemplateCreator();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [isCommon, setIsCommon] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  // Check if user is super admin
  useEffect(() => {
    const checkAdmin = async () => {
      const isAdmin = await checkIsSuperAdmin();
      setIsSuperAdmin(isAdmin);
      // Default to common template for super admins
      setIsCommon(isAdmin);
    };
    
    if (isOpen) {
      checkAdmin();
    }
  }, [isOpen, checkIsSuperAdmin]);
  
  // Generate preview when modal opens and fetch available categories
  useEffect(() => {
    if (isOpen) {
      generatePreview();
      fetchCategories();
    }
  }, [isOpen, generatePreview]);
  
  // Fetch available categories from existing templates
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/app/studio/retouchr/templates/categories');
      if (response.ok) {
        const data = await response.json();
        setAvailableCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);
  
  // Add a tag
  const addTag = () => {
    if (!tagInput || tags.includes(tagInput)) return;
    setTags([...tags, tagInput]);
    setTagInput('');
  };
  
  // Remove a tag
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  // Handle tag input keydown
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };
  
  // Handle category selection
  const handleCategorySelect = (value: string) => {
    if (value === 'new') {
      setShowNewCategory(true);
    } else {
      setCategory(value);
      setShowNewCategory(false);
    }
  };
  
  // Add new category
  const addNewCategory = () => {
    if (!newCategory) return;
    setCategory(newCategory);
    setAvailableCategories([...availableCategories, newCategory]);
    setNewCategory('');
    setShowNewCategory(false);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      toast.error('Please enter a template name');
      return;
    }
    
    try {
      await createTemplateFromCanvas({
        name,
        description,
        width: '', // These will be filled by the hook
        height: '',
        isCommon: isCommon && isSuperAdmin, // Only super admins can create common templates
        category,
        tags,
      });
      
      toast.success('Template saved successfully');
      
      // Reset form
      setName('');
      setDescription('');
      setCategory('');
      setTags([]);
      setTagInput('');
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to save template');
      }
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Create a reusable template from the current canvas design.
            {isSuperAdmin ? ' As a super admin, you can make this template available to all organizations.' : ''}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name *</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Template"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this template is for..."
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="template-category">Category</Label>
            <div className="flex gap-2">
              <Select
                value={category}
                onValueChange={handleCategorySelect}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                  <SelectItem value="new">+ Add new category</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {showNewCategory && (
              <div className="mt-2 flex gap-2">
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="New category name"
                  className="flex-1"
                />
                <Button type="button" onClick={addNewCategory}>Add</Button>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="template-tags">Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button 
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="rounded-full hover:bg-gray-200 h-4 w-4 inline-flex items-center justify-center"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                id="template-tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add tags (press Enter)"
                className="flex-1"
              />
              <Button type="button" onClick={addTag} variant="outline">
                Add
              </Button>
            </div>
          </div>
          
          {isSuperAdmin && (
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="template-common"
                checked={isCommon}
                onCheckedChange={setIsCommon}
              />
              <Label htmlFor="template-common" className="cursor-pointer">
                Make available to all organizations
              </Label>
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="border rounded-md overflow-hidden bg-gray-50 h-32 flex items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Template preview"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-sm text-muted-foreground">
                  Preview not available
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Template'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
