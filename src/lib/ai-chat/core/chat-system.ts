/**
 * Main Chat System - Orchestrates AI conversations with tool calling
 */

import { ClaudeClient } from '../client/claude-client';
import { ToolExecutor } from './tool-executor';
import { ContextDetector } from './context-detector';
import { ProviderRegistry } from '../providers/registry';
import { 
  ChatMessage, 
  ToolCall, 
  ToolResult, 
  ChatSession,
  MultiToolExecution,
  GlobalChatContext
} from '../types/global';
import { ToolDefinition } from '../types/providers';
import { nanoid } from 'nanoid';
import { EventEmitter } from 'events';
import { ToolEvent } from './tool-executor';

export class ChatSystem {
  private static instance: ChatSystem;
  private claude: ClaudeClient;
  private executor: ToolExecutor;
  private detector: ContextDetector;
  private registry: ProviderRegistry;
  private activeSessions: Map<string, ChatSession> = new Map();
  public eventEmitter = new EventEmitter();
  private toolEventListeners: ((event: ToolEvent) => void)[] = [];

  constructor() {
    this.claude = new ClaudeClient();
    this.executor = ToolExecutor.getInstance();
    this.detector = ContextDetector.getInstance();
    this.registry = ProviderRegistry.getInstance();
    
    // Subscribe to tool execution events and relay them
    this.executor.subscribeToEvents((event) => {
      this.eventEmitter.emit('tool_event', event);
    });
    
    // Subscribe to tool executor events and relay them to our listeners
    this.executor.subscribeToEvents((event) => {
      // Relay event to all listeners
      this.toolEventListeners.forEach(listener => listener(event));
    });
  }
  
  /**
   * Subscribe to tool execution events
   */
  onToolEvent(callback: (event: ToolEvent) => void): () => void {
    this.toolEventListeners.push(callback);
    return () => {
      const index = this.toolEventListeners.indexOf(callback);
      if (index !== -1) {
        this.toolEventListeners.splice(index, 1);
      }
    };
  }
  
  /**
   * Create a new chat session
   */
  subscribeToToolEvents(callback: (event: ToolEvent) => void): () => void {
    this.toolEventListeners.push(callback);
    return () => {
      this.toolEventListeners = this.toolEventListeners.filter(l => l !== callback);
    };
  }

  static getInstance(): ChatSystem {
    if (!ChatSystem.instance) {
      ChatSystem.instance = new ChatSystem();
    }
    return ChatSystem.instance;
  }

  /**
   * Create new chat session
   */
  async createSession(context: {
    route: string;
    user: any;
    organization: any;
    canvas?: any;
    selectedObjects?: any[];
  }): Promise<ChatSession> {
    const contextResult = this.detector.detectContext(context.route);
    const providerId = contextResult?.provider || 'retouchr';
    
    const provider = this.registry.getProvider(providerId);
    
    const globalContext: GlobalChatContext = {
      currentRoute: context.route,
      activeProvider: providerId,
      availableProviders: [providerId],
      userId: context.user?.id || 'unknown',
      organizationId: context.organization?.id || 'unknown',
      canvas: context.canvas,
      selectedObjects: context.selectedObjects,
      user: context.user,
      organization: context.organization,
    };

    const session: ChatSession = {
      id: nanoid(),
      provider: providerId,
      context: globalContext,
      messages: [],
      createdAt: Date.now(),
      lastActivity: Date.now(),
      isOpen: false,
      isProcessing: false,
    };

    // Add system prompt if provider supports it
    if (provider?.getSystemPrompt) {
      const systemPrompt = provider.getSystemPrompt(globalContext);
      if (systemPrompt) {
        session.messages.push({
          id: nanoid(),
          role: 'system',
          content: systemPrompt,
          timestamp: Date.now(),
        });
      }
    }

    this.activeSessions.set(session.id, session);
    console.log(`[ChatSystem] Created session ${session.id} for provider ${providerId}`);
    
    return session;
  }

  /**
   * Get available tools for a provider
   */
  getAvailableTools(providerId: string): ToolDefinition[] {
    try {
      const provider = this.registry.getProvider(providerId);
      return provider.tools;
    } catch (error) {
      console.error(`Error getting tools for provider ${providerId}:`, error);
      return [];
    }
  }

  /**
   * Send message and get response
   */
  async sendMessage(
    sessionId: string,
    message: string,
    strategy: 'parallel' | 'sequential' = 'parallel'
  ): Promise<{
    initialResponse?: ChatMessage;   // NEW: Initial AI message (only for sequential)
    response: ChatMessage;          // Final or only response
    toolExecution?: {
      executionId: string;
      results: ToolResult[];
      execution: MultiToolExecution;
    };
  }> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Add user message to history
    const userMessage: ChatMessage = {
      id: nanoid(),
      role: 'user',
      content: message,
      timestamp: Date.now()
    };
    session.messages.push(userMessage);

    try {
      // Get available tools for current provider
      const tools = this.getAvailableTools(session.provider);
      
      // Get system prompt from provider
      const provider = this.registry.getProvider(session.provider);
      const systemPrompt = provider.getSystemPrompt?.(session.context);

      // Use sequential or parallel execution based on strategy
      if (strategy === 'sequential') {
        return await this.handleSequentialExecution(session, tools, systemPrompt);
      } else {
        // Send to Claude (parallel execution)
        const { message: aiMessage, toolCalls } = await this.claude.sendMessage(
          session.messages,
          tools,
          { systemPrompt }
        );

        session.messages.push(aiMessage);
        session.lastActivity = Date.now();

        let toolExecution;

        // Execute tools if any were called
        if (toolCalls.length > 0) {
          console.log(`[ChatSystem] Executing ${toolCalls.length} tools in parallel`);
          
          toolExecution = await this.executor.executeTools(
            toolCalls,
            session.context,
            'parallel',
            session.id
          );

          // Add tool result messages to session history before getting next response
          for (const result of toolExecution.results) {
            const toolResultMessage: ChatMessage = {
              id: `tool_result_${result.toolCallId}`,
              role: 'user',
              content: JSON.stringify([
                {
                  type: 'tool_result',
                  tool_use_id: result.toolCallId,
                  content: result.success ? JSON.stringify(result.data) : JSON.stringify({ error: result.error })
                }
              ]),
              timestamp: Date.now()
            };
            session.messages.push(toolResultMessage);
          }
          
          // Get next AI message with tool results
          const { message: followUpMessage } = await this.claude.continueWithToolResults(
            session.messages,
            toolExecution.results,
            tools,
            systemPrompt
          );

          session.messages.push(followUpMessage);
          
          return {
            response: followUpMessage,
            toolExecution: {
              executionId: toolExecution.executionId,
              results: toolExecution.results,
              execution: toolExecution.execution
            }
          };
        }
      }

      // If no tools were called, just return the AI message
      const { message: aiMessage } = await this.claude.sendMessage(
        session.messages,
        tools,
        { systemPrompt }
      );
      
      session.messages.push(aiMessage);
      session.lastActivity = Date.now();
      
      return { response: aiMessage };
    } catch (error) {
      console.error('[ChatSystem] Error processing message:', error);
      
      const errorMessage: ChatMessage = {
        id: nanoid(),
        role: 'assistant',
        content: `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now()
      };
      
      session.messages.push(errorMessage);
      
      return { response: errorMessage };
    }
  }
  
  /**
   * Handle sequential tool execution with multiple rounds
   */
  private async handleSequentialExecution(
    session: ChatSession,
    tools: ToolDefinition[],
    systemPrompt?: string
  ): Promise<{
    initialResponse?: ChatMessage;
    response: ChatMessage;
    toolExecution?: {
      executionId: string;
      results: ToolResult[];
      execution: MultiToolExecution;
    };
  }> {
    console.log(`[ChatSystem] Starting sequential tool execution`);
    
    // Get initial AI response
    const { message: aiMessage, toolCalls: initialToolCalls } = await this.claude.sendMessage(
      session.messages,
      tools,
      { systemPrompt }
    );
    
    // Add the initial AI message to history
    session.messages.push(aiMessage);
    session.lastActivity = Date.now();
    
    // If no tools were called, return the AI message
    if (!initialToolCalls || initialToolCalls.length === 0) {
      return { 
        initialResponse: aiMessage, 
        response: aiMessage 
      };
    }
    
    // Return initial response immediately and continue processing in background
    const initialResponse = { ...aiMessage };
    
    // Start background processing without blocking
    const backgroundProcessing = this.continueSequentialExecution(
      session, 
      aiMessage, 
      initialToolCalls, 
      tools, 
      systemPrompt
    ).then(finalResult => {
      // Emit final response event
      this.eventEmitter.emit('final_response', {
        sessionId: session.id,
        finalResponse: finalResult.finalResponse,
        toolExecution: finalResult.toolExecution
      });
    }).catch(error => {
      console.error('[ChatSystem] Background processing error:', error);
      this.eventEmitter.emit('final_response_error', {
        sessionId: session.id,
        error: error.message
      });
    });
    
    // Return initial response immediately
    return {
      initialResponse,
      response: aiMessage, // This will be the initial response for now
      toolExecution: undefined // Will be populated by background processing
    };
  }
  
  private async continueSequentialExecution(
    session: ChatSession,
    currentMessage: ChatMessage,
    currentToolCalls: ToolCall[],
    tools: ToolDefinition[],
    systemPrompt?: string
  ): Promise<{
    finalResponse: ChatMessage;
    toolExecution: {
      executionId: string;
      results: ToolResult[];
      execution: MultiToolExecution;
    };
  }> {
    let allResults: ToolResult[] = [];
    let allToolCalls: ToolCall[] = [];
    let lastExecutionId: string | undefined;
    let lastExecution: MultiToolExecution | undefined;
    let retries = 0;
    const MAX_RETRIES = 8; // Increased from 5 to allow more tool iterations
    
    // Keep processing tools as long as Claude generates them
    while (currentToolCalls.length > 0 && retries < MAX_RETRIES) {
      console.log(`[ChatSystem] Sequential execution: Processing ${currentToolCalls.length} tools (round ${retries + 1}/${MAX_RETRIES})`);
      
      try {
        // Execute current batch of tools
        const toolExecution = await this.executor.executeTools(
          currentToolCalls,
          session.context,
          'sequential', // Execute one at a time within batch
          session.id
        );
        
        // Store execution info
        lastExecutionId = toolExecution.executionId;
        lastExecution = toolExecution.execution;
        
        // Add to cumulative results
        allResults = [...allResults, ...toolExecution.results];
        allToolCalls = [...allToolCalls, ...currentToolCalls];
        
        // Check if any tools failed and log details
        const failedTools = toolExecution.results.filter(r => !r.success);
        if (failedTools.length > 0) {
          console.warn(`[ChatSystem] ${failedTools.length} tools failed in this batch:`, failedTools.map(t => t.error));
        }
        
        // Add tool result messages to session history before getting next response
        for (const result of toolExecution.results) {
          const toolResultMessage: ChatMessage = {
            id: `tool_result_${result.toolCallId}`,
            role: 'user',
            content: JSON.stringify([
              {
                type: 'tool_result',
                tool_use_id: result.toolCallId,
                content: result.success ? JSON.stringify(result.data) : JSON.stringify({ error: result.error })
              }
            ]),
            timestamp: Date.now()
          };
          session.messages.push(toolResultMessage);
        }
        
        // Get next AI message with tool results
        const { message: followUpMessage, toolCalls: newToolCalls } = await this.claude.continueWithToolResults(
          session.messages,
          toolExecution.results,
          tools,
          systemPrompt
        );
        
        // Add follow-up to history
        session.messages.push(followUpMessage);
        session.lastActivity = Date.now();
        
        // Set up for next iteration if there are new tool calls
        currentMessage = followUpMessage;
        currentToolCalls = newToolCalls || [];
        
        // If no new tool calls, Claude has finished the task
        if (!newToolCalls || newToolCalls.length === 0) {
          console.log(`[ChatSystem] Sequential execution complete: Claude finished after ${retries + 1} rounds with ${allResults.length} total tools executed`);
          break;
        }
        
        retries++;
      } catch (error) {
        console.error(`[ChatSystem] Error in sequential execution round ${retries + 1}:`, error);
        
        // Create error message and add to conversation
        const errorMessage: ChatMessage = {
          id: nanoid(),
          role: 'assistant',
          content: `I encountered an error while executing tools: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: Date.now()
        };
        
        session.messages.push(errorMessage);
        session.lastActivity = Date.now();
        
        currentMessage = errorMessage;
        currentToolCalls = []; // Stop processing on error
        break;
      }
    }
    
    // Return final results
    const finalToolExecution = lastExecutionId && lastExecution ? {
      executionId: lastExecutionId,
      results: allResults,
      execution: lastExecution
    } : undefined;
    
    return {
      finalResponse: currentMessage,
      toolExecution: finalToolExecution!
    };
  }

  /**
   * Stream message response
   */
  async *streamMessage(
    sessionId: string,
    message: string,
    strategy: 'parallel' | 'sequential' = 'parallel'
  ): AsyncGenerator<{
    type: 'content' | 'tool_call' | 'tool_result' | 'error';
    data: any;
  }> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      yield { type: 'error', data: 'Session not found' };
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: nanoid(),
      role: 'user',
      content: message,
      timestamp: Date.now()
    };
    session.messages.push(userMessage);

    try {
      const tools = this.getAvailableTools(session.provider);
      const provider = this.registry.getProvider(session.provider);
      const systemPrompt = provider.getSystemPrompt?.(session.context);

      const toolCalls: ToolCall[] = [];
      let content = '';

      // Stream response from Claude
      for await (const chunk of this.claude.streamMessage(
        session.messages,
        tools,
        systemPrompt
      )) {
        if (chunk.type === 'content') {
          content += chunk.data;
          yield { type: 'content', data: chunk.data };
        } else if (chunk.type === 'tool_call') {
          toolCalls.push(chunk.data);
          yield { type: 'tool_call', data: chunk.data };
        }
      }

      // Add AI message to history
      const aiMessage: ChatMessage = {
        id: nanoid(),
        role: 'assistant',
        content,
        timestamp: Date.now(),
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined
      };
      session.messages.push(aiMessage);

      // Execute tools if any
      if (toolCalls.length > 0) {
        const toolExecution = await this.executor.executeTools(
          toolCalls,
          session.context,
          'parallel',
          session.id
        );

        yield { type: 'tool_result', data: toolExecution };

        // Add tool result messages to session history before getting next response
        for (const result of toolExecution.results) {
          const toolResultMessage: ChatMessage = {
            id: `tool_result_${result.toolCallId}`,
            role: 'user',
            content: JSON.stringify([
              {
                type: 'tool_result',
                tool_use_id: result.toolCallId,
                content: result.success ? JSON.stringify(result.data) : JSON.stringify({ error: result.error })
              }
            ]),
            timestamp: Date.now()
          };
          session.messages.push(toolResultMessage);
        }
        
        // Continue with tool results
        const { message: followUpMessage } = await this.claude.continueWithToolResults(
          session.messages,
          toolExecution.results,
          tools,
          systemPrompt
        );

        session.messages.push(followUpMessage);
        yield { type: 'content', data: followUpMessage.content };
      }

      session.lastActivity = Date.now();
    } catch (error) {
      console.error('[ChatSystem] Stream error:', error);
      yield { 
        type: 'error', 
        data: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get session history
   */
  getSession(sessionId: string): ChatSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Update session context (e.g., when canvas changes)
   */
  updateSessionContext(sessionId: string, contextUpdate: any): boolean {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.context = { ...session.context, ...contextUpdate };
      session.lastActivity = Date.now();
      return true;
    }
    return false;
  }

  /**
   * Close session
   */
  closeSession(sessionId: string): boolean {
    return this.activeSessions.delete(sessionId);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): ChatSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Clean up old sessions
   */
  cleanupSessions(maxAge: number = 30 * 60 * 1000): number { // 30 minutes default
    const now = Date.now();
    let cleaned = 0;
    
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now - session.lastActivity > maxAge) {
        this.activeSessions.delete(sessionId);
        cleaned++;
      }
    }
    
    return cleaned;
  }
}
