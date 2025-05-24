'use client';

import React, { useState, useEffect } from 'react';
import { GlobalChatOverlay } from '@/components/ai-chat/GlobalChatOverlay';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useRetouchrCanvas } from '../hooks/useRetouchrCanvas';

interface RetouchrAIChatProps {
  designId: string;
  organizationId: string;
}

export function RetouchrAIChat({ designId, organizationId }: RetouchrAIChatProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { canvas, selectedObjects } = useRetouchrCanvas();

  // Global keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsChatOpen(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Make canvas globally available for AI tools
  useEffect(() => {
    if (canvas && typeof window !== 'undefined') {
      (window as any).fabricCanvas = canvas;
      (window as any).selectedObjects = selectedObjects;
      (window as any).designContext = {
        designId,
        organizationId
      };
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).fabricCanvas;
        delete (window as any).selectedObjects;
        delete (window as any).designContext;
      }
    };
  }, [canvas, selectedObjects, designId, organizationId]);

  return (
    <>
      {/* AI Chat Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={() => setIsChatOpen(true)}
          className="rounded-full h-12 w-12 shadow-lg hover:shadow-xl transition-all duration-200"
          variant="default"
        >
          <Sparkles className="w-5 h-5" />
        </Button>
      </div>

      {/* Chat Overlay */}
      <GlobalChatOverlay 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </>
  );
}
