/**
 * Global AI Chat System Types
 * System-wide chat that works across all studios/tools
 */

// Global chat context - detects current app context
export interface GlobalChatContext {
  currentRoute: string;
  activeProvider: string | null;
  availableProviders: string[];
  userId: string;
  organizationId: string;
  canvas?: any;
  selectedObjects?: any[];
  user?: any;
  organization?: any;
  promptId?: string; // Add promptId field to enable prompt selection
}

// Chat message types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{
    type: 'text' | 'image';
    text?: string;
    source?: {
      type: 'base64';
      media_type: string;
      data: string;
    };
  }>;
  timestamp: number;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  provider?: string;
  imageData?: {
    file: File;
    base64: string;
    preview: string;
  };
}

// Tool call from Claude
export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, any>;
  provider: string;
}

// Tool execution result
export interface ToolResult {
  toolCallId: string;
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
}

// Chat session state
export interface ChatSession {
  id: string;
  provider: string;
  context: GlobalChatContext;
  messages: ChatMessage[];
  createdAt: number;
  lastActivity: number;
  isOpen: boolean;
  isProcessing: boolean;
  currentToolExecution?: MultiToolExecution;
}

// Multiple tool execution tracking
export interface MultiToolExecution {
  id: string;
  totalTools: number;
  completedTools: number;
  currentTool?: string;
  startTime: number;
  tools: Array<{
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startTime?: number;
    endTime?: number;
    result?: ToolResult;
  }>;
}

// Global chat state
export interface GlobalChatState {
  session: ChatSession | null;
  isVisible: boolean;
  keyboardShortcutEnabled: boolean;
}

// Provider detection result
export interface ContextDetectionResult {
  provider: string | null;
  context: Record<string, any>;
  availableTools: string[];
}
