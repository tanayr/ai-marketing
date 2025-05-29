/**
 * Prompt management system for Retouchr provider
 * Exports all available prompts and manages prompt selection
 */

import { defaultPrompt } from './default';
import { creativePrompt } from './creative';
import { technicalPrompt } from './technical';
import { minimalPrompt } from './minimal';
import { getImageAnalysisPrompt } from './image-analysis-prompt';

// Define prompt type
export type RetouchrPromptGenerator = (canvasInfo: string, hasImage: boolean, imageAnalysisPrompt?: string) => string;

// Define the prompt options
export interface PromptOption {
  id: string;
  name: string;
  description: string;
  generator: RetouchrPromptGenerator;
}

// Available prompt options
export const promptOptions: PromptOption[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Standard balanced prompt with comprehensive instructions',
    generator: defaultPrompt
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Design-focused prompt with emphasis on creative suggestions',
    generator: creativePrompt
  },
  {
    id: 'technical',
    name: 'Technical',
    description: 'Precise prompt with detailed technical specifications',
    generator: technicalPrompt
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Concise prompt with minimal explanations',
    generator: minimalPrompt
  }
];

// Default prompt ID
const DEFAULT_PROMPT_ID = 'default';

// Get prompt generator by ID
export function getPromptGeneratorById(promptId: string): RetouchrPromptGenerator {
  const option = promptOptions.find(opt => opt.id === promptId);
  return option?.generator || defaultPrompt;
}

// Generate system prompt with selected prompt style and canvas context
export function generateSystemPrompt(
  promptId: string,
  canvasInfo: string,
  hasImage: boolean = false
): string {
  const generator = getPromptGeneratorById(promptId);
  const imageAnalysisPromptText = hasImage ? getImageAnalysisPrompt({}) : undefined;
  return generator(canvasInfo, hasImage, imageAnalysisPromptText);
}

// Get all available prompt options for UI display
export function getAvailablePromptOptions(): PromptOption[] {
  return promptOptions;
}

// Export default prompt generator for backwards compatibility
export { defaultPrompt };
