import React from 'react';

export function TypingIndicator() {
  return (
    <div className="flex space-x-1 items-center py-1">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
    </div>
  );
}
