"use client";

import { ToolExecutionResult as ProviderToolResult } from '../../../../types/providers';
import { ToolExecutionResult as V2ToolResult } from '../types/shared-types';

/**
 * Adapt v2 tool results to the format expected by the provider system
 */
export const adaptToolResult = (result: V2ToolResult): ProviderToolResult => {
  return {
    success: result.success,
    data: result.data || {},
    error: result.error,
    metadata: {
      executionTime: result.metadata?.executionTime || Date.now(),
      changedObjects: result.metadata?.changedObjects || []
    }
  };
};

/**
 * Wrap a v2 tool handler to adapt its result to the provider format
 */
export const wrapToolHandler = (
  handler: (...args: any[]) => Promise<V2ToolResult>
) => {
  return async (...args: any[]): Promise<ProviderToolResult> => {
    try {
      const result = await handler(...args);
      return adaptToolResult(result);
    } catch (error) {
      console.error('Error in tool handler:', error);
      return {
        success: false,
        data: {},
        error: `Unhandled error: ${error instanceof Error ? error.message : String(error)}`,
        metadata: {
          executionTime: Date.now(),
          changedObjects: []
        }
      };
    }
  };
};
