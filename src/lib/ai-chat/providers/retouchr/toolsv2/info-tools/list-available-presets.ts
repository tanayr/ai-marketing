"use client";

import { ToolExecutionResult } from '../types/shared-types';
import { getAllPresets, getPresetDetails } from '../text-tools/apply-preset-style';

/**
 * List all available style presets
 * 
 * This tool returns a comprehensive list of all available text style presets
 * with their names and descriptions. It can also provide detailed information
 * about a specific preset when requested.
 */
export const listAvailablePresets = async (
  specificPreset?: string
): Promise<ToolExecutionResult> => {
  try {
    // If a specific preset is requested
    if (specificPreset) {
      const preset = getPresetDetails(specificPreset);
      
      if (!preset) {
        return {
          success: false,
          error: `Preset style "${specificPreset}" not found`,
          data: {
            presets: []
          }
        };
      }
      
      // Return detailed information about the requested preset
      return {
        success: true,
        error: undefined,
        data: {
          message: `Details for preset "${preset.name}"`,
          preset: {
            id: specificPreset,
            name: preset.name,
            description: preset.description,
            properties: preset.properties,
            advancedProperties: preset.advancedProperties || {},
          }
        }
      };
    }
    
    // Get all available presets
    const allPresets = getAllPresets();
    const presetIds = Object.keys(allPresets);
    
    if (presetIds.length === 0) {
      return {
        success: true,
        error: undefined,
        data: {
          message: 'No preset styles are available',
          presets: []
        }
      };
    }
    
    // Format preset information for display
    const presetList = presetIds.map(id => {
      const preset = allPresets[id];
      return {
        id,
        name: preset.name,
        description: preset.description,
      };
    });
    
    // Sort alphabetically by name
    presetList.sort((a, b) => a.name.localeCompare(b.name));
    
    return {
      success: true,
      error: undefined,
      data: {
        message: `Found ${presetList.length} available style presets`,
        presets: presetList
      }
    };
  } catch (error) {
    console.error('Error listing available presets:', error);
    return {
      success: false,
      error: `Error listing available presets: ${error instanceof Error ? error.message : String(error)}`,
      data: {
        presets: []
      }
    };
  }
};
