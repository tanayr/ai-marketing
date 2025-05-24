/**
 * Retouchr Provider - Registers all Retouchr tools
 */

import { ToolProvider } from '../../types/providers';
import { canvasTools } from './tools/canvas-tools';
import { textTools } from './tools/text-tools';
import { objectTools } from './tools/object-tools';

export const retouchrProvider: ToolProvider = {
  id: 'retouchr',
  name: 'Retouchr Studio',
  description: 'Complete design tools for Retouchr canvas manipulation',
  version: '1.0.0',
  tools: [
    ...canvasTools,
    ...textTools,
    ...objectTools
  ],
  contextRequirements: {
    canvas: 'Canvas instance from useCanvas hook',
    selectedObjects: 'Currently selected objects array',
    user: 'Current user context',
    organization: 'Current organization context'
  },
  
  // Context extraction for Retouchr routes
  extractContext: (route: string, globalContext: any) => {
    // Extract design ID from route if available
    const designIdMatch = route.match(/\/app\/studio\/retouchr\/([^\/]+)/);
    const designId = designIdMatch ? designIdMatch[1] : null;

    return {
      designId,
      studioType: 'retouchr',
      route,
      timestamp: Date.now(),
      // Pass through canvas context
      canvas: globalContext.canvas,
      selectedObjects: globalContext.selectedObjects || [],
      user: globalContext.user,
      organization: globalContext.organization
    };
  },

  // Validation before tool execution
  validateContext: (context: any) => {
    const errors: string[] = [];
    
    if (!context.canvas) {
      errors.push('Canvas instance is required');
    }
    
    if (!context.user) {
      errors.push('User authentication required');
    }
    
    if (!context.organization) {
      errors.push('Organization context required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  // Prepare system prompt with current canvas context
  getSystemPrompt: (context: any) => {
    const { canvas, selectedObjects = [] } = context;
    
    let canvasInfo = '';
    if (canvas) {
      const objects = canvas.getObjects();
      canvasInfo = `
Current Canvas State:
- Dimensions: ${canvas.getWidth()}x${canvas.getHeight()}px
- Background: ${canvas.backgroundColor || 'transparent'}
- Objects: ${objects.length} total
- Selected: ${selectedObjects.length} objects
`;

      if (objects.length > 0) {
        canvasInfo += '\nExisting Objects:\n';
        objects.slice(0, 10).forEach((obj: any, index: number) => {
          canvasInfo += `${index + 1}. ${obj.type} (${obj.id}) - ${obj.name || 'unnamed'}\n`;
        });
        if (objects.length > 10) {
          canvasInfo += `... and ${objects.length - 10} more objects\n`;
        }
      }
    }

    return `You are an AI assistant for Retouchr, a professional design studio application. You have access to powerful tools for manipulating a fabric.js canvas. Your replies should be short, concise and casual / friendly. 

CURRENT CONTEXT:
${canvasInfo}

CAPABILITIES:
You can perform comprehensive design operations including:

🎨 CANVAS OPERATIONS:
- Get complete canvas state and object information
- Change background colors and canvas properties
- Clear canvas (with confirmation)

📝 TEXT OPERATIONS:
- Add new text with full styling control
- Update existing text content
- Apply rich formatting (fonts, colors, alignment, effects)
- Find and modify text objects

🔧 OBJECT MANIPULATION:
- Select objects by ID or content search
- Move objects with absolute or relative positioning
- Resize objects with scaling or exact dimensions
- Delete objects (with confirmation)
- Duplicate objects with positioning
- Layer management (bring to front, send to back)

IMPORTANT GUIDELINES:
0. Always give short replies without any extra information. No technical info needed.
1. ALWAYS get canvas state first when user asks "what's on the canvas"
2. Use get_text_objects to see existing text before making changes
3. Always confirm destructive actions (delete, clear)
4. Provide specific coordinates and measurements
5. Reference objects by their visible text content when possible
6. Batch multiple operations efficiently
7. Give clear feedback about what changed. Never return object id or any other internal ids.
8. Your replies should be short, concise and casual / friendly. 

TOOL NAMING - CRITICAL - READ CAREFULLY:
You MUST use these EXACT tool names (case-sensitive) or your tool calls will FAIL:
- set_canvas_background (NOT set_background, background, change_background)
- style_text (NOT update_text_properties, format_text, text_style)
- update_text_content (NOT update_text, change_text, modify_text)
- add_text (NOT create_text, new_text)
- move_object (NOT position_object, relocate_object)
- resize_object (NOT scale_object, change_size)
- delete_object (NOT remove_object)
- select_object (NOT choose_object)
- duplicate_object (NOT clone_object, copy_object)
- bring_to_front (NOT move_forward)
- send_to_back (NOT move_backward)
- get_canvas_state (NOT canvas_state, get_state)
- get_text_objects (NOT list_text, find_text)

ALWAYS CHECK THE EXACT TOOL NAME before using a tool. If you're unsure, use get_canvas_state first to understand the canvas before taking action.

SECURITY:
- All operations are scoped to the current user's design
- Organization-level permissions are enforced
- Changes are immediately visible in the canvas

You can execute multiple tools in a single response to accomplish complex design tasks efficiently.`;
  }
};
