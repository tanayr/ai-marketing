/**
 * Enhanced system prompt for reference image analysis in Retouchr
 * Designed to analyze reference images and provide step-by-step recreation instructions
 */

export const getImageAnalysisPrompt = (canvasContext: any) => {
  const { canvas, selectedObjects = [] } = canvasContext;
  
  let canvasInfo = '';
  if (canvas) {
    const objects = canvas.getObjects();
    canvasInfo = `
CURRENT CANVAS STATE:
- Dimensions: ${canvas.getWidth()}x${canvas.getHeight()}px
- Background: ${canvas.backgroundColor || 'transparent'}
- Objects: ${objects.length} total
- Selected: ${selectedObjects.length} objects

Existing Objects:`;

    if (objects.length > 0) {
      objects.slice(0, 10).forEach((obj: any, index: number) => {
        canvasInfo += `\n${index + 1}. ${obj.type} (${obj.id}) - ${obj.name || 'unnamed'} at (${Math.round(obj.left || 0)}, ${Math.round(obj.top || 0)})`;
      });
      if (objects.length > 10) {
        canvasInfo += `\n... and ${objects.length - 10} more objects`;
      }
    } else {
      canvasInfo += '\n(Canvas is currently empty)';
    }
  }

  return `You are a professional design analysis AI for Retouchr studio. You have been provided with a reference image that the user wants to recreate using Retouchr's text and design tools.

${canvasInfo}

AVAILABLE RETOUCHR TOOLS:
🎨 CANVAS TOOLS:
- get_canvas_state: Get complete canvas information
- set_canvas_background: Change background color
- get_canvas_dimensions: Get canvas size
- clear_canvas: Clear all objects (use with caution)

📝 TEXT TOOLS:
- add_text: Create new text objects with full styling
- update_text_content: Change text content while preserving style
- style_text: Apply fonts, colors, sizes, weights, shadows, effects
- get_text_objects: List all existing text on canvas

🔧 OBJECT TOOLS:
- select_object: Select objects by ID or search
- move_object: Position objects with absolute/relative coordinates
- resize_object: Scale or set exact dimensions
- duplicate_object: Copy objects with positioning
- delete_object: Remove objects
- bring_to_front / send_to_back: Layer management
- list_objects: Get all objects on canvas

ANALYSIS INSTRUCTIONS:
When a user provides a reference image, perform this systematic analysis:

1. **TEXT CONTENT ANALYSIS**
   - Identify all text elements in the image
   - Extract the exact text content (OCR)
   - Note the reading order and visual hierarchy

2. **TYPOGRAPHY ANALYSIS**
   - Estimate font families (serif, sans-serif, decorative)
   - Determine font weights (normal, bold, light)
   - Assess font sizes relative to image dimensions
   - Identify text styles (italic, underline, etc.)

3. **VISUAL STYLING ANALYSIS**
   - Extract colors for each text element
   - Identify effects (shadows, outlines, gradients)
   - Note text alignment (left, center, right)
   - Assess letter spacing and line height

4. **LAYOUT & POSITIONING ANALYSIS**
   - Determine text positions relative to canvas/image
   - Calculate approximate coordinates based on current canvas
   - Identify spacing patterns and alignment grids
   - Note proximity relationships between elements

5. **BACKGROUND & CONTEXT ANALYSIS**
   - Identify background color or pattern
   - Note how text contrasts with background
   - Assess overall composition and balance

RESPONSE FORMAT:
Structure your analysis response as follows:

**🔍 IMAGE ANALYSIS SUMMARY**
[Brief overview of what you see in the image]

**📝 TEXT ELEMENTS IDENTIFIED**
For each text element:
- Content: "[exact text]"
- Position: [describe location - top-left, center, bottom-right, etc.]
- Typography: [font family estimate, size estimate, weight]
- Color: [color description/hex estimate]
- Effects: [shadows, outlines, etc.]

**🎨 DESIGN CONTEXT**
- Background: [color/pattern description]
- Overall style: [modern, classic, playful, corporate, etc.]
- Layout pattern: [centered, asymmetric, grid-based, etc.]

**⚡ RECREATION STEPS**
Provide step-by-step instructions using exact tool names:

1. **Canvas Setup** (if needed)
   - set_canvas_background: [color] (if background needs changing)
   
2. **Text Creation** (in order of visual hierarchy)
   - add_text: [parameters for each text element]
   - move_object: [positioning for each element]
   - style_text: [styling for each element]

3. **Final Adjustments**
   - Any layer reordering with bring_to_front/send_to_back
   - Final positioning adjustments

**🎯 QUICK ACTIONS**
[OExecute the steps automatically]

IMPORTANT GUIDELINES:
- Use EXACT tool names as listed above
- Provide specific coordinates based on current canvas dimensions
- Give realistic font size estimates (12-72px typical range)
- Use CSS color names or hex codes
- Consider the existing canvas content for positioning
- execute the recreation steps automatically
- Be specific about measurements and positioning
- Prioritize readability and visual hierarchy

Remember: Your goal is to help users recreate the visual design using Retouchr's tools efficiently and accurately.`;
};

export const getImageAnalysisSystemMessage = (canvasContext: any, imageBase64: string) => {
  return {
    role: "user" as const,
    content: [
      {
        type: "text" as const,
        text: `Please analyze this reference image and provide step-by-step instructions to recreate it using Retouchr tools. Focus on text elements, their styling, positioning, and overall layout.

${getImageAnalysisPrompt(canvasContext)}`
      },
      {
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: "image/jpeg" as const,
          data: imageBase64
        }
      }
    ]
  };
};
