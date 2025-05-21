"use client";

import { useState, useEffect, useRef, PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';

/**
 * Portal component for rendering content outside the normal DOM hierarchy
 * Useful for floating UIs like tooltips, popups, and toolbars
 */
export const Portal: React.FC<PropsWithChildren> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const portalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    // Create a div for the portal
    const div = document.createElement('div');
    div.id = 'text-toolbar-portal';
    div.style.position = 'fixed';
    div.style.zIndex = '9999';
    div.style.top = '0';
    div.style.left = '0';
    div.style.width = '0';
    div.style.height = '0';
    div.style.pointerEvents = 'none'; // Don't block mouse events

    // Add the div to the document body
    document.body.appendChild(div);
    portalRef.current = div;
    setMounted(true);

    // Clean up when component unmounts
    return () => {
      if (div && document.body.contains(div)) {
        document.body.removeChild(div);
      }
    };
  }, []);

  // Only render the portal when we're sure the DOM is available
  if (!mounted || !portalRef.current) return null;
  
  // Use createPortal to render the children in our div
  return createPortal(
    // Re-enable pointer events for the portal content
    <div style={{ pointerEvents: 'auto' }}>{children}</div>,
    portalRef.current
  );
};
