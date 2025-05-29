"use client";

import { useState, useEffect } from 'react';
import { 
  allToolsV2, 
  textToolDefinitions, 
  objectToolDefinitions, 
  infoToolDefinitions 
} from '@/lib/ai-chat/providers/retouchr/toolsv2/retouchr-tool-provider';
import { ToolDefinition } from '@/lib/ai-chat/types/providers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useRetouchrCanvas } from '@/components/studio/retouchr/hooks/useRetouchrCanvas';
import { Sparkles, Droplet, Type, Palette, Layers, Info, PanelLeft, Code } from 'lucide-react';

// Text style templates for common effects
type StyleTemplateKey = 'Basic Text' | 'Bold Heading' | 'Shadow Effect' | 'Outline Effect' | 'Gradient Effect' | 'Modern Style' | 'Handwritten Style' | 'Multi-Effect Combo';

const textStyleTemplates: Record<StyleTemplateKey, Record<string, any>> = {
  'Basic Text': {
    fontSize: 24,
    fontFamily: 'Arial',
    fill: '#000000',
    fontWeight: 'normal',
    textAlign: 'left'
  },
  'Bold Heading': {
    fontSize: 36,
    fontFamily: 'Arial',
    fill: '#333333',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  'Shadow Effect': {
    fontSize: 30,
    fontFamily: 'Arial',
    fill: '#3366cc',
    fontWeight: 'bold',
    textShadow: {
      offsetX: 3,
      offsetY: 3,
      blur: 5,
      color: 'rgba(0,0,0,0.5)'
    }
  },
  'Outline Effect': {
    fontSize: 32,
    fontFamily: 'Impact',
    fill: '#ffffff',
    textOutline: {
      width: 2,
      color: '#000000'
    }
  },
  'Gradient Effect': {
    fontSize: 36,
    fontFamily: 'Arial Black',
    fontWeight: 'bold',
    textGradient: {
      type: 'linear',
      angle: 90,
      colors: ['#ff4500', '#ff8c00', '#ffd700']
    }
  },
  'Modern Style': {
    fontSize: 28,
    fontFamily: 'Helvetica',
    fill: '#ffffff',
    fontWeight: 'bold',
    padding: 15,
    backgroundColor: '#3498db',
    borderRadius: 8,
    textAlign: 'center'
  },
  'Handwritten Style': {
    fontSize: 28,
    fontFamily: 'Comic Sans MS',
    fill: '#333333',
    fontStyle: 'italic',
    letterSpacing: 2,
    lineHeight: 1.3
  },
  'Multi-Effect Combo': {
    fontSize: 32,
    fontFamily: 'Arial',
    textGradient: {
      type: 'linear',
      angle: 45,
      colors: ['#3498db', '#9b59b6', '#e74c3c']
    },
    textOutline: {
      width: 1,
      color: '#ffffff'
    },
    textShadow: {
      offsetX: 2,
      offsetY: 2,
      blur: 4,
      color: 'rgba(0,0,0,0.3)'
    },
    letterSpacing: 2,
    textAlign: 'center'
  }
};

// Available presets with descriptions
const presetOptions = [
  { name: 'heading1', description: 'Large bold heading for main titles' },
  { name: 'heading2', description: 'Medium sized heading for sections' },
  { name: 'body', description: 'Standard body text for content' },
  { name: 'quote', description: 'Stylized text for quotes' },
  { name: 'callout', description: 'Eye-catching callout with background' },
  { name: 'colorful', description: 'Colorful text with gradient' },
  { name: 'shadow', description: 'Text with drop shadow effect' },
  { name: 'outline', description: 'Text with outline effect' },
  { name: 'futuristic', description: 'Modern tech-inspired text style' },
  { name: 'handwritten', description: 'Casual handwritten style' }
];

export function ToolDebugPanel() {
  const [selectedTool, setSelectedTool] = useState<ToolDefinition | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [paramValues, setParamValues] = useState<Record<string, any>>({});
  const [useSelectedObject, setUseSelectedObject] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [executing, setExecuting] = useState(false);
  const [resultType, setResultType] = useState<'success' | 'error' | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const { canvas, selectedObject } = useRetouchrCanvas();

  // Filter tools based on selected category
  const filteredTools = selectedCategory === 'all' 
    ? allToolsV2 
    : allToolsV2.filter(tool => tool.category === selectedCategory);

  // Reset param values when tool changes
  useEffect(() => {
    if (selectedTool) {
      const defaultValues: Record<string, any> = {};
      
      // Initialize default values for each parameter
      if (selectedTool.inputSchema?.properties) {
        Object.entries(selectedTool.inputSchema.properties).forEach(([key, prop]: [string, any]) => {
          if (key === 'objectId' && useSelectedObject) {
            // Skip objectId when using selected object
            return;
          }
          
          // Set default values based on type
          switch (prop.type) {
            case 'string':
              defaultValues[key] = '';
              break;
            case 'number':
              defaultValues[key] = 0;
              break;
            case 'boolean':
              defaultValues[key] = false;
              break;
            case 'object':
              defaultValues[key] = '{}';
              break;
            default:
              defaultValues[key] = '';
          }
        });
      }
      
      setParamValues(defaultValues);
    } else {
      setParamValues({});
    }
  }, [selectedTool, useSelectedObject]);
  
  // Update objectId when selected object changes and useSelectedObject is true
  useEffect(() => {
    if (useSelectedObject && selectedObject && selectedTool?.inputSchema?.properties?.objectId) {
      setParamValues(prev => ({
        ...prev,
        objectId: selectedObject.id
      }));
    }
  }, [selectedObject, useSelectedObject, selectedTool]);

  const handleInputChange = (key: string, value: any) => {
    setParamValues(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Apply a text style template
  const applyStyleTemplate = (templateName: string) => {
    if (selectedTool?.name === 'apply_text_style' && 
        Object.keys(textStyleTemplates).includes(templateName as StyleTemplateKey)) {
      setParamValues(prev => ({
        ...prev,
        properties: JSON.stringify(textStyleTemplates[templateName as StyleTemplateKey], null, 2)
      }));
    }
  };

  const executeSelectedTool = async () => {
    if (!selectedTool || !canvas) return;
    
    setExecuting(true);
    setResult(null);
    setResultType(null);
    
    try {
      // Parse JSON strings to objects
      const processedParams = { ...paramValues };
      
      Object.entries(processedParams).forEach(([key, value]) => {
        if (typeof value === 'string' && 
            selectedTool.inputSchema?.properties?.[key]?.type === 'object') {
          try {
            processedParams[key] = JSON.parse(value);
          } catch (e) {
            // Keep as string if parsing fails
            console.warn(`Failed to parse JSON for parameter: ${key}`);
          }
        }
      });
      
      // Add objectId from selected object if using selected object
      if (useSelectedObject && selectedObject && 
          selectedTool.inputSchema?.properties?.objectId) {
        processedParams.objectId = selectedObject.id;
      }
      
      // Execute the tool with the canvas context
      const toolResult = await selectedTool.handler(processedParams, { canvas });
      
      setResult(toolResult);
      setResultType(toolResult.success ? 'success' : 'error');
    } catch (error) {
      console.error('Error executing tool:', error);
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      setResultType('error');
    } finally {
      setExecuting(false);
    }
  };

  const renderInputForParam = (key: string, prop: any) => {
    // Skip objectId field if using selected object
    if (key === 'objectId' && useSelectedObject) {
      return null;
    }
    
    const value = paramValues[key];
    
    switch (prop.type) {
      case 'string':
        // Handle enum type with select
        if (prop.enum) {
          return (
            <div className="space-y-2" key={key}>
              <Label htmlFor={key}>{key}</Label>
              <Select 
                value={value} 
                onValueChange={(newValue) => handleInputChange(key, newValue)}
              >
                <SelectTrigger id={key}>
                  <SelectValue placeholder={`Select ${key}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {prop.enum.map((option: string) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {prop.description && (
                <p className="text-xs text-muted-foreground">{prop.description}</p>
              )}
            </div>
          );
        }
        
        // Use textarea for potentially longer strings
        if (key === 'text') {
          return (
            <div className="space-y-2" key={key}>
              <Label htmlFor={key}>{key}</Label>
              <Textarea
                id={key}
                value={value}
                onChange={(e) => handleInputChange(key, e.target.value)}
                placeholder={prop.description || key}
                className="min-h-[80px]"
              />
              {prop.description && (
                <p className="text-xs text-muted-foreground">{prop.description}</p>
              )}
            </div>
          );
        }
        
        // Default string input
        return (
          <div className="space-y-2" key={key}>
            <Label htmlFor={key}>{key}</Label>
            <Input
              id={key}
              value={value}
              onChange={(e) => handleInputChange(key, e.target.value)}
              placeholder={prop.description || key}
            />
            {prop.description && (
              <p className="text-xs text-muted-foreground">{prop.description}</p>
            )}
          </div>
        );
        
      case 'number':
        return (
          <div className="space-y-2" key={key}>
            <Label htmlFor={key}>{key}</Label>
            <Input
              id={key}
              type="number"
              value={value}
              onChange={(e) => handleInputChange(key, parseFloat(e.target.value) || 0)}
              placeholder={prop.description || key}
            />
            {prop.description && (
              <p className="text-xs text-muted-foreground">{prop.description}</p>
            )}
          </div>
        );
        
      case 'boolean':
        return (
          <div className="flex items-center space-x-2 py-4" key={key}>
            <Checkbox
              id={key}
              checked={value}
              onCheckedChange={(checked: boolean) => handleInputChange(key, checked)}
            />
            <div>
              <Label htmlFor={key} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {key}
              </Label>
              {prop.description && (
                <p className="text-xs text-muted-foreground">{prop.description}</p>
              )}
            </div>
          </div>
        );
        
      case 'object':
        return (
          <div className="space-y-2" key={key}>
            <Label htmlFor={key}>{key}</Label>
            <Textarea
              id={key}
              value={value}
              onChange={(e) => handleInputChange(key, e.target.value)}
              placeholder={`Enter JSON for ${key}`}
              className="font-mono text-sm min-h-[120px]"
            />
            {prop.description && (
              <p className="text-xs text-muted-foreground">{prop.description}</p>
            )}
            
            {/* Additional help for properties field */}
            {key === 'properties' && selectedTool?.name === 'apply_text_style' && (
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <p className="font-medium">Common Properties:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><code>fontSize</code>: number (e.g., 24)</li>
                  <li><code>fontFamily</code>: string (e.g., "Arial")</li>
                  <li><code>fill</code>: string (e.g., "#ff0000")</li>
                  <li><code>fontWeight</code>: string ("normal", "bold")</li>
                  <li><code>fontStyle</code>: string ("normal", "italic")</li>
                  <li><code>textAlign</code>: string ("left", "center", "right")</li>
                  <li><code>lineHeight</code>: number (e.g., 1.2)</li>
                  <li><code>backgroundColor</code>: string (e.g., "#f0f0f0")</li>
                </ul>
                <p className="font-medium mt-2">Advanced Properties:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><code>textShadow</code>: {'{'}offsetX: number, offsetY: number, blur: number, color: string{'}'}</li>
                  <li><code>textOutline</code>: {'{'}width: number, color: string{'}'}</li>
                  <li><code>textGradient</code>: {'{'}type: "linear", angle: number, colors: string[]{'}'}</li>
                  <li><code>letterSpacing</code>: number (e.g., 2)</li>
                  <li><code>padding</code>: number (e.g., 10)</li>
                  <li><code>borderRadius</code>: number (e.g., 5)</li>
                  <li><code>textTransform</code>: string ("none", "uppercase", "lowercase", "capitalize")</li>
                </ul>
              </div>
            )}
          </div>
        );
        
      default:
        return (
          <div className="space-y-2" key={key}>
            <Label htmlFor={key}>{key}</Label>
            <Input
              id={key}
              value={value}
              onChange={(e) => handleInputChange(key, e.target.value)}
              placeholder={prop.description || key}
            />
            {prop.description && (
              <p className="text-xs text-muted-foreground">{prop.description}</p>
            )}
          </div>
        );
    }
  };

  return (
    <Card className="w-[450px] shadow-lg max-h-[90vh] flex flex-col">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Retouchr Tool Debugger</span>
          {selectedObject && (
            <Badge variant="outline" className="ml-2">
              Selected: {selectedObject.id}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Test and debug Retouchr tools directly
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory}>
        <div className="px-6">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" />
              <span>All</span>
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-1">
              <Type className="h-3.5 w-3.5" />
              <span>Text</span>
            </TabsTrigger>
            <TabsTrigger value="objects" className="flex items-center gap-1">
              <Palette className="h-3.5 w-3.5" />
              <span>Objects</span>
            </TabsTrigger>
            <TabsTrigger value="canvas" className="flex items-center gap-1">
              <Info className="h-3.5 w-3.5" />
              <span>Canvas</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="p-6 flex-grow overflow-hidden flex flex-col">
          <div className="space-y-4 flex-grow overflow-hidden flex flex-col">
            {/* Tool selection */}
            <div>
              <Label htmlFor="tool-select">Select Tool</Label>
              <Select 
                value={selectedTool?.name || ''} 
                onValueChange={(value) => {
                  const tool = allToolsV2.find(t => t.name === value);
                  setSelectedTool(tool || null);
                }}
              >
                <SelectTrigger id="tool-select">
                  <SelectValue placeholder="Select a tool to debug" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {filteredTools.map((tool) => (
                      <SelectItem key={tool.name} value={tool.name}>
                        {tool.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            {/* Selected object toggle */}
            {selectedTool?.inputSchema?.properties?.objectId && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="use-selected"
                  checked={useSelectedObject}
                  onCheckedChange={setUseSelectedObject}
                />
                <Label htmlFor="use-selected">Use selected object</Label>
              </div>
            )}
            
            {/* Tool description */}
            {selectedTool && (
              <>
                <div className="text-sm text-muted-foreground border-l-4 border-muted pl-3 py-1 my-2">
                  {selectedTool.description}
                </div>
                
                {/* Template buttons for apply_text_style */}
                {selectedTool.name === 'apply_text_style' && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium">Style Templates</Label>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setShowTemplates(!showTemplates)}
                      >
                        {showTemplates ? 'Hide Templates' : 'Show Templates'}
                      </Button>
                    </div>
                    
                    {showTemplates && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {Object.keys(textStyleTemplates).map((templateName) => (
                          <Button 
                            key={templateName}
                            variant="outline" 
                            size="sm"
                            className="justify-start text-xs h-auto py-1"
                            onClick={() => applyStyleTemplate(templateName)}
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            {templateName}
                          </Button>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-2 text-xs text-muted-foreground">
                      <Code className="inline h-3 w-3 mr-1" />
                      Click a template to auto-fill the properties field with a working example
                    </div>
                  </div>
                )}
                
                {/* Preset information for apply_preset_style */}
                {selectedTool.name === 'apply_preset_style' && (
                  <div className="mt-4 space-y-2 bg-muted/30 p-3 rounded-md">
                    <h4 className="text-sm font-medium flex items-center">
                      <PanelLeft className="h-4 w-4 mr-1" />
                      Available Presets
                    </h4>
                    <ScrollArea className="h-[150px] rounded-md border">
                      <div className="p-3 space-y-2">
                        {presetOptions.map((preset) => (
                          <div key={preset.name} className="flex flex-col space-y-1">
                            <div className="flex items-center">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-6 px-2 py-0 text-xs font-mono"
                                onClick={() => handleInputChange('presetName', preset.name)}
                              >
                                {preset.name}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground pl-6">{preset.description}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </>
            )}
            
            {/* Tool parameters */}
            {selectedTool && (
              <ScrollArea className="flex-grow pr-4">
                <div className="space-y-4">
                  {selectedTool.inputSchema?.properties && 
                    Object.entries(selectedTool.inputSchema.properties).map(
                      ([key, prop]) => renderInputForParam(key, prop)
                    )}
                </div>
              </ScrollArea>
            )}
            
            {/* Tool execution button */}
            {selectedTool && (
              <Button 
                onClick={executeSelectedTool} 
                disabled={executing || !canvas}
                className="w-full mt-4"
              >
                {executing ? 'Executing...' : 'Execute Tool'}
              </Button>
            )}
            
            {/* Results display */}
            {result && (
              <div className="mt-4">
                <Label>Result</Label>
                <div 
                  className={`mt-2 p-3 rounded font-mono text-xs overflow-auto max-h-[200px] whitespace-pre ${
                    resultType === 'success' ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'
                  }`}
                >
                  {JSON.stringify(result, null, 2)}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Tabs>
    </Card>
  );
}
