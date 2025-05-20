"use client";

import { useState, useEffect } from 'react';
import { LookrStudio } from '@/components/studio/lookr/lookr-studio';
import { useNavigation } from '@/lib/navigation/navigation-context';

// CSS override to remove padding and width restrictions on parent containers
const removeParentPadding = `
  :where(.p-6) {
    padding: 0 !important;
  }
  :where(.max-w-7xl) {
    max-width: 100% !important; 
  }
`;

export default function LookrStudioPage() {
  const { setForceCollapsed } = useNavigation();
  
  // Force sidebar to be collapsed when in lookr studio for more space
  useEffect(() => {
    // Set force collapsed when component mounts
    setForceCollapsed(true);
    
    // Restore normal behavior when component unmounts
    return () => {
      setForceCollapsed(false);
    };
  }, [setForceCollapsed]);
  
  return (
    <>
      <style jsx global>{removeParentPadding}</style>
      <div className="h-[calc(100vh-4rem)] overflow-hidden">
        <LookrStudio />
      </div>
    </>
  );
}
