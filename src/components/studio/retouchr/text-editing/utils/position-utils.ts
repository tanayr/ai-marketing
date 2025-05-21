import { fabric } from '../../utils/fabric-imports';

/**
 * Calculate the position for the floating toolbar based on a text object's position
 */
export const calculateToolbarPosition = (
  canvas: fabric.Canvas,
  object: fabric.Object
): { top: number; left: number } => {
  if (!canvas || !object) return { top: 0, left: 0 };
  
  // Get object bounding box
  const objBoundingBox = (object as any).getBoundingRect ? (object as any).getBoundingRect() : {
    left: object.left || 0,
    top: object.top || 0,
    width: 100,
    height: 20
  };
  
  // Get canvas element and its position on the page
  const canvasEl = (canvas as any).getElement ? (canvas as any).getElement() : document.createElement('canvas');
  const canvasRect = canvasEl.getBoundingClientRect();
  
  // Get zoom level
  const zoom = (canvas as any).getZoom ? (canvas as any).getZoom() : 1;
  
  // Get viewportTransform for pan adjustment
  const vpt = (canvas as any).viewportTransform || [1, 0, 0, 1, 0, 0];
  
  // Calculate position
  const left = canvasRect.left + (objBoundingBox.left * zoom) + (vpt[4] || 0);
  const top = canvasRect.top + (objBoundingBox.top * zoom) + (vpt[5] || 0);
  
  // Calculate center position horizontally and position above object
  const position = {
    left: left + (objBoundingBox.width * zoom) / 2,
    top: top - 35, // Position 35px above the object (was 10px before)
  };
  
  // Ensure toolbar stays within viewport
  return adjustPositionForViewport(position);
};

/**
 * Adjust toolbar position to ensure it stays within viewport
 */
const adjustPositionForViewport = (position: { top: number; left: number }) => {
  const TOOLBAR_HEIGHT = 40; // Estimated toolbar height
  const TOOLBAR_WIDTH = 400; // Estimated toolbar width
  const MARGIN = 10; // Margin from edge of viewport
  
  // Get viewport dimensions
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Adjust horizontally if too close to edges
  if (position.left - TOOLBAR_WIDTH / 2 < MARGIN) {
    position.left = MARGIN + TOOLBAR_WIDTH / 2;
  } else if (position.left + TOOLBAR_WIDTH / 2 > viewportWidth - MARGIN) {
    position.left = viewportWidth - MARGIN - TOOLBAR_WIDTH / 2;
  }
  
  // Adjust vertically if too close to top
  if (position.top - TOOLBAR_HEIGHT < MARGIN) {
    // Position below the object instead of above
    position.top += TOOLBAR_HEIGHT + 40; // 40 is approximate object height 
  }
  
  return position;
};
