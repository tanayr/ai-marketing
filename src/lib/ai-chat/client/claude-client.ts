/**
 * Claude Client with Tool Calling and Streaming
 */

import { ChatMessage, ToolCall, ToolResult } from '../types/global';
import { ToolDefinition } from '../types/providers';

// Simple response type for API calls
interface ChatResponse {
  id: string;
  content: string;
  toolCalls?: ToolCall[];
}

export class ClaudeClient {
  private apiUrl = '/api/ai-chat';
  private model: string = 'claude-3-5-sonnet-20241022'; // Latest fast model with tools

  constructor(private organizationId?: string) {}

  /**
   * Send message with tool calling support
   */
  async sendMessage(
    messages: ChatMessage[],
    tools: ToolDefinition[] = [],
    options: {
      systemPrompt?: string;
      stream?: boolean;
      organizationId?: string;
      toolChoice?: { type: 'auto' } | { type: 'any' } | { type: 'tool', name: string } | { type: 'required' };
    } = {}
  ): Promise<{
    message: ChatMessage;
    toolCalls: any[];
  }> {
    const { systemPrompt, stream = false, organizationId = this.organizationId, toolChoice } = options;
    
    console.log('[ClaudeClient] 📤 Sending to API:', {
      messagesCount: messages.length,
      toolsCount: tools.length,
      hasSystemPrompt: !!systemPrompt,
      hasToolChoice: !!toolChoice,
      lastMessage: messages[messages.length - 1]?.content 
        ? (typeof messages[messages.length - 1]?.content === 'string' 
            ? (messages[messages.length - 1]?.content as string).substring(0, 100) + '...'
            : '[complex content]')
        : '[no content]'
    });

    try {
      const requestBody: any = {
        messages: this.convertToClaude(messages),
        tools: tools.length > 0 ? this.convertTools(tools) : undefined,
        organizationId,
        systemPrompt,
        stream: false
      };
      
      // Add tool_choice if specified
      if (toolChoice) {
        requestBody.tool_choice = toolChoice;
        console.log('[ClaudeClient] 🔧 Using tool_choice:', toolChoice);
      }

      // Don't use any summary formatting for messages - show complete raw content
      console.log('[ClaudeClient] 🔧 REQUEST BODY FULL:', {
        messages: requestBody.messages,
        tools: requestBody.tools?.map((t: { name: string }) => t.name),
        systemPrompt: systemPrompt,
        tool_choice: requestBody.tool_choice
      });
      
      // For a more readable summary, extract just roles and basic content info
      console.log('[ClaudeClient] 🔧 Request roles summary:', 
        requestBody.messages?.map((m: { role: string; content: any }, i: number) => `${i}: ${m.role}`)
      );
      
      console.log('[ClaudeClient] 📋 FULL PROMPT BEING SENT TO CLAUDE:', {
        messages: requestBody.messages,
        tools: requestBody.tools,
        systemPrompt: systemPrompt,
        tool_choice: requestBody.tool_choice
      });

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Check if it's a token limit error
        const isTokenLimitError = errorData.details?.includes('token') && errorData.details?.includes('too long');
        
        // Log the error with more context
        console.error('[ClaudeClient] ❌ API Error:', { 
          status: response.status, 
          error: errorData.details || 'API request failed'
        });
        
        // For token limit errors, log more details about the prompt
        if (isTokenLimitError) {
          console.error('[ClaudeClient] 📊 TOKEN LIMIT ERROR DETAILS:', {
            messageCount: requestBody.messages.length,
            systemPromptLength: systemPrompt?.length || 0,
            toolsCount: requestBody.tools?.length || 0,
            errorMessage: errorData.details
          });
          
          // Log message sizes to help identify the issue
          console.error('[ClaudeClient] 📏 MESSAGE SIZES:', requestBody.messages.map((m: any, i: number) => ({
            index: i,
            role: m.role,
            contentType: typeof m.content,
            contentLength: typeof m.content === 'string' 
              ? m.content.length 
              : Array.isArray(m.content) 
                ? JSON.stringify(m.content).length 
                : 'unknown'
          })));
        }
        
        throw new Error(errorData.details || 'API request failed');
      }

      const data = await response.json();
      console.log('[ClaudeClient] 📥 API Response:', {
        type: data.type,
        role: data.role,
        contentLength: data.content?.length || 0,
        usage: data.usage
      });

      if (!data.content || !Array.isArray(data.content)) {
        console.error('[ClaudeClient] ❌ Invalid response format:', data);
        throw new Error('Invalid response format from Claude API');
      }

      // Extract tool calls from content blocks
      const toolCalls: any[] = [];
      data.content.forEach((block: any) => {
        if (block.type === 'tool_use') {
          console.log('[ClaudeClient] 🔧 Found tool call:', { 
            id: block.id, 
            name: block.name, 
            input: block.input 
          });
          
          toolCalls.push({
            id: block.id,
            name: block.name,
            input: block.input
          });
        }
      });

      console.log('[ClaudeClient] 📊 Extracted tool calls:', toolCalls.length);

      const message: ChatMessage = {
        id: data.id,
        role: 'assistant',
        content: data.content,
        timestamp: Date.now(),
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined
      };

      return { message, toolCalls };
    } catch (error) {
      console.error('[ClaudeClient] ❌ Error in sendMessage:', error);
      throw error;
    }
  }

  /**
   * Send message with streaming
   */
  async *streamMessage(
    messages: ChatMessage[],
    tools: ToolDefinition[],
    systemPrompt?: string
  ): AsyncGenerator<{
    type: 'content' | 'tool_call';
    data: any;
  }> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: this.convertToClaude(messages),
          tools: this.convertTools(tools),
          organizationId: this.organizationId,
          systemPrompt,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'API request failed');
      }

      if (!response.body) {
        throw new Error('Response body is empty');
      }

      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = JSON.parse(new TextDecoder().decode(value));
        if (chunk.type === 'content') {
          yield {
            type: 'content',
            data: chunk.data
          };
        } else if (chunk.type === 'tool_call') {
          yield {
            type: 'tool_call',
            data: chunk.data
          };
        }
      }
    } catch (error) {
      console.error('[ClaudeClient] Error streaming message:', error);
      throw error;
    }
  }

  /**
   * Continue conversation after tool results
   */
  async continueWithToolResults(
    messages: ChatMessage[],
    toolResults: any[], // We ignore this parameter now since results are in messages
    tools: ToolDefinition[],
    systemPrompt?: string
  ): Promise<{ message: ChatMessage; toolCalls: ToolCall[] }> {
    console.log('[ClaudeClient] 🔧 Continuing conversation with tool results in message history');
    
    // The messages parameter already contains the proper sequence of:
    // 1. Assistant message with tool_use
    // 2. User message with tool_result
    // This is required by Claude API's pattern matching
    console.log('[ClaudeClient] 🚀 Sending conversation with', messages.length, 'messages');
    
    // Log the full raw messages to show complete tool call and result content
    // Don't use any formatting that might hide content
    console.log('[ClaudeClient] 🔍 FULL TOOL CONVERSATION:', {
      messageCount: messages.length,
      completeMessages: messages.map((msg, i) => ({
        index: i,
        role: msg.role,
        fullContent: msg.content // Show the complete content without any summarization
      }))
    });
    
    // Check for potentially large messages that might cause token limits
    const largeMessages = messages.filter(msg => {
      if (typeof msg.content === 'string' && msg.content.length > 10000) {
        return true;
      }
      if (Array.isArray(msg.content) && JSON.stringify(msg.content).length > 10000) {
        return true;
      }
      return false;
    });
    
    if (largeMessages.length > 0) {
      console.warn('[ClaudeClient] ⚠️ POTENTIAL TOKEN LIMIT ISSUE:', {
        totalMessages: messages.length,
        largeMessagesCount: largeMessages.length,
        largeMessageIndices: largeMessages.map((_, i) => i)
      });
    }
    
    try {
      // Important: Do not optimize or filter messages here - Claude needs the exact sequence
      const { message, toolCalls } = await this.sendMessage(messages, tools, { systemPrompt });
      return { message, toolCalls };
    } catch (error) {
      // If we get a token limit error, provide additional diagnostic information
      if (error instanceof Error && error.message.includes('token') && error.message.includes('too long')) {
        console.error('[ClaudeClient] 📊 TOKEN LIMIT IN CONTINUATION:', {
          messageCount: messages.length,
          largeMessagesCount: largeMessages.length,
          errorDetails: error.message,
          // Calculate total message content size
          totalContentSize: messages.reduce((acc, msg) => {
            const contentSize = typeof msg.content === 'string' 
              ? msg.content.length 
              : JSON.stringify(msg.content).length;
            return acc + contentSize;
          }, 0)
        });
      }
      throw error;
    }
  }

  /**
   * Convert chat messages to Claude format
   */
  private convertToClaude(messages: ChatMessage[]): any[] {
    return messages
      .filter(msg => msg.role !== 'system')
      .map(msg => {
        // If content looks like a stringified array (tool results), parse it
        if (typeof msg.content === 'string' && msg.content.startsWith('[') && msg.content.endsWith(']')) {
          try {
            const parsed = JSON.parse(msg.content);
            if (Array.isArray(parsed)) {
              return {
                role: msg.role as 'user' | 'assistant',
                content: parsed
              };
            }
          } catch (e) {
            // If parsing fails, keep as string
          }
        }
        
        // Regular text content
        return {
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        };
      });
  }

  /**
   * Converts tools to Claude's expected format
   * Expected format for Claude:
   * {
   *   name: string,
   *   description: string,
   *   input_schema: object (JSON Schema)
   * }
   */
  private convertTools(tools: ToolDefinition[]): any[] {
    return tools.map(tool => ({
      name: tool.name,
      description: tool.description || `Execute the ${tool.name} tool`,
      input_schema: tool.inputSchema || {
        type: 'object',
        properties: {},
        required: []
      }
    }));
  }

  /**
   * Convert Claude response to ChatResponse
   */
  private convertFromClaude(data: any): ChatResponse {
    return {
      id: data.id,
      content: data.content?.[0]?.text || '',
      toolCalls: data.content?.filter((c: any) => c.type === 'tool_use').map((c: any) => ({
        id: c.id,
        name: c.name,
        input: c.input,
        provider: this.extractProviderFromToolName(c.name)
      })) || [],
    };
  }

  /**
   * Extract provider from tool name (format: provider.toolName)
   * If no provider is specified in the name, default to 'retouchr'
   */
  private extractProviderFromToolName(toolName: string): string {
    return toolName.includes('.') ? toolName.split('.')[0] : 'retouchr';
  }

  /**
   * Get available models
   */
  getAvailableModels(): string[] {
    return [
      'claude-3-5-sonnet-20241022', // Fast, tool calling
      'claude-3-haiku-20240307',    // Cost-effective
      'claude-3-opus-20240229'      // Most capable
    ];
  }

  /**
   * Switch model
   */
  setModel(model: string): void {
    if (this.getAvailableModels().includes(model)) {
      this.model = model;
    } else {
      throw new Error(`Invalid model: ${model}`);
    }
  }
}
