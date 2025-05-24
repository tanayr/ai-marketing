/**
 * Manual Tool Testing Panel - Uses real Retouchr tools for direct testing
 */

import React, { useState, useEffect } from 'react';
import { useCanvas } from '../studio/retouchr/hooks/use-canvas';
import { retouchrProvider } from '@/lib/ai-chat/providers/retouchr/retouchr-provider';
import { ToolDefinition } from '@/lib/ai-chat/types/providers';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';

// Extract tool definitions from the actual provider
const PROVIDER_TOOLS = retouchrProvider.tools;

// Helper to extract input schema from tools
const getInputsFromTool = (tool: ToolDefinition) => {
  const schema = tool.inputSchema;
  const inputs: Record<string, string> = {};
  
  if (schema && schema.properties) {
    Object.keys(schema.properties).forEach(key => {
      const prop = schema.properties[key];
      inputs[key] = prop.type || 'text';
    });
  }
  
  return inputs;
};

export function ToolTestingPanel() {
  const [selectedTool, setSelectedTool] = useState<ToolDefinition | null>(null);
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { canvas } = useCanvas();
  
  // Set first tool as default when component mounts
  useEffect(() => {
    if (PROVIDER_TOOLS.length > 0 && !selectedTool) {
      setSelectedTool(PROVIDER_TOOLS[0]);
    }
  }, [selectedTool]);

  // Reset inputs when tool changes
  useEffect(() => {
    if (selectedTool) {
      setInputs({});
    }
  }, [selectedTool]);

  const handleInputChange = (key: string, value: any) => {
    setInputs(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Execute tool via API
  const executeTool = async () => {
    if (!canvas || !selectedTool) {
      setResult('❌ Canvas or tool not available');
      return;
    }

    setLoading(true);
    setResult('⏳ Executing via API...');

    try {
      console.log(`[ToolTest] Executing ${selectedTool.name} with inputs:`, inputs);

      // Format tools properly for Claude API
      // First prepare the proper tool format
      const properToolFormat = {
        type: 'function',
        function: {
          name: selectedTool.name,
          description: selectedTool.description || 'Execute a tool',
          parameters: selectedTool.inputSchema || {
            type: 'object',
            properties: {},
            required: []
          }
        }
      };

      // Call the API directly to test tool execution with proper formatting
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Execute tool ${selectedTool.name} with inputs: ${JSON.stringify(inputs)}`
          }],
          // Pass properly formatted tool definition
          tools: [properToolFormat],
          stream: false
        })
      });

      const data = await response.json();
      setResult(`✅ API Response:\n${JSON.stringify(data, null, 2)}`);
      
    } catch (error) {
      console.error('[ToolTest] API Error:', error);
      setResult(`❌ API Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // Execute tool directly using its handler
  const executeToolDirect = async () => {
    if (!canvas || !selectedTool) {
      setResult('❌ Canvas or tool not available');
      return;
    }

    setLoading(true);
    setResult('⏳ Executing directly...');

    try {
      // Create context for the tool
      const context = {
        canvas,
        userId: 'test-user',
        organizationId: 'test-org',
        sessionId: 'test-session',
        providerId: 'retouchr'
      };

      // Execute the actual tool handler
      console.log(`[ToolTest] Executing handler for ${selectedTool.name} with:`, inputs);
      const result = await selectedTool.handler(inputs, context);
      
      setResult(`✅ Direct execution success:\n${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      console.error('[ToolTest] Direct execution error:', error);
      setResult(`❌ Direct execution error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // Get input fields from tool schema
  const getInputFields = () => {
    if (!selectedTool) return null;
    
    const inputSchemaProps = selectedTool.inputSchema?.properties || {};
    const requiredFields = selectedTool.inputSchema?.required || [];
    
    if (Object.keys(inputSchemaProps).length === 0) {
      return (
        <div className="text-sm text-gray-500 italic">
          This tool doesn't require any inputs.
        </div>
      );
    }
    
    return (
      <div className="space-y-3">
        {Object.entries(inputSchemaProps).map(([key, schema]) => {
          const isRequired = requiredFields.includes(key);
          const type = (schema as any).type || 'string';
          
          return (
            <div key={key} className="space-y-1">
              <Label className="flex items-center">
                {key} 
                {isRequired && <span className="text-red-500 ml-1">*</span>}
                <span className="text-xs text-gray-500 ml-2">({type})</span>
              </Label>
              <Input
                type={type === 'number' ? 'number' : 'text'}
                value={inputs[key] || ''}
                onChange={(e) => handleInputChange(key, 
                  type === 'number' ? Number(e.target.value) : e.target.value
                )}
                placeholder={`Enter ${key}`}
                className="w-full"
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-md mx-auto fixed left-6 bottom-6 z-40">
      <CardHeader>
        <CardTitle className="flex items-center">
          <span className="mr-2">🔧</span> Retouchr Tool Testing
        </CardTitle>
        <CardDescription>
          Test AI tools directly without going through Claude
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Tool Selection */}
        <div className="space-y-2">
          <Label>Select Tool:</Label>
          <select 
            value={selectedTool?.name || ''}
            onChange={(e) => {
              const tool = PROVIDER_TOOLS.find(t => t.name === e.target.value);
              if (tool) setSelectedTool(tool);
            }}
            className="w-full p-2 border rounded"
          >
            {PROVIDER_TOOLS.map(tool => (
              <option key={tool.name} value={tool.name}>
                {tool.name} - {tool.description}
              </option>
            ))}
          </select>
        </div>

        {/* Tool Description */}
        {selectedTool && (
          <div className="text-sm border-l-4 border-blue-500 pl-3 py-2 bg-blue-50 rounded">
            <div className="font-medium">{selectedTool.name}</div>
            <div className="text-gray-600">{selectedTool.description}</div>
            <div className="text-xs text-gray-500 mt-1">Category: {selectedTool.category}</div>
          </div>
        )}

        {/* Input Fields */}
        <div className="space-y-2">
          <Label>Inputs:</Label>
          {getInputFields()}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={executeToolDirect}
            disabled={loading || !selectedTool}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? '⏳ Running...' : '🚀 Execute Direct'}
          </Button>
          <Button
            onClick={executeTool}
            disabled={loading || !selectedTool}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? '⏳ Running...' : '🔄 Execute via API'}
          </Button>
        </div>

        {/* Result Display */}
        <div>
          <Label>Result:</Label>
          <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-auto max-h-64 whitespace-pre-wrap">
            {result || 'No result yet'}
          </pre>
        </div>

        {/* Canvas Info */}
        <div className="text-xs text-gray-600 border-t pt-2">
          <div className="flex items-center">
            <span className="font-medium mr-2">Canvas:</span> 
            {canvas ? <span className="text-green-600">✅ Available</span> : <span className="text-red-600">❌ Not Available</span>}
          </div>
          {canvas && (
            <div className="flex items-center">
              <span className="font-medium mr-2">Objects:</span> {canvas.getObjects().length}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
