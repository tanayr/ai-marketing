'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Palette, Code, Settings } from 'lucide-react';

interface ContextIndicatorProps {
  context: {
    provider?: string;
    designId?: string;
    route?: string;
  } | null;
}

export function ContextIndicator({ context }: ContextIndicatorProps) {
  if (!context?.provider) {
    return (
      <Badge variant="outline" className="text-xs">
        <Settings className="w-3 h-3 mr-1" />
        General
      </Badge>
    );
  }

  const getContextInfo = () => {
    switch (context.provider) {
      case 'retouchr':
        return {
          icon: <Palette className="w-3 h-3 mr-1" />,
          label: 'Retouchr Studio',
          variant: 'default' as const
        };
      default:
        return {
          icon: <Code className="w-3 h-3 mr-1" />,
          label: context.provider,
          variant: 'secondary' as const
        };
    }
  };

  const { icon, label, variant } = getContextInfo();

  return (
    <Badge variant={variant} className="text-xs">
      {icon}
      {label}
    </Badge>
  );
}
