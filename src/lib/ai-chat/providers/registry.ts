/**
 * Provider Registry - Manages tool providers and execution
 */

import { ChatProvider, ProviderRegistryEntry, ToolDefinition, ToolProvider, ToolExecutionResult } from '../types/providers';
import { ContextDetector } from '../core/context-detector';
import { retouchrProvider } from './retouchr/retouchr-provider';

export class ProviderRegistry {
  private static instance: ProviderRegistry;
  private providers: Map<string, ToolProvider> = new Map();

  constructor() {
    this.registerDefaultProviders();
  }

  static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  /**
   * Register default providers
   */
  private registerDefaultProviders(): void {
    this.registerProvider(retouchrProvider);
  }

  /**
   * Register a new provider
   */
  registerProvider(provider: ToolProvider): void {
    console.log(`[ProviderRegistry] Registering provider: ${provider.id}`);
    this.providers.set(provider.id, provider);
  }

  /**
   * Get provider by ID
   */
  getProvider(providerId: string): ToolProvider {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`);
    }
    return provider;
  }

  /**
   * Get all active providers
   */
  getActiveProviders(): ToolProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get tools for a specific provider
   */
  getProviderTools(providerId: string): ToolDefinition[] {
    const provider = this.getProvider(providerId);
    // Return the actual tools - no need to transform them
    return provider.tools;
  }

  /**
   * Get all tools from all active providers
   */
  getAllTools(): ToolDefinition[] {
    const tools: ToolDefinition[] = [];
    
    for (const provider of this.getActiveProviders()) {
      tools.push(...this.getProviderTools(provider.id));
    }

    return tools;
  }

  /**
   * Get tools for current context
   */
  getContextualTools(route: string): ToolDefinition[] {
    const detector = ContextDetector.getInstance();
    const context = detector.detectContext(route);
    
    if (context.provider) {
      return this.getProviderTools(context.provider);
    }

    // Return common tools if no specific provider
    return this.getProviderTools('base') || [];
  }

  /**
   * Execute a tool by name with context
   */
  async executeTool(toolName: string, input: any, context: any): Promise<ToolExecutionResult> {
    console.log(`[ProviderRegistry] Looking for tool: ${toolName}`);
    
    // First try to parse as provider.toolname format
    const [providerId, actualToolName] = toolName.includes('.') 
      ? toolName.split('.', 2)
      : [null, toolName];

    let provider: ToolProvider | undefined;
    let tool: ToolDefinition | undefined;

    if (providerId) {
      // Explicit provider specified
      provider = this.getProvider(providerId);
      tool = provider.tools.find(t => t.name === actualToolName);
    } else {
      // Search all providers for the tool
      console.log(`[ProviderRegistry] Searching all providers for tool: ${toolName}`);
      
      // Common tool alias mappings
      const toolAliases: Record<string, string> = {
        'set_background': 'set_canvas_background',
        'set_bg': 'set_canvas_background',
        'change_background': 'set_canvas_background',
        'background': 'set_canvas_background',
        'update_text_properties': 'style_text',
        'update_text_style': 'style_text',
        'modify_text': 'style_text',
        'format_text': 'style_text',
        'text_style': 'style_text',
        'change_text_style': 'style_text',
        'update_text': 'update_text_content',
        'modify_text_content': 'update_text_content',
        'change_text': 'update_text_content'
      };
      
      // Try original name first, then alias
      const searchNames = [toolName];
      if (toolAliases[toolName]) {
        searchNames.push(toolAliases[toolName]);
        console.log(`[ProviderRegistry] Trying alias: ${toolName} -> ${toolAliases[toolName]}`);
      }
      
      for (const [id, prov] of this.providers) {
        for (const searchName of searchNames) {
          const foundTool = prov.tools.find(t => t.name === searchName);
          if (foundTool) {
            console.log(`[ProviderRegistry] Found tool ${searchName} in provider: ${id}`);
            provider = prov;
            tool = foundTool;
            break;
          }
        }
        if (tool) break;
      }
      
      if (!tool || !provider) {
        const availableTools = Array.from(this.providers.values())
          .flatMap(p => p.tools.map(t => `${p.id}.${t.name}`));
        throw new Error(`Tool ${toolName} not found in any provider. Available tools: ${availableTools.join(', ')}`);
      }
    }

    if (!tool || !provider) {
      throw new Error(`Tool ${actualToolName || toolName} not found in provider ${provider?.id || 'unknown'}`);
    }

    try {
      const providerContext = {
        providerId: provider.id,
        ...context
      };

      // Execute the tool using its handler
      const result = await tool.handler(input, providerContext);
      
      // Return the result matching ToolExecutionResult type
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error(`[ProviderRegistry] Tool execution failed for ${toolName}:`, error);
      throw error;
    }
  }

  /**
   * Deactivate a provider
   */
  deactivate(providerId: string): void {
    this.providers.delete(providerId);
  }

  /**
   * Cleanup all providers
   */
  async cleanup(): Promise<void> {
    for (const provider of this.providers.values()) {
      if (provider.cleanup) {
        try {
          await provider.cleanup();
        } catch (error) {
          console.error(`Error cleaning up provider ${provider.id}:`, error);
        }
      }
    }
  }
}
