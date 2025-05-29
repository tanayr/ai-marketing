"use client";

import React, { useEffect, useState } from 'react';
import { CreativeInspiration } from '@/db/schema/creative-inspirations';
import { InspirationThumbnail } from './InspirationThumbnail';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

interface InspirationGalleryProps {
  onSelect: (inspiration: CreativeInspiration) => void;
}

/**
 * Component for displaying the gallery of creative inspirations
 */
export const InspirationGallery: React.FC<InspirationGalleryProps> = ({
  onSelect
}) => {
  const [inspirations, setInspirations] = useState<CreativeInspiration[]>([]);
  const [filteredInspirations, setFilteredInspirations] = useState<CreativeInspiration[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get all unique tags
  const allTags = [...new Set(inspirations.flatMap(insp => insp.tags || []))];
  
  // Fetch all inspirations
  useEffect(() => {
    const fetchInspirations = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/app/studio/retouchr/creative-inspirations');
        
        if (!response.ok) {
          throw new Error('Failed to fetch inspirations');
        }
        
        const data = await response.json();
        setInspirations(data);
        setFilteredInspirations(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load inspirations');
        console.error('Error fetching inspirations:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInspirations();
  }, []);
  
  // Filter inspirations based on search and tags
  useEffect(() => {
    let filtered = inspirations;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(insp => 
        insp.name.toLowerCase().includes(query)
      );
    }
    
    if (selectedTags.length > 0) {
      filtered = filtered.filter(insp => 
        selectedTags.every(tag => insp.tags?.includes(tag))
      );
    }
    
    setFilteredInspirations(filtered);
  }, [searchQuery, selectedTags, inspirations]);
  
  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };
  
  return (
    <div className="space-y-8">
      {/* Only show the header in standalone mode, not in the dialog */}
      {window.location.pathname.includes('/creative-inspirations') && (
        <div>
          <h2 className="text-2xl font-bold">Creative Inspirations</h2>
          <p className="text-muted-foreground">Choose an inspiration to replicate with your product</p>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Input
          placeholder="Search inspirations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        
        <Badge variant="outline" className="px-3 py-1.5 text-sm self-start sm:self-auto">
          {filteredInspirations.length} inspirations found
        </Badge>
      </div>
      
      {allTags.length > 0 && (
        <div className="flex gap-2.5 flex-wrap">
          {allTags.map(tag => (
            <Badge 
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "outline"}
              className="cursor-pointer px-3 py-1 text-sm hover:opacity-80 transition-opacity"
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden shadow-sm hover:shadow transition-shadow">
              <Skeleton className="w-full h-48" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center rounded-lg border border-red-200 bg-red-50">
          <p className="text-red-500 font-medium">{error}</p>
        </div>
      ) : filteredInspirations.length === 0 ? (
        <div className="text-center py-12 rounded-lg border border-muted bg-muted/10">
          <p className="text-muted-foreground">
            {inspirations.length === 0 
              ? "No inspirations available yet." 
              : "No inspirations match your filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredInspirations.map(inspiration => (
            <InspirationThumbnail
              key={inspiration.id}
              inspiration={inspiration}
              onClick={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};
