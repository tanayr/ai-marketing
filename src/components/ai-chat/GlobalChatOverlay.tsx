'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Minimize, RotateCcw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useGlobalChat } from '../ai-chat/hooks/useGlobalChat';
import { ContextIndicator } from './components/ContextIndicator';
import { ToolProgress } from './components/ToolProgress';
import { TypingIndicator } from './components/TypingIndicator';
import { ChatInput } from './components/ChatInput';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
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
  isActive?: boolean;
  toolCalls?: Array<{
    id?: string;
    name: string;
    status: 'running' | 'success' | 'error';
    result?: any;
  }>;
  imageData?: {
    file: File;
    base64: string;
    preview: string;
  };
}

interface GlobalChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalChatOverlay({ isOpen, onClose }: GlobalChatOverlayProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    currentContext, 
    availableTools,
    sendMessage, 
    streamingResponse, 
    toolExecutionStatuses,
    activeMessage,
    resetSession,
    promptOptions,
    selectedPromptId,
    selectPrompt
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
    resetSession();
    console.log('[GlobalChatOverlay] Session and messages reset');
  };

  const handleSendMessage = async (message: string, imageData?: { file: File; base64: string }) => {
    if (!message.trim()) return;
    
    setIsLoading(true);
    
    // Generate IDs for this conversation sequence
    const conversationId = Date.now().toString();
    const userMessageId = `user-${conversationId}`;
    const assistantMessageId = `assistant-${conversationId}`;
    
    // Create user message with image support
    let messageContent: string | Array<any> = message.trim();
    let userMessageImageData: any = undefined;

    if (imageData) {
      // For display purposes - keep structured content
      messageContent = [
        {
          type: 'text',
          text: message.trim()
        },
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: imageData.file.type || 'image/jpeg',
            data: imageData.base64
          }
        }
      ];
      
      // Store image data for preview
      userMessageImageData = {
        file: imageData.file,
        base64: imageData.base64,
        preview: URL.createObjectURL(imageData.file)
      };
    }
    
    // Add user message
    const newUserMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: messageContent,
      timestamp: Date.now(),
      imageData: userMessageImageData
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
    
    try {
      console.log('[GlobalChatOverlay] 🚀 Starting sendMessage...');
      const response = await sendMessage(
        message.trim(), 
        currentContext,
        availableTools,
        assistantMessageId, 
        false, 
        true,
        imageData
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
              {/* Prompt Selector */}
              {promptOptions.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1"
                      title="Change AI system prompt"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-xs hidden sm:inline-block">Prompt</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Select System Prompt</h4>
                      <p className="text-xs text-muted-foreground">Choose which prompt style to use for this chat session.</p>
                      
                      <RadioGroup 
                        value={selectedPromptId} 
                        onValueChange={selectPrompt}
                        className="pt-2"
                      >
                        {promptOptions.map(option => (
                          <div key={option.id} className="flex items-start space-x-2 py-1">
                            <RadioGroupItem value={option.id} id={`prompt-${option.id}`} />
                            <div className="grid gap-0.5">
                              <Label htmlFor={`prompt-${option.id}`} className="font-medium">
                                {option.name}
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                {option.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              
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
                            {/* Render message content - handle both string and array formats */}
                            {typeof message.content === 'string' ? (
                              message.content
                            ) : Array.isArray(message.content) ? (
                              message.content.map((item, index) => (
                                <div key={index}>
                                  {item.type === 'text' && item.text}
                                  {item.type === 'image' && item.source && (
                                    <img 
                                      src={`data:${item.source.media_type};base64,${item.source.data}`}
                                      alt="Uploaded reference"
                                      className="max-w-xs rounded mt-2"
                                    />
                                  )}
                                </div>
                              ))
                            ) : null}
                            
                            {/* Show image preview if available */}
                            {message.imageData && (
                              <div className="mt-2">
                                <img 
                                  src={message.imageData.preview}
                                  alt="Reference"
                                  className="max-w-xs rounded border"
                                />
                              </div>
                            )}
                            
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
                          
                          {/* Show tools for active or completed messages - filtered by message ID */}
                          {message.role === 'assistant' && message.isActive && toolExecutionStatuses.size > 0 && (
                            <div className="mt-2 space-y-1">
                              {Array.from(toolExecutionStatuses.values())
                                .filter((status: any) => {
                                  // IMPORTANT: Only show tool statuses that are EXPLICITLY associated with this message ID
                                  // Null or undefined messageId should NOT be shown (fixes duplication bug)
                                  return status.messageId === message.id;
                                })
                                .map((status: unknown) => {
                                  const toolStatus = status as {
                                    toolName: string;
                                    status: 'running' | 'success' | 'error' | string;
                                    result?: any;
                                    executionId?: string;
                                    messageId?: string;
                                  };
                                  return (
                                    <ToolProgress
                                      key={`${message.id}-${toolStatus.executionId || toolStatus.toolName}`} 
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
                                  key={`${message.id}-${toolCall.id || toolCall.name}`}
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

              {/* Chat Input with Image Support */}
              <ChatInput
                onSubmit={handleSendMessage}
                disabled={isLoading}
                placeholder={
                  currentContext?.provider === 'retouchr'
                    ? "Ask me to edit your design or upload a reference image..."
                    : "How can I help you?"
                }
              />
            </>
        </Card>
      </div>
    </div>
  );
}
