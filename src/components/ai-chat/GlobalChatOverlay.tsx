'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Minimize, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useGlobalChat } from '../ai-chat/hooks/useGlobalChat';
import { ContextIndicator } from './components/ContextIndicator';
import { ToolProgress } from './components/ToolProgress';
import { TypingIndicator } from './components/TypingIndicator';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isActive?: boolean;
  toolCalls?: Array<{
    name: string;
    status: 'running' | 'success' | 'error';
    result?: any;
  }>;
}

interface GlobalChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalChatOverlay({ isOpen, onClose }: GlobalChatOverlayProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    currentContext, 
    availableTools,
    sendMessage, 
    streamingResponse, 
    toolExecutionStatuses,
    activeMessage,
    resetSession
  } = useGlobalChat();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingResponse]);

  // Global keyboard shortcut (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          // Will be handled by parent component
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Subscribe to final response events
  useEffect(() => {
    const handleFinalResponse = (event: CustomEvent) => {
      console.log('[GlobalChatOverlay] 🏁 Final response event received:', event.detail);
      
      const { sessionId, finalResponseContent, toolExecution } = event.detail;
      
      // Create final AI message
      const finalAiMessage: ChatMessage = {
        id: `assistant-final-${Date.now()}`,
        role: 'assistant',
        content: finalResponseContent || 'Operation completed.',
        timestamp: Date.now(),
        toolCalls: toolExecution?.toolCalls || [],
        isActive: false
      };
      
      // Add the final response without clearing any existing messages
      setMessages(prev => [...prev, finalAiMessage]);
    };
    
    window.addEventListener('ai-final-response', handleFinalResponse as EventListener);
    return () => window.removeEventListener('ai-final-response', handleFinalResponse as EventListener);
  }, []);

  const handleResetSession = () => {
    setMessages([]);
    setInput('');
    resetSession();
    console.log('[GlobalChatOverlay] Session and messages reset');
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    setIsLoading(true);
    
    // Generate IDs for this conversation sequence
    const conversationId = Date.now().toString();
    const userMessageId = `user-${conversationId}`;
    const assistantMessageId = `assistant-${conversationId}`;
    
    // Add user message
    const newUserMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    };
    
    // Add an initial empty assistant message that will show loading state
    const initialAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isActive: true
    };
    
    setMessages(prev => [...prev, newUserMessage, initialAssistantMessage]);
    setInput('');
    
    try {
      console.log('[GlobalChatOverlay] 🚀 Starting sendMessage...');
      const response = await sendMessage(
        input.trim(), 
        currentContext, 
        availableTools, 
        assistantMessageId, 
        false, 
        true
      );
      
      console.log('[GlobalChatOverlay] 📥 Got response:', {
        hasInitialResponse: response.hasInitialResponse,
        initialResponseToolCalls: response.initialResponseToolCalls,
        finalResponseContent: response.finalResponseContent?.substring(0, 100) + '...',
        finalToolCalls: response.finalToolCalls
      });

      // Phase 1: Add initial AI response if available (with tool calls)
      if (response.hasInitialResponse && response.initialResponseContent) {
        console.log('[GlobalChatOverlay] 📝 Adding initial AI response with tool calls as separate message');
        
        const initialAiMessage: ChatMessage = {
          id: `assistant-initial-${Date.now()}`,
          role: 'assistant',
          content: response.initialResponseContent,
          timestamp: Date.now(),
          toolCalls: response.toolCallsWithStatus || [],
          isActive: true // Mark as active to show tool progress
        };
        
        setMessages(prev => [...prev, initialAiMessage]);
      }

      // Phase 2: Add final AI response (summary) - only if tools aren't running
      if (response.finalResponseContent && !response.hasInitialResponse) {
        console.log('[GlobalChatOverlay] 📝 Adding final AI response as separate message');
        
        const finalAiMessage: ChatMessage = {
          id: `assistant-final-${Date.now()}`,
          role: 'assistant',
          content: response.finalResponseContent,
          timestamp: Date.now(),
          toolCalls: [],
          isActive: false
        };
        
        setMessages(prev => [...prev, finalAiMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update message to show error but keep isActive true
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessageId 
            ? { 
                ...msg, 
                content: 'Sorry, there was an error processing your request.', 
                isActive: true // Keep active to maintain tool visibility
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-6 z-50">
      <div className="bottom-20 w-96 max-h-[calc(100vh-160px)] fixed right-6">
        <Card className="flex flex-col shadow-2xl border border-gray-200">
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span className="font-semibold">AI Assistant</span>
              <ContextIndicator context={currentContext} />
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetSession}
                title="Reset conversation and start fresh"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <Minimize className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          
            <>
              {/* Messages */}
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[300px]">
                  <div className="p-4 space-y-4">
                    {messages.length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium mb-2">Ask me anything!</p>
                        <p className="text-sm">
                          {currentContext?.provider === 'retouchr' 
                            ? "I can help you edit text, move objects, change backgrounds, and more."
                            : "I can help you with various tasks based on your current context."
                          }
                        </p>
                        {availableTools.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs text-gray-400 mb-2">Available tools:</p>
                            <div className="flex flex-wrap gap-1 justify-center">
                              {availableTools.slice(0, 6).map((tool) => (
                                <Badge key={tool.name} variant="secondary" className="text-xs">
                                  {tool.name.split('.')[1] || tool.name}
                                </Badge>
                              ))}
                              {availableTools.length > 6 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{availableTools.length - 6} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 ${
                            message.role === 'user'
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="text-sm whitespace-pre-wrap">
                            {message.content}
                            
                            {/* Show typing indicator if this is active message with no content yet */}
                            {message.isActive && !message.content && !streamingResponse && (
                              <TypingIndicator />
                            )}
                            
                            {/* Show streaming content if this is the active message */}
                            {message.isActive && streamingResponse && (
                              <div className="mt-1 text-sm whitespace-pre-wrap">
                                {streamingResponse}
                              </div>
                            )}
                          </div>
                          
                          {/* Show tools for active or completed messages */}
                          {message.role === 'assistant' && message.isActive && toolExecutionStatuses.size > 0 && (
                            <div className="mt-2 space-y-1">
                              {Array.from(toolExecutionStatuses.values()).map((status: unknown) => {
                                const toolStatus = status as {
                                  toolName: string;
                                  status: 'running' | 'success' | 'error' | string;
                                  result?: any;
                                  executionId?: string;
                                };
                                return (
                                  <ToolProgress
                                    key={toolStatus.executionId || toolStatus.toolName} 
                                    toolName={toolStatus.toolName || 'Tool'}
                                    status={toolStatus.status as 'running' | 'success' | 'error'}
                                    result={toolStatus.result}
                                  />
                                );
                              })}
                            </div>
                          )}
                          
                          {/* Show saved tool calls for completed messages */}
                          {message.toolCalls && message.toolCalls.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {message.toolCalls.map((toolCall) => (
                                <ToolProgress
                                  key={toolCall.name}
                                  toolName={toolCall.name}
                                  status={toolCall.status as 'running' | 'success' | 'error'}
                                  result={toolCall.result}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Input */}
              <div className="p-3 border-t bg-gray-50">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={
                      currentContext?.provider === 'retouchr'
                        ? "Ask me to edit your design..."
                        : "How can I help you?"
                    }
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isLoading}
                    size="icon"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex flex-col gap-1 mt-2 text-xs text-gray-500">
                  {/* Simple static messages for now */}
                  {messages.some(m => m.toolCalls?.some(t => t.status === 'running')) && (
                    <div className="rounded border px-2 py-1 bg-blue-50 text-blue-700">
                      ⚙️ Using tool...
                    </div>
                  )}
                  
                  {messages.some(m => m.toolCalls?.some(t => t.status === 'success')) && (
                    <div className="rounded border px-2 py-1 bg-green-50 text-green-700">
                      ✅ Tool used
                    </div>
                  )}
                  
                  {messages.some(m => m.toolCalls?.some(t => t.status === 'error')) && (
                    <div className="rounded border px-2 py-1 bg-red-50 text-red-700">
                      ❌ Tool failed
                    </div>
                  )}
                  
                  {streamingResponse && <span>...</span>}
                </div>
              </div>
            </>
        </Card>
      </div>
    </div>
  );
}
