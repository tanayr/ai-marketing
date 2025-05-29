// text-tools.ts

/**
 * Text manipulation tools for Retouchr
 * Direct text manipulation with fabric.js
 * This file now serves as an aggregator for modularized text tools.
 */

import { ToolDefinition } from '../../../types/providers';

// Import tool definitions from their respective modules
import { addTextTool } from './text-tools-add';
import { updateTextContentTool } from './text-tools-update';
import { styleTextTool } from './text-tools-style';
import { getTextObjectsTool } from './text-tools-get';

// Assemble the tools into the main export array
export const textTools: ToolDefinition[] = [
  addTextTool,
  updateTextContentTool,
  styleTextTool,
  getTextObjectsTool
];
