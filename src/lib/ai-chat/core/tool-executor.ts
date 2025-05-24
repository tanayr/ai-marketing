/**
 * Universal Tool Executor with Multi-Tool Support
 * Handles parallel and sequential tool execution with rollback
 */

import { ToolCall, ToolResult, MultiToolExecution } from '../types/global';
import { ProviderRegistry } from '../providers/registry';
import { nanoid } from 'nanoid';
import { EventEmitter } from 'events';

// Define tool event types
export type ToolEvent = 
  | { type: 'tool_started'; toolCallId: string; toolName: string }
  | { type: 'tool_completed'; toolCallId: string; toolName: string; result: any }
  | { type: 'tool_failed'; toolCallId: string; toolName: string; error: string }
  | { type: 'tools_called'; toolCalls: ToolCall[]; sessionId: string }
  | { type: 'tools_completed'; results: ToolResult[]; sessionId: string };

export class ToolExecutor {
  private static instance: ToolExecutor;
  private registry: ProviderRegistry;
  private activeExecutions: Map<string, MultiToolExecution> = new Map();
  private eventEmitter = new EventEmitter();
  
  // Subscribe to tool execution events
  subscribeToEvents(callback: (event: ToolEvent) => void): () => void {
    this.eventEmitter.on('tool_event', callback);
    return () => this.eventEmitter.off('tool_event', callback);
  }

  // Emit events when a tool is called, completed, or failed
  private emitEvents(event: 'started' | 'completed' | 'failed', data: any) {
    this.eventEmitter.emit(`tool_${event}`, data);
  }
  
  // Emit a tool event
  private emitToolEvent(event: ToolEvent) {
    console.log(`[ToolExecutor] Emitting event: ${event.type}`, event);
    this.eventEmitter.emit('tool_event', event);
  }

  constructor() {
    this.registry = ProviderRegistry.getInstance();
  }

  static getInstance(): ToolExecutor {
    if (!ToolExecutor.instance) {
      ToolExecutor.instance = new ToolExecutor();
    }
    return ToolExecutor.instance;
  }

  /**
   * Execute multiple tools with progress tracking
   */
  async executeTools(
    toolCalls: ToolCall[],
    context: any,
    strategy: 'parallel' | 'sequential' = 'parallel',
    sessionId: string = 'unknown-session'
  ): Promise<{
    executionId: string;
    results: ToolResult[];
    execution: MultiToolExecution;
  }> {
    const executionId = nanoid();
    const execution: MultiToolExecution = {
      id: executionId,
      totalTools: toolCalls.length,
      completedTools: 0,
      startTime: Date.now(),
      tools: toolCalls.map(call => ({
        id: call.id,
        name: call.name,
        status: 'pending'
      }))
    };

    this.activeExecutions.set(executionId, execution);

    // Emit tools_called event
    this.eventEmitter.emit('tool_event', {
      type: 'tools_called',
      toolCalls,
      sessionId
    });

    try {
      let results: ToolResult[];
      
      if (strategy === 'parallel') {
        results = await this.executeParallel(toolCalls, context, execution);
      } else {
        results = await this.executeSequential(toolCalls, context, execution);
      }

      execution.completedTools = results.filter(r => r.success).length;
      
      // Emit tools_completed event
      this.eventEmitter.emit('tool_event', {
        type: 'tools_completed',
        results,
        sessionId
      });
      
      return {
        executionId,
        results,
        execution
      };
    } catch (error) {
      console.error('[ToolExecutor] Execution failed:', error);
      throw error;
    } finally {
      // Clean up after a delay
      setTimeout(() => {
        this.activeExecutions.delete(executionId);
      }, 60000); // Keep for 1 minute for debugging
    }
  }

  /**
   * Execute tools in parallel
   */
  private async executeParallel(
    toolCalls: ToolCall[],
    context: any,
    execution: MultiToolExecution
  ): Promise<ToolResult[]> {
    const promises = toolCalls.map(async (call) => {
      const toolInfo = execution.tools.find(t => t.id === call.id);
      if (toolInfo) {
        toolInfo.status = 'running';
        toolInfo.startTime = Date.now();
      }

      try {
        const result = await this.executeSingleTool(call, context, execution.id);
        
        if (toolInfo) {
          toolInfo.status = result.success ? 'completed' : 'failed';
          toolInfo.endTime = Date.now();
          toolInfo.result = result;
        }

        return result;
      } catch (error) {
        const result: ToolResult = {
          toolCallId: call.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          executionTime: 0
        };

        if (toolInfo) {
          toolInfo.status = 'failed';
          toolInfo.endTime = Date.now();
          toolInfo.result = result;
        }

        return result;
      }
    });

    return Promise.all(promises);
  }

  /**
   * Execute tools sequentially
   */
  private async executeSequential(
    toolCalls: ToolCall[],
    context: any,
    execution: MultiToolExecution
  ): Promise<ToolResult[]> {
    const results: ToolResult[] = [];

    for (const call of toolCalls) {
      const toolInfo = execution.tools.find(t => t.id === call.id);
      if (toolInfo) {
        toolInfo.status = 'running';
        toolInfo.startTime = Date.now();
      }

      try {
        const result = await this.executeSingleTool(call, context, execution.id);
        results.push(result);
        
        if (toolInfo) {
          toolInfo.status = result.success ? 'completed' : 'failed';
          toolInfo.endTime = Date.now();
          toolInfo.result = result;
        }

        // Stop on first failure for sequential execution
        if (!result.success) {
          // Mark remaining tools as failed
          const remainingTools = execution.tools.slice(results.length);
          for (const remaining of remainingTools) {
            remaining.status = 'failed';
            results.push({
              toolCallId: remaining.id,
              success: false,
              error: 'Previous tool failed',
              executionTime: 0
            });
          }
          break;
        }

        execution.completedTools++;
      } catch (error) {
        const result: ToolResult = {
          toolCallId: call.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          executionTime: 0
        };
        
        results.push(result);
        
        if (toolInfo) {
          toolInfo.status = 'failed';
          toolInfo.endTime = Date.now();
          toolInfo.result = result;
        }
        
        break; // Stop on error
      }
    }

    return results;
  }

  /**
   * Execute a single tool
   */
  private async executeSingleTool(
    call: ToolCall,
    context: any,
    executionId: string
  ): Promise<ToolResult> {
    console.log(`[ToolExecutor] 🧰 Executing tool: ${call.name} (id: ${call.id})`);
    
    const startTime = Date.now();
    
    try {
      // Find the handler for this tool
      const handler = this.registry.executeTool.bind(this.registry);
      
      if (!handler) {
        throw new Error(`No handler found for tool ${call.name}`);
      }
      
      // Register in active executions
      const toolInfo = this.activeExecutions.get(executionId)?.tools.find(t => t.id === call.id);
      if (toolInfo) {
        toolInfo.status = 'running';
        toolInfo.startTime = startTime;
      }
      
      // Emit tool started event with explicit logging
      const startEvent = {
        type: 'tool_started' as const,
        toolCallId: call.id,
        toolName: call.name,
        executionId
      };
      console.log('[ToolExecutor] Emitting tool_started event:', startEvent);
      this.eventEmitter.emit('tool_event', startEvent);
      
      // Execute the tool with parsed arguments
      const result = await handler(call.name, call.input || {}, context);
      
      const executionTime = Date.now() - startTime;

      const toolResult = {
        toolCallId: call.id,
        success: result.success,
        data: result.data,
        error: result.error,
        executionTime
      };

      // Emit tool completed event
      this.emitToolEvent({
        type: 'tool_completed',
        toolCallId: call.id,
        toolName: call.name,
        result: toolResult
      });

      return toolResult;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`[ToolExecutor] Tool execution failed:`, error);

      const errorResult = {
        toolCallId: call.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: 0
      };

      // Find and update tool info in active executions
      const execution = this.activeExecutions.get(executionId);
      const toolInfo = execution?.tools.find(t => t.id === call.id);
      if (toolInfo) {
        toolInfo.status = 'failed';
        toolInfo.endTime = Date.now();
        toolInfo.result = errorResult;
      }
      
      // Emit tool failed event
      this.emitToolEvent({
        type: 'tool_failed',
        toolCallId: call.id,
        toolName: call.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return errorResult;
    }
  }

  /**
   * Get execution progress
   */
  getExecutionProgress(executionId: string): MultiToolExecution | null {
    return this.activeExecutions.get(executionId) || null;
  }

  /**
   * Get all active executions
   */
  getActiveExecutions(): MultiToolExecution[] {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Cancel execution (if possible)
   */
  cancelExecution(executionId: string): boolean {
    const execution = this.activeExecutions.get(executionId);
    if (execution) {
      // Mark pending tools as failed
      execution.tools
        .filter(tool => tool.status === 'pending')
        .forEach(tool => {
          tool.status = 'failed';
          tool.endTime = Date.now();
        });
      
      return true;
    }
    return false;
  }
}
