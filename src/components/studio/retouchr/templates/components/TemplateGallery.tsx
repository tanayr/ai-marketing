"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Template } from '@/db/schema/templates';
import { useTemplates } from '../hooks/useTemplates';
import { useTemplatePlacement } from '../hooks/useTemplatePlacement';
import { TemplateThumbnail } from './TemplateThumbnail';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, X } from 'lucide-react';

interface TemplateGalleryProps {
  onTemplatePlaced?: () => void;
}

/**
 * Component for displaying and selecting templates
 */
export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  onTemplatePlaced,
}) => {
  const { templates, isLoading, error } = useTemplates();
  const { placeTemplateOnCanvas } = useTemplatePlacement();
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Handle template selection
  const handleTemplateClick = (template: Template) => {
    setSelectedTemplate(template);
  };

  // Handle adding the selected template to canvas
  const handleAddTemplate = async () => {
    if (!selectedTemplate) return;
    
    const success = await placeTemplateOnCanvas(selectedTemplate);
    if (success && onTemplatePlaced) {
      onTemplatePlaced();
    }
  };

  // Filter templates based on search and tab
  const filteredTemplates = templates?.filter(template => {
    // Filter by search query
    const matchesSearch = 
      searchQuery === '' || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    // Filter by tab (all, common, or organization-specific)
    const matchesTab = 
      selectedTab === 'all' || 
      (selectedTab === 'common' && template.isCommon) ||
      (selectedTab === 'organization' && !template.isCommon);
    
    return matchesSearch && matchesTab;
  });

  // Clear search input
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="template-gallery flex flex-col h-full">
      <div className="flex items-center space-x-2 px-1 pb-3">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0"
              onClick={handleClearSearch}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-3 h-8 mb-2">
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          <TabsTrigger value="common" className="text-xs">Common</TabsTrigger>
          <TabsTrigger value="organization" className="text-xs">Organization</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-2 p-1">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-4 text-center text-sm text-red-500">
              Error loading templates: {error.message}
            </div>
          ) : filteredTemplates && filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 p-1">
              {filteredTemplates.map((template) => (
                <TemplateThumbnail
                  key={template.id}
                  template={template}
                  onClick={handleTemplateClick}
                  isSelected={selectedTemplate?.id === template.id}
                />
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {searchQuery 
                ? 'No templates found matching your search'
                : selectedTab === 'all'
                  ? 'No templates available'
                  : selectedTab === 'common'
                    ? 'No common templates available'
                    : 'No organization templates available'
              }
            </div>
          )}
        </ScrollArea>
      </Tabs>

      <div className="pt-3 px-1">
        <Button
          className="w-full"
          disabled={!selectedTemplate}
          onClick={handleAddTemplate}
        >
          Add Template to Canvas
        </Button>
      </div>
    </div>
  );
};
