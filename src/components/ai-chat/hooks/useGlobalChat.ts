'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { ChatSystem } from '@/lib/ai-chat/core/chat-system';
import { ContextDetector } from '@/lib/ai-chat/core/context-detector';
import { ClaudeClient } from '@/lib/ai-chat/client/claude-client';
import { ToolEvent } from '@/lib/ai-chat/core/tool-executor';
import { ProviderRegistry } from '@/lib/ai-chat/providers/registry';

interface ChatContext {
  provider?: string;
  designId?: string;
  route?: string;
  promptId?: string;
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
  messageId?: string; // Add messageId to associate tool with message
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
  const [promptOptions, setPromptOptions] = useState<Array<{ id: string; name: string; description: string }>>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>('default');
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
              executionId: event.toolCallId,
              messageId: activeMessage !== null ? activeMessage : undefined // Associate with current active message
            });
            console.log(`[useGlobalChat] 📝 Updated tool status for ${event.toolCallId}: running (message: ${activeMessage})`);
            return newMap;
          });
        } 
        else if (event.type === 'tool_completed') {
          console.log(`[useGlobalChat] ✅ Tool completed: ${event.toolName} (${event.toolCallId})`);
          // Update status for this tool to 'success' with result
          setToolExecutionStatuses(prev => {
            const newMap = new Map(prev);
            // Preserve the messageId from the previous status if it exists
            const prevStatus = prev.get(event.toolCallId);
            newMap.set(event.toolCallId, {
              toolName: event.toolName,
              status: 'success',
              result: event.result,
              executionId: event.toolCallId,
              messageId: prevStatus?.messageId || (activeMessage !== null ? activeMessage : undefined) // Keep messageId association
            });
            return newMap;
          });
        }
        else if (event.type === 'tool_failed') {
          console.log(`[useGlobalChat] ❌ Tool failed: ${event.toolName} (${event.toolCallId})`);
          // Update status for this tool to 'error'
          setToolExecutionStatuses(prev => {
            const newMap = new Map(prev);
            // Preserve the messageId from the previous status if it exists
            const prevStatus = prev.get(event.toolCallId);
            newMap.set(event.toolCallId, {
              toolName: event.toolName,
              status: 'error',
              result: { error: event.error },
              executionId: event.toolCallId,
              messageId: prevStatus?.messageId || (activeMessage !== null ? activeMessage : undefined) // Keep messageId association
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

  // Initialize context detector for the current route
  useEffect(() => {
    const updateContext = async () => {
      try {
        console.log('[useGlobalChat] 📍 Route changed, detecting new context for:', pathname);
        
        const detector = ContextDetector.getInstance();
        const detectionResult = await detector.detectContext(pathname);
        
        console.log('[useGlobalChat] 🧩 New context detected:', detectionResult);
        
        // Transform detection result to chat context
        const chatContext: ChatContext = {
          provider: detectionResult.provider || undefined,
          route: pathname,
          promptId: selectedPromptId, // Add selected prompt ID
          ...(detectionResult.context || {})
        };
        
        // If context has a provider, get available tools and prompt options
        if (chatContext.provider) {
          const registry = ProviderRegistry.getInstance();
          const provider = registry.getProvider(chatContext.provider);
          
          // Get tools for this provider
          const providerTools = provider.tools || [];
          setAvailableTools(providerTools);
          console.log(`[useGlobalChat] 🧰 Loaded ${providerTools.length} tools for provider:`, chatContext.provider);
          
          // Get prompt options if provider supports them
          if (provider.getPromptOptions) {
            const options = provider.getPromptOptions();
            setPromptOptions(options);
            console.log(`[useGlobalChat] 📝 Loaded ${options.length} prompt options for provider:`, chatContext.provider);
          } else {
            setPromptOptions([]);
          }
        } else {
          setAvailableTools([]);
          setPromptOptions([]);
        }
        
        setCurrentContext(chatContext);
      } catch (error) {
        console.error('[useGlobalChat] Error detecting context:', error);
      }
    };
    
    updateContext();
  }, [pathname, selectedPromptId]);

  // Function to reset session when needed (e.g., for debugging or fresh start)
  const resetSession = useCallback(() => {
    setCurrentSession(null);
    setToolExecutionStatuses(new Map());
    setStreamingResponse('');
    setActiveMessage(null);
    console.log('[useGlobalChat] 🔄 Session reset');
  }, []);

  // Update the selected prompt
  const selectPrompt = useCallback((promptId: string) => {
    console.log('[useGlobalChat] 📝 Selecting prompt:', promptId);
    setSelectedPromptId(promptId);
    
    // Update the current context with the new promptId
    if (currentContext) {
      setCurrentContext({
        ...currentContext,
        promptId
      });
    }
  }, [currentContext]);

  const sendMessage = useCallback(async (
    message: string,
    context: ChatContext,
    tools: ToolDefinition[],
    messageId: string,
    forceNewSession: boolean = false,
    useSequential: boolean = true,
    imageData?: { file: File; base64: string }
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
      // Set active message ID for tool execution status tracking
      setActiveMessage(messageId);
      
      // Don't clear previous tool statuses for new message
      // We'll use messageId to filter instead of clearing all
      // setToolExecutionStatuses(new Map());
      
      let session = currentSession;
      
      // Create new session if needed
      if (!session || forceNewSession) {
        session = await chatSystem.createSession({
          user: { id: 'current-user' }, // This would come from actual auth
          organization: { id: 'current-org' }, // This would come from actual auth context
          canvas: (window as any).fabricCanvas, // Access global canvas if available
          selectedObjects: (window as any).selectedObjects || [],
          route: pathname,
          promptId: selectedPromptId // Add promptId to session creation
        });
        setCurrentSession(session);
        console.log('[useGlobalChat] ✅ Session created:', session.id);
      } else {
        // Update existing session with current promptId
        chatSystem.updateSessionContext(session.id, { promptId: selectedPromptId });
        console.log('[useGlobalChat] 🔄 Reusing existing session:', session.id, 'with promptId:', selectedPromptId);
      }

      // Use sequential execution by default for multi-tool tasks
      const strategy = useSequential ? 'sequential' : 'parallel';
      
      // Send message through ChatSystem - this will now return initial response immediately
      console.log(`[useGlobalChat] 🚀 Calling chatSystem.sendMessage with ${strategy} execution:`, {
        sessionId: session.id,
        message,
        strategy
      });

      const result = await chatSystem.sendMessage(session.id, message, strategy, imageData);
      
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
        toolCallsWithStatus: Array.from(toolExecutionStatuses.values())
          .filter(status => {
            // Debug log to see what message IDs we have vs what we're expecting
            console.log(`[useGlobalChat] DEBUG: Tool status messageId=${status.messageId}, current messageId=${messageId}`);
            // More permissive filter: include status if it has no messageId OR matches current messageId
            // This is temporary for debugging - we should revert to the strict equality check
            return status.messageId === messageId || !status.messageId;
          })
          .map(status => ({
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
    streamingResponse,
    toolExecutionStatuses,
    activeMessage,
    promptOptions,
    selectedPromptId,
    sendMessage,
    resetSession,
    selectPrompt
  };
}
