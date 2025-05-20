"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import { Avatar } from '../types';
import Image from 'next/image';

interface AvatarSelectionPanelProps {
  avatars: Avatar[];
  isLoading: boolean;
  selectedAvatarId: string | null;
  onAvatarSelected: (avatar: Avatar) => void;
}

export function AvatarSelectionPanel({
  avatars,
  isLoading,
  selectedAvatarId,
  onAvatarSelected,
}: AvatarSelectionPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter avatars based on search query
  const filteredAvatars = avatars.filter(avatar =>
    avatar.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Find the currently selected avatar
  const selectedAvatar = avatars.find(avatar => avatar.id === selectedAvatarId);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-none p-4 border-b">
        <h2 className="text-lg font-semibold">Select AI Avatar</h2>
        <p className="text-sm text-muted-foreground">Choose an avatar to try on your product</p>
      </div>

      <div className="flex-none p-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search avatars..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden divide-y">
        {/* Avatar selection section (upper part) */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 grid grid-cols-2 gap-3">
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="aspect-square">
                        <Skeleton className="h-full w-full" />
                      </div>
                      <div className="p-2">
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredAvatars.length === 0 ? (
                <div className="col-span-2 py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? 'No avatars found matching your search'
                      : 'No avatars available'}
                  </p>
                </div>
              ) : (
                filteredAvatars.map((avatar) => (
                  <Card
                    key={avatar.id}
                    className={`overflow-hidden cursor-pointer transition-all ${
                      selectedAvatarId === avatar.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => onAvatarSelected(avatar)}
                  >
                    <CardContent className="p-0 aspect-square relative">
                      <Image
                        src={avatar.imageUrl}
                        alt={avatar.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={selectedAvatarId === avatar.id}
                        className="object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-2">
                        <p className="text-sm font-medium truncate">{avatar.name}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Example outputs section (lower part) */}
        <div className="flex-none h-2/5 overflow-hidden">
          <div className="p-4 h-full">
            <h3 className="text-sm font-medium mb-3">Example Outputs</h3>
            
            {!selectedAvatar ? (
              <div className="h-[calc(100%-28px)] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Select an avatar to see examples
                </p>
              </div>
            ) : !selectedAvatar.examples || selectedAvatar.examples.length === 0 ? (
              <div className="h-[calc(100%-28px)] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No examples available for this avatar
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 h-[calc(100%-28px)]">
                {selectedAvatar.examples.slice(0, 4).map((exampleUrl, index) => (
                  <div key={index} className="aspect-square relative rounded-md overflow-hidden">
                    <Image
                      src={exampleUrl}
                      alt={`Example ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
