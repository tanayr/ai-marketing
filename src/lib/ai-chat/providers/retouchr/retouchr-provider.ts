/**
 * Retouchr Provider - Registers all Retouchr tools
 */

import { ToolProvider } from '../../types/providers';
// Import v2 tools instead of v1 tools
import { allToolsV2 } from './toolsv2/retouchr-tool-provider';
// Comment out v1 tools
// import { canvasTools } from './tools/canvas-tools';
// import { textTools } from './tools/text-tools';
// import { objectTools } from './tools/object-tools';
import { getImageAnalysisPrompt } from './prompts/image-analysis-prompt';
import { generateSystemPrompt, getAvailablePromptOptions } from './prompts';

export const retouchrProvider: ToolProvider = {
  id: 'retouchr',
  name: 'Retouchr Studio',
  description: 'Complete design tools for Retouchr canvas manipulation',
  version: '1.0.0',
  tools: allToolsV2, // Use v2 tools instead of v1 tools
  // Old v1 tools:
  // tools: [
  //   ...canvasTools,
  //   ...textTools,
  //   ...objectTools
  // ],
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

  // Expose available prompt options for the UI
  getPromptOptions: () => {
    return getAvailablePromptOptions();
  },

  // Prepare system prompt with current canvas context and selected prompt style
  getSystemPrompt: (context: any, hasImage: boolean = false) => {
    const { canvas, selectedObjects = [], promptId = 'default' } = context;
    
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
          let textInfo = '';
          
          // Add text content for text objects
          if (['text', 'i-text', 'enhanced-text', 'advanced-text'].includes(obj.type) && obj.text) {
            textInfo = ` - "${obj.text.length > 25 ? obj.text.substring(0, 25) + '...' : obj.text}"`;
          }
          
          canvasInfo += `${index + 1}. ${obj.type} (${obj.id}) - ${obj.name || 'unnamed'}${textInfo}\n`;
        });
        if (objects.length > 10) {
          canvasInfo += `... and ${objects.length - 10} more objects\n`;
        }
      }
    }

    // Generate the system prompt using the selected prompt style
    return generateSystemPrompt(promptId, canvasInfo, hasImage);
  }
};
