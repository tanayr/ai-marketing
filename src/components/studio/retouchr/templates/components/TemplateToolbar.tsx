"use client";

import React, { useState, useEffect } from 'react';
import { LayoutTemplate, Save } from 'lucide-react';
import { TemplateGallery } from './TemplateGallery';
import { SaveTemplateModal } from './SaveTemplateModal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useTemplateCreator } from '../hooks/useTemplateCreator';

/**
 * Template toolbar component for Retouchr
 */
export const TemplateToolbar: React.FC = () => {
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const { checkIsSuperAdmin } = useTemplateCreator();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  // Check if user is super admin
  useEffect(() => {
    const checkAdmin = async () => {
      const isAdmin = await checkIsSuperAdmin();
      setIsSuperAdmin(isAdmin);
    };
    
    checkAdmin();
  }, [checkIsSuperAdmin]);
  
  // Open save template modal
  const handleOpenSaveModal = () => {
    setIsSaveModalOpen(true);
  };
  
  // Close save template modal
  const handleCloseSaveModal = () => {
    setIsSaveModalOpen(false);
  };
  
  // Handle successful template saving
  const handleTemplateSaved = () => {
    setIsSaveModalOpen(false);
  };
  
  return (
    <div className="flex flex-col h-full">
      <h3 className="text-xs font-medium mb-2">Templates</h3>
      
      {/* Template gallery */}
      <ScrollArea className="flex-1">
        <TemplateGallery />
      </ScrollArea>
      
      {/* Save as template button (super admin only) */}
      {isSuperAdmin && (
        <div className="pt-3">
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center"
            onClick={handleOpenSaveModal}
          >
            <Save className="h-4 w-4 mr-2" />
            Save as Template
          </Button>
        </div>
      )}
      
      {/* Save template modal */}
      <SaveTemplateModal
        isOpen={isSaveModalOpen}
        onClose={handleCloseSaveModal}
        onSuccess={handleTemplateSaved}
      />
    </div>
  );
};
