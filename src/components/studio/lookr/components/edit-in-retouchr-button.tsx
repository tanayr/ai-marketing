"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { SavedPrediction } from '../types';
import { createRetouchrDesignFromPrediction } from '../utils/retouchr-integration';

interface EditInRetouchrButtonProps {
  prediction: SavedPrediction;
  className?: string;
}

export const EditInRetouchrButton = ({ prediction, className }: EditInRetouchrButtonProps) => {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const handleClick = async () => {
    if (isCreating) return;

    try {
      setIsCreating(true);
      
      // Create a new Retouchr design with the prediction image
      const designId = await createRetouchrDesignFromPrediction(prediction);
      
      if (designId) {
        // Navigate to Retouchr studio with the new design
        router.push(`/app/studio/retouchr?id=${designId}`);
      }
    } catch (error) {
      console.error('Error creating Retouchr design:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isCreating}
      variant="secondary"
      className={`absolute top-2 right-2 z-10 px-3 py-2 h-auto text-sm shadow-md ${className || ''}`}
    >
      <Pencil className="w-4 h-4 mr-2" />
      {isCreating ? 'Creating...' : 'Edit in Retouchr'}
    </Button>
  );
};
