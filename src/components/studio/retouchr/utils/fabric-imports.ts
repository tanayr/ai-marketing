// Fabric.js browser-only import for Next.js compatibility
"use client"; // Mark as client component

// Use dynamic import to ensure this only runs in browser context
let fabric: any;

// Initialize fabric only on the client side
if (typeof window !== 'undefined') {
  // Safe import for browser environment
  try {
    const fabricModule = require('fabric');
    fabric = fabricModule.fabric;
  } catch (error) {
    console.error('Error loading Fabric.js:', error);
    // Provide fallback implementation
    fabric = {
      Canvas: class {},
      Text: class {},
      IText: class {},
      Image: class {},
      Rect: class {}
    };
  }
} else {
  // Provide empty implementations for server-side rendering
  fabric = {
    Canvas: class {},
    Text: class {},
    IText: class {},
    Image: class {},
    Rect: class {}
  };
}

export { fabric };

// Extended type definitions to enhance the existing fabric namespace
declare global {
  namespace fabric {
    interface Object {
      id?: string;
      name?: string;
      type: string;
      visible: boolean;
      top: number;
      left: number;
      scaleX: number;
      scaleY: number;
      set(options: any): fabric.Object;
      set(key: string, value: any): fabric.Object;
      bringForward(): fabric.Object;
      sendBackwards(): fabric.Object;
      bringToFront(): fabric.Object;
      sendToBack(): fabric.Object;
      clone(callback?: (obj: fabric.Object) => any): fabric.Object;
      get(property: string): any;
      setCoords(): fabric.Object;
      remove(): fabric.Object;
      toObject(propertiesToInclude?: string[]): object;
    }
    
    interface Canvas {
      // Base methods
      getCenter(): { top: number; left: number };
      add(object: fabric.Object): fabric.Canvas;
      remove(object: fabric.Object): fabric.Canvas;
      getObjects(): fabric.Object[];
      getActiveObjects(): fabric.Object[];
      getActiveObject(): fabric.Object | null;
      setActiveObject(object: fabric.Object): fabric.Canvas;
      renderAll(): fabric.Canvas;
      clear(): fabric.Canvas;
      loadFromJSON(json: any, callback?: Function): fabric.Canvas;
      toJSON(propertiesToInclude?: string[]): any;
      toDataURL(options?: any): string;
      
      // Dimensions
      width: number;
      height: number;
      setDimensions(dimensions: { width: number; height: number }): fabric.Canvas;
      setZoom(value: number): fabric.Canvas;
      
      // Event handling
      on(eventName: string, handler: Function): fabric.Canvas;
      off(eventName: string, handler: Function): fabric.Canvas;
      dispose(): void;
    }
    
    interface IEvent {
      target?: fabric.Object;
      e?: Event;
    }
    
    class Canvas {
      constructor(element: string | HTMLCanvasElement, options?: any);
    }
    
    class Text extends Object {
      constructor(text: string, options?: any);
      text: string;
      fontFamily: string;
      fontSize: number;
      fontWeight: string;
      textAlign: string;
      fill: string;
    }
    
    class IText extends Text {
      constructor(text: string, options?: any);
    }
    
    class Image extends Object {
      constructor(element: HTMLImageElement, options?: any);
      static fromURL(url: string, callback: (image: fabric.Image) => any, options?: any): void;
      width: number;
      height: number;
      scale(value: number): fabric.Image;
      scaleToWidth(value: number): fabric.Image;
      scaleToHeight(value: number): fabric.Image;
      getScaledWidth(): number;
      getScaledHeight(): number;
      set(options: any): fabric.Image;
      set(key: string, value: any): fabric.Image;
    }
    
    class Rect extends Object {
      constructor(options?: any);
    }
  }
}

// Export type definitions that can be imported by other files
export type FabricCanvas = fabric.Canvas;
export type FabricObject = fabric.Object;
export type FabricText = fabric.Text;
export type FabricIText = fabric.IText;
export type FabricImage = fabric.Image;
export type FabricRect = fabric.Rect;
export type FabricIEvent = fabric.IEvent;
