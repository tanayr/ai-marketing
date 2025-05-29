/**
 * Provider system types for multi-studio support
 */

// Base provider interface
export interface ChatProvider {
  id: string;
  name: string;
  description: string;
  tools: ToolDefinition[];
  contextMatcher: (route: string) => boolean;
  initialize?: (context: any) => Promise<void>;
  cleanup?: () => Promise<void>;
}

// Tool definition for providers
export interface ToolDefinition {
  name: string;
  description: string;
  category: ToolCategory;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  outputSchema?: {
    type: 'object';
    properties: Record<string, any>;
  };
  examples?: Array<{
    description: string;
    input: Record<string, any>;
    context: string;
  }>;
  handler: (input: Record<string, any>, context: any) => Promise<ToolExecutionResult>;
}

// Tool categories
export type ToolCategory = 
  | 'canvas'
  | 'text'
  | 'objects'
  | 'images'
  | 'design'
  | 'export'
  | 'utility'
  | 'navigation'
  | 'layer'
  | 'image';

// Tool execution handler
export interface ToolHandler {
  (input: any, context: ProviderContext): Promise<ToolExecutionResult>;
}

// Provider-specific context
export interface ProviderContext {
  providerId: string;
  userId: string;
  organizationId: string;
  sessionId: string;
  route: string;
  [key: string]: any; // Provider-specific data
}

// Tool execution result
export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    executionTime: number;
    changedObjects: string[];
    stateSnapshot?: any;
  };
}

// Tool usage examples
export interface ToolExample {
  description: string;
  input: Record<string, any>;
  expectedOutput?: any;
  context?: string;
}

// Provider registry entry
export interface ProviderRegistryEntry {
  provider: ChatProvider;
  isActive: boolean;
  lastUsed?: number;
  errorCount: number;
}

// Claude tool format (for API calls)
export interface ClaudeToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

// Tool provider interface
export interface ToolProvider {
  id: string;
  name: string;
  description: string;
  version: string;
  tools: ToolDefinition[];
  contextRequirements: Record<string, string>;
  extractContext: (route: string, globalContext: any) => any;
  validateContext: (context: any) => { valid: boolean; errors: string[] };
  getSystemPrompt?: (context: any, hasImage?: boolean) => string;
  getPromptOptions?: () => Array<{ id: string; name: string; description: string }>;
  cleanup?: () => Promise<void>;
}
