'use client';

import React from 'react';
import { Loader2, CheckCircle, XCircle, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ToolProgressProps {
  toolName: string;
  status: 'running' | 'success' | 'error' | 'pending';
  result?: any;
}

export function ToolProgress({ toolName, status, result }: ToolProgressProps) {
  // Get user-friendly tool name
  const getFriendlyToolName = (name: string) => {
    // Extract just the last part if it has dots
    const baseName = name.includes('.') ? name.split('.').pop() || name : name;
    return baseName.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Get status message
  const getStatusMessage = () => {
    const friendlyName = getFriendlyToolName(toolName);
    switch (status) {
      case 'running':
        return `Using ${friendlyName}...`;
      case 'success':
        return `Used ${friendlyName}`;
      case 'error':
        return `Failed to use ${friendlyName}`;
      case 'pending':
      default:
        return `Preparing to use ${friendlyName}...`;
    }
  };

  // Status-based styles
  const statusStyles = {
    running: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    pending: 'bg-gray-50 text-gray-700 border-gray-200'
  };

  // Status icons
  const statusIcon = {
    running: '⚙️',
    success: '✅',
    error: '❌',
    pending: '⏳'
  };

  return (
    <div className={`my-1 px-2 py-1 rounded border ${statusStyles[status] || statusStyles.pending}`}>
      <div className="flex items-center">
        <span className="mr-1">{statusIcon[status] || statusIcon.pending}</span>
        <span className="text-xs">{getStatusMessage()}</span>
      </div>
    </div>
  );
}
