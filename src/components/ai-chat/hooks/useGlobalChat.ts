'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { ChatSystem } from '@/lib/ai-chat/core/chat-system';
import { ContextDetector } from '@/lib/ai-chat/core/context-detector';
import { ClaudeClient } from '@/lib/ai-chat/client/claude-client';
import { ToolEvent } from '@/lib/ai-chat/core/tool-executor';

interface ChatContext {
  provider?: string;
  designId?: string;
  route?: string;
  [key: string]: any;
}

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: any;
}

interface ChatResponse {
  content: string;
  initialResponse?: any;
  toolCalls?: Array<{
    name: string;
    status: 'running' | 'success' | 'error';
    result?: any;
    executionId?: string;
  }>;
}

interface ToolExecutionStatus {
  toolName: string;
  status: 'running' | 'success' | 'error';
  result?: any;
  executionId?: string;
}

export function useGlobalChat() {
  const pathname = usePathname();
  const [currentContext, setCurrentContext] = useState<ChatContext | null>(null);
  const [availableTools, setAvailableTools] = useState<ToolDefinition[]>([]);
  const [streamingResponse, setStreamingResponse] = useState<string>('');
  const [toolExecutionStatuses, setToolExecutionStatuses] = useState<Map<string, ToolExecutionStatus>>(new Map());
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [activeMessage, setActiveMessage] = useState<string | null>(null);
  const [chatSystem] = useState(() => new ChatSystem());
  const [claudeClient] = useState(() => new ClaudeClient());
  const toolEventHandlersRef = useRef<boolean>(false);

  // Set up tool execution event listeners
  useEffect(() => {
    console.log('[useGlobalChat] 🔄 useEffect running, toolEventHandlersRef.current:', toolEventHandlersRef.current);
    console.log('[useGlobalChat] 🔄 chatSystem instance:', !!chatSystem);
    
    // Reset the ref to ensure fresh subscription each time
    toolEventHandlersRef.current = false;
    
    if (!toolEventHandlersRef.current && chatSystem) {
      console.log('[useGlobalChat] 🎧 Setting up tool event subscription...');
      
      const unsubscribeFunctions: (() => void)[] = [];
      
      // Subscribe to tool execution events
      const unsubscribeToolEvents = chatSystem.onToolEvent((event: ToolEvent) => {
        console.log(`[useGlobalChat] 🔔 Tool event received: ${event.type}`, event);
        
        if (event.type === 'tool_started') {
          console.log(`[useGlobalChat] ▶️ Tool started: ${event.toolName} (${event.toolCallId})`);
          // Update status for this tool to 'running'
          setToolExecutionStatuses(prev => {
            const newMap = new Map(prev);
            newMap.set(event.toolCallId, {
              toolName: event.toolName,
              status: 'running',
              executionId: event.toolCallId
            });
            console.log(`[useGlobalChat] 📝 Updated tool status for ${event.toolCallId}: running`);
            return newMap;
          });
        } 
        else if (event.type === 'tool_completed') {
          console.log(`[useGlobalChat] ✅ Tool completed: ${event.toolName} (${event.toolCallId})`);
          // Update status for this tool to 'success' with result
          setToolExecutionStatuses(prev => {
            const newMap = new Map(prev);
            newMap.set(event.toolCallId, {
              toolName: event.toolName,
              status: 'success',
              result: event.result,
              executionId: event.toolCallId
            });
            return newMap;
          });
        }
        else if (event.type === 'tool_failed') {
          console.log(`[useGlobalChat] ❌ Tool failed: ${event.toolName} (${event.toolCallId})`);
          // Update status for this tool to 'error'
          setToolExecutionStatuses(prev => {
            const newMap = new Map(prev);
            newMap.set(event.toolCallId, {
              toolName: event.toolName,
              status: 'error',
              result: { error: event.error },
              executionId: event.toolCallId
            });
            return newMap;
          });
        }
      });
      unsubscribeFunctions.push(unsubscribeToolEvents);
      
      // Subscribe to final response events
      const finalResponseHandler = (event: any) => {
        console.log('[useGlobalChat] 🏁 Final response received:', event);
        
        // Extract final response text
        let finalResponseText = '';
        if (typeof event.finalResponse.content === 'string') {
          finalResponseText = event.finalResponse.content;
        } else if (Array.isArray(event.finalResponse.content)) {
          finalResponseText = (event.finalResponse.content as any[])
            .filter((block: any) => block.type === 'text')
            .map((block: any) => block.text)
            .join('\n');
        }
        
        // Emit custom event that the overlay can listen to
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ai-final-response', {
            detail: {
              sessionId: event.sessionId,
              finalResponseContent: finalResponseText,
              toolExecution: event.toolExecution
            }
          }));
        }
      };
      
      chatSystem.eventEmitter.on('final_response', finalResponseHandler);
      unsubscribeFunctions.push(() => {
        chatSystem.eventEmitter.removeListener('final_response', finalResponseHandler);
      });
      
      toolEventHandlersRef.current = true;
      console.log('[useGlobalChat] ✅ Tool event subscription completed');
      
      // Return combined unsubscribe function
      return () => {
        unsubscribeFunctions.forEach(fn => fn());
      };
    } else {
      console.log('[useGlobalChat] ⏭️ Skipping tool event subscription:', {
        alreadySetup: toolEventHandlersRef.current,
        hasChatSystem: !!chatSystem
      });
    }
    
    return undefined;
  }, [chatSystem]);

  // Detect current context based on route
  useEffect(() => {
    const detectContext = async () => {
      try {
        const contextDetector = ContextDetector.getInstance();
        const context = await contextDetector.detectContext(pathname);
        
        // Transform ContextDetectionResult to ChatContext
        const chatContext: ChatContext = {
          provider: context.provider || undefined,
          route: pathname,
          ...(context.context || {})
        };
        
        setCurrentContext(chatContext);
        
        // Reset session when context changes
        setCurrentSession(null);
        
        // Get available tools for current context
        if (context?.provider) {
          const tools = await chatSystem.getAvailableTools(context.provider);
          setAvailableTools(tools);
        } else {
          setAvailableTools([]);
        }
      } catch (error) {
        console.error('Error detecting context:', error);
        setCurrentContext(null);
        setAvailableTools([]);
      }
    };

    detectContext();
  }, [pathname, chatSystem]);

  // Function to reset session when needed (e.g., for debugging or fresh start)
  const resetSession = useCallback(() => {
    console.log('[useGlobalChat] 🔄 Manually resetting session');
    setCurrentSession(null);
    setToolExecutionStatuses(new Map());
    setActiveMessage(null);
  }, []);

  const sendMessage = useCallback(async (
    message: string,
    context: ChatContext,
    tools: ToolDefinition[],
    messageId: string,
    forceNewSession: boolean = false,
    useSequential: boolean = true
  ): Promise<{
    hasInitialResponse: boolean;
    initialResponseContent?: string;
    initialResponseToolCalls?: number;
    finalResponseContent?: string;
    finalToolCalls?: number;
    toolCallsWithStatus?: Array<{
      id: string;
      name: string;
      status: 'running' | 'success' | 'error';
    }>;
  }> => {
    try {
      // Clear previous tool statuses for new message
      setToolExecutionStatuses(new Map());
      
      let session = currentSession;
      
      // Create new session if needed
      if (!session || forceNewSession) {
        session = await chatSystem.createSession({
          user: { id: 'current-user' }, // This would come from actual auth
          organization: { id: 'current-org' }, // This would come from actual auth context
          canvas: (window as any).fabricCanvas, // Access global canvas if available
          selectedObjects: (window as any).selectedObjects || [],
          route: pathname
        });
        setCurrentSession(session);
        console.log('[useGlobalChat] ✅ Session created:', session.id);
      } else {
        console.log('[useGlobalChat] 🔄 Reusing existing session:', session.id);
      }

      // Use sequential execution by default for multi-tool tasks
      const strategy = useSequential ? 'sequential' : 'parallel';
      
      // Send message through ChatSystem - this will now return initial response immediately
      console.log(`[useGlobalChat] 🚀 Calling chatSystem.sendMessage with ${strategy} execution:`, {
        sessionId: session.id,
        message,
        strategy
      });

      const result = await chatSystem.sendMessage(session.id, message, strategy);
      
      console.log('[useGlobalChat] 📥 Received initial response:', {
        hasInitialResponse: !!result.initialResponse,
        initialResponseContent: result.initialResponse?.content ? 
          (typeof result.initialResponse.content === 'string' 
            ? result.initialResponse.content.substring(0, 100) + '...' 
            : 'Array content') : 'No initial content',
        initialResponseToolCalls: result.initialResponse?.toolCalls?.length || 0,
        responseContent: typeof result.response.content === 'string' 
          ? result.response.content.substring(0, 100) + '...'
          : 'Non-string content: ' + JSON.stringify(result.response.content).substring(0, 100) + '...',
        toolCalls: result.response.toolCalls?.length || 0,
        toolExecution: result.toolExecution ? 'present' : 'none',
        totalToolsExecuted: result.toolExecution?.results?.length || 0
      });

      // Extract initial response text
      let initialResponseText = '';
      if (result.initialResponse && typeof result.initialResponse.content === 'string') {
        initialResponseText = result.initialResponse.content;
      } else if (result.initialResponse && Array.isArray(result.initialResponse.content)) {
        // Claude API returns content as array of content blocks
        initialResponseText = (result.initialResponse.content as any[])
          .filter((block: any) => block.type === 'text')
          .map((block: any) => block.text)
          .join('\n');
      }

      // Extract final response text (which is currently the same as initial)
      let finalResponseText = '';
      if (typeof result.response.content === 'string') {
        finalResponseText = result.response.content;
      } else if (Array.isArray(result.response.content)) {
        // Claude API returns content as array of content blocks
        finalResponseText = (result.response.content as any[])
          .filter((block: any) => block.type === 'text')
          .map((block: any) => block.text)
          .join('\n');
      } else {
        finalResponseText = 'No response content available';
      }
      
      // Return information about both initial and final responses
      return {
        hasInitialResponse: !!result.initialResponse,
        initialResponseContent: initialResponseText,
        initialResponseToolCalls: result.initialResponse?.toolCalls?.length || 0,
        finalResponseContent: finalResponseText,
        finalToolCalls: result.response.toolCalls?.length || 0,
        toolCallsWithStatus: Array.from(toolExecutionStatuses.values()).map(status => ({
          id: status.executionId || 'unknown',
          name: status.toolName,
          status: status.status
        }))
      };
    } catch (error) {
      console.error('[useGlobalChat] ❌ Error sending message:', error);
      throw error;
    }
  }, [currentContext, pathname, chatSystem, availableTools, toolExecutionStatuses]);

  return {
    currentContext,
    availableTools,
    sendMessage,
    streamingResponse,
    toolExecutionStatuses,
    activeMessage,
    resetSession
  };
}
