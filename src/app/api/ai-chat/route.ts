import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client on the server side
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[API] 📤 Incoming request:', {
      messages: body.messages?.length || 0,
      tools: body.tools?.length || 0,
      stream: body.stream
    });

    const { messages, tools, organizationId, systemPrompt, stream } = body;

    console.log('[API] 🔧 Available tools:', tools?.map((t: any) => t.name) || []);
    // Log abbreviated message summary for quick reference
    console.log('[API] 💬 Messages summary:', messages?.map((m: any) => ({ 
      role: m.role, 
      content: typeof m.content === 'string' 
        ? m.content.substring(0, 100) + '...' 
        : JSON.stringify(m.content).substring(0, 100) + '...'
    })));
    
    // Log the COMPLETE prompt for debugging
    console.log('[API] 📚 COMPLETE CLAUDE PROMPT:', {
      messages: JSON.stringify(messages, null, 2),
      system: systemPrompt,
      tools: JSON.stringify(tools, null, 2)
    });

    // Basic validation
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // TODO: Add organization-based access control here
    // For now, we'll just proceed with the request

    // Properly format tools for Claude API
    const requestOptions: any = {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages
    };
    
    // Only add tools if we have them and they're properly formatted
    if (tools?.length > 0) {
      // Check if tools are already in the correct format or just names
      const areToolsFormatted = typeof tools[0] === 'object' && tools[0].function;
      
      if (areToolsFormatted) {
        // Already formatted tools
        requestOptions.tools = tools;
      } else {
        // Format string tool names into proper Claude tool objects
        try {
          requestOptions.tools = [
            {
              name: typeof tools[0] === 'string' ? tools[0] : 'unknown',
              description: 'Execute a tool function',
              input_schema: {
                type: 'object',
                properties: {},
                required: []
              }
            }
          ];
        } catch (error) {
          console.error('[API] Error formatting tools:', error);
        }
      }
    }

    if (systemPrompt) {
      requestOptions.system = systemPrompt;
    }

    if (stream) {
      // For now, let's disable streaming and just return regular response
      // TODO: Implement proper streaming support later
      try {
        const response = await anthropic.messages.create(requestOptions);
        console.log('[API] 📥 Claude response:', {
          type: response.type,
          role: response.role,
          contentCount: response.content?.length,
          contentTypes: response.content?.map((c: any) => c.type),
          usage: response.usage
        });
  
        // Log tool calls separately for debugging
        const toolUseBlocks = response.content?.filter((c: any) => c.type === 'tool_use') || [];
        if (toolUseBlocks.length > 0) {
          console.log('[API] 🔧 Tool calls detected:', toolUseBlocks.map((block: any) => ({
            id: block.id,
            name: block.name,
            input: block.input
          })));
        }
  
        return NextResponse.json(response);
      } catch (error: any) {
        // Handle token limit errors explicitly
        if (error?.status === 400 && error?.error?.message?.includes('token') && error?.error?.message?.includes('too long')) {
          console.error('[API] 📊 TOKEN LIMIT ERROR FROM CLAUDE:', {
            error: error.error.message,
            requestTokens: {
              messagesCount: messages.length,
              systemPromptLength: systemPrompt?.length || 0,
              toolsCount: tools?.length || 0
            },
            rawError: error
          });
          
          // Log average message sizes to help troubleshoot
          const messageSizes = messages.map((m: any, i: number) => {
            const contentSize = typeof m.content === 'string' 
              ? m.content.length 
              : JSON.stringify(m.content).length;
            return { index: i, role: m.role, size: contentSize };
          });
          
          // Sort by size to find largest messages
          const sortedBySizeDesc = [...messageSizes].sort((a, b) => b.size - a.size);
          console.error('[API] 📏 LARGEST MESSAGES:', sortedBySizeDesc.slice(0, 5));
        } else {
          console.error('[API] ❌ Claude API error:', error);
        }
        
        // Return detailed error information to the client
        return NextResponse.json({ 
          error: error.error?.message || error.message || 'Claude API error',
          status: error.status || 500,
          details: JSON.stringify(error, Object.getOwnPropertyNames(error)),
          type: error.type || 'unknown_error'
        }, { status: 500 });
      }
    } else {
      try {
        const response = await anthropic.messages.create(requestOptions);
        console.log('[API] 📥 Claude response:', {
          type: response.type,
          role: response.role,
          contentCount: response.content?.length,
          contentTypes: response.content?.map((c: any) => c.type),
          usage: response.usage
        });
  
        // Log tool calls separately for debugging
        const toolUseBlocks = response.content?.filter((c: any) => c.type === 'tool_use') || [];
        if (toolUseBlocks.length > 0) {
          console.log('[API] 🔧 Tool calls detected:', toolUseBlocks.map((block: any) => ({
            id: block.id,
            name: block.name,
            input: block.input
          })));
        }
  
        return NextResponse.json(response);
      } catch (error: any) {
        // Handle token limit errors explicitly
        if (error?.status === 400 && error?.error?.message?.includes('token') && error?.error?.message?.includes('too long')) {
          console.error('[API] 📊 TOKEN LIMIT ERROR FROM CLAUDE:', {
            error: error.error.message,
            requestTokens: {
              messagesCount: messages.length,
              systemPromptLength: systemPrompt?.length || 0,
              toolsCount: tools?.length || 0
            },
            rawError: error
          });
          
          // Log average message sizes to help troubleshoot
          const messageSizes = messages.map((m: any, i: number) => {
            const contentSize = typeof m.content === 'string' 
              ? m.content.length 
              : JSON.stringify(m.content).length;
            return { index: i, role: m.role, size: contentSize };
          });
          
          // Sort by size to find largest messages
          const sortedBySizeDesc = [...messageSizes].sort((a, b) => b.size - a.size);
          console.error('[API] 📏 LARGEST MESSAGES:', sortedBySizeDesc.slice(0, 5));
        } else {
          console.error('[API] ❌ Claude API error:', error);
        }
        
        // Return detailed error information to the client
        return NextResponse.json({ 
          error: error.error?.message || error.message || 'Claude API error',
          status: error.status || 500,
          details: JSON.stringify(error, Object.getOwnPropertyNames(error)),
          type: error.type || 'unknown_error'
        }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('[API] ❌ Error calling Anthropic:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process AI chat request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
