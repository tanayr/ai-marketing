"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdvancedTextProperties } from '../AdvancedTextContext';
import { Sparkles, Zap, Waves, Crown, Palette, Sunrise, Sun, CircleDot, Square } from 'lucide-react';

interface TextEffectPresetsProps {
  onApplyPreset: (preset: AdvancedTextProperties) => void;
}

/**
 * Visual text effect presets with live preview and clear descriptions
 */
export const TextEffectPresets: React.FC<TextEffectPresetsProps> = ({ onApplyPreset }) => {
  
  // Enhanced preset definitions with visual previews
  const presets = [
    {
      name: 'Corporate',
      description: 'Clean professional text',
      icon: <Square className="h-4 w-4" />,
      preview: {
        backgroundColor: '#f8fafc',
        color: '#1e293b',
        borderRadius: '6px',
        padding: '8px 12px',
        border: '1px solid #e2e8f0'
      },
      tags: ['Business', 'Clean'],
      preset: {
        fontFamily: 'Inter',
        fontSize: 28,
        fontWeight: 'bold',
        fill: '#1e293b',
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
      }
    },
    {
      name: 'Neon Glow',
      description: 'Bright glowing effect',
      icon: <Zap className="h-4 w-4" />,
      preview: {
        backgroundColor: '#0a0a0a',
        color: '#00ffff',
        borderRadius: '6px',
        padding: '8px 12px',
        textShadow: '0 0 10px #00ffff, 0 0 20px #00ffff',
        border: '1px solid #00ffff30'
      },
      tags: ['Vibrant', 'Glow'],
      preset: {
        fontFamily: 'Arial Black',
        fontSize: 32,
        fontWeight: 'bold',
        fill: '#00ffff',
        textShadow: { offsetX: 0, offsetY: 0, blur: 15, color: '#00ffff' },
        backgroundColor: '#0a0a0a',
        padding: 20,
        borderRadius: 8,
      }
    },
    {
      name: 'Fire Text',
      description: 'Hot flame gradient',
      icon: <Sun className="h-4 w-4" />,
      preview: {
        background: 'linear-gradient(90deg, #ff4500, #ff8c00, #ffd700)',
        color: 'transparent',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        borderRadius: '6px',
        padding: '8px 12px',
        textShadow: '2px 2px 4px #FF4500',
        border: '2px solid #8B0000'
      },
      tags: ['Gradient', 'Bold'],
      preset: {
        fontFamily: 'Impact',
        fontSize: 36,
        fontWeight: 'bold',
        textGradient: {
          type: 'linear' as const,
          angle: 90,
          colors: ['#ff4500', '#ff8c00', '#ffd700']
        },
        textOutline: { width: 2, color: '#8B0000' },
        textShadow: { offsetX: 2, offsetY: 2, blur: 4, color: '#FF4500' },
      }
    },
    {
      name: 'Ocean Wave',
      description: 'Flowing water effect',
      icon: <Waves className="h-4 w-4" />,
      preview: {
        background: 'linear-gradient(45deg, #0077be, #00a8e8, #87ceeb)',
        color: 'transparent',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        borderRadius: '6px',
        padding: '8px 12px',
        textShadow: '0 3px 6px rgba(0,119,190,0.4)'
      },
      tags: ['Gradient', 'Smooth'],
      preset: {
        fontFamily: 'Arial',
        fontSize: 30,
        fontWeight: 'bold',
        textGradient: {
          type: 'linear' as const,
          angle: 45,
          colors: ['#0077be', '#00a8e8', '#87ceeb']
        },
        textShadow: { offsetX: 0, offsetY: 3, blur: 6, color: 'rgba(0,119,190,0.4)' },
        letterSpacing: 1.5,
      }
    },
    {
      name: 'Gold Luxury',
      description: 'Premium metallic look',
      icon: <Crown className="h-4 w-4" />,
      preview: {
        background: 'linear-gradient(0deg, #ffd700, #ffed4e, #fff200)',
        color: 'transparent',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        borderRadius: '6px',
        padding: '8px 12px',
        textShadow: '1px 1px 3px rgba(255,215,0,0.6)',
        border: '1px solid #DAA520'
      },
      tags: ['Premium', 'Metallic'],
      preset: {
        fontFamily: 'Georgia',
        fontSize: 32,
        fontWeight: 'bold',
        textGradient: {
          type: 'linear' as const,
          angle: 0,
          colors: ['#ffd700', '#ffed4e', '#fff200']
        },
        textShadow: { offsetX: 1, offsetY: 1, blur: 3, color: 'rgba(255,215,0,0.6)' },
        textOutline: { width: 1, color: '#DAA520' },
        letterSpacing: 1,
      }
    },
    {
      name: 'Chrome Steel',
      description: 'Metallic chrome finish',
      icon: <CircleDot className="h-4 w-4" />,
      preview: {
        background: 'linear-gradient(90deg, #bdc3c7, #2c3e50)',
        color: 'transparent',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        borderRadius: '6px',
        padding: '8px 12px',
        textShadow: '1px 1px 2px rgba(44,62,80,0.7)',
        border: '1px solid #95a5a6'
      },
      tags: ['Metallic', 'Modern'],
      preset: {
        fontFamily: 'Arial Black',
        fontSize: 30,
        fontWeight: 'bold',
        textGradient: {
          type: 'linear' as const,
          angle: 90,
          colors: ['#bdc3c7', '#2c3e50']
        },
        textShadow: { offsetX: 1, offsetY: 1, blur: 2, color: 'rgba(44,62,80,0.7)' },
        textOutline: { width: 1, color: '#95a5a6' },
      }
    },
    {
      name: '80s Retro',
      description: 'Vintage neon style',
      icon: <Sparkles className="h-4 w-4" />,
      preview: {
        backgroundColor: '#1a0033',
        color: '#ff0080',
        borderRadius: '6px',
        padding: '8px 12px',
        textShadow: '0 0 12px #00ffff',
        border: '2px solid #ff00ff'
      },
      tags: ['Retro', 'Neon'],
      preset: {
        fontFamily: 'Arial Black',
        fontSize: 34,
        fontWeight: 'bold',
        fill: '#ff0080',
        textShadow: { offsetX: 0, offsetY: 0, blur: 12, color: '#00ffff' },
        textOutline: { width: 2, color: '#ff00ff' },
        backgroundColor: '#1a0033',
        padding: 18,
        letterSpacing: 2,
        textTransform: 'uppercase' as const,
      }
    },
    {
      name: 'Sunrise Bloom',
      description: 'Warm morning colors',
      icon: <Sunrise className="h-4 w-4" />,
      preview: {
        background: 'linear-gradient(135deg, #ff9a9e, #fecfef, #fecfef)',
        color: 'transparent',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        borderRadius: '6px',
        padding: '8px 12px',
        textShadow: '0 2px 4px rgba(255,154,158,0.3)'
      },
      tags: ['Soft', 'Gradient'],
      preset: {
        fontFamily: 'Georgia',
        fontSize: 28,
        fontWeight: '600',
        textGradient: {
          type: 'linear' as const,
          angle: 135,
          colors: ['#ff9a9e', '#fecfef', '#fecfef']
        },
        textShadow: { offsetX: 0, offsetY: 2, blur: 4, color: 'rgba(255,154,158,0.3)' },
        letterSpacing: 0.5,
      }
    },
    {
      name: 'Vintage Badge',
      description: 'Classic emblem style',
      icon: <Palette className="h-4 w-4" />,
      preview: {
        backgroundColor: '#F5DEB3',
        color: '#8B4513',
        borderRadius: '20px',
        padding: '8px 16px',
        textShadow: '1px 1px 2px rgba(139,69,19,0.6)',
        border: '1px solid #654321'
      },
      tags: ['Classic', 'Badge'],
      preset: {
        fontFamily: 'Georgia',
        fontSize: 24,
        fontWeight: 'bold',
        fill: '#8B4513',
        textShadow: { offsetX: 1, offsetY: 1, blur: 2, color: 'rgba(139,69,19,0.6)' },
        backgroundColor: '#F5DEB3',
        padding: 16,
        borderRadius: 20,
        textOutline: { width: 1, color: '#654321' },
        letterSpacing: 1,
        textTransform: 'uppercase' as const,
      }
    },
    {
      name: 'Glass Effect',
      description: 'Frosted glass look',
      icon: <CircleDot className="h-4 w-4" />,
      preview: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        color: 'rgba(255,255,255,0.9)',
        borderRadius: '12px',
        padding: '8px 12px',
        textShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: '1px solid rgba(255,255,255,0.3)',
        backdropFilter: 'blur(10px)'
      },
      tags: ['Glass', 'Modern'],
      preset: {
        fontFamily: 'Arial',
        fontSize: 28,
        fontWeight: '300',
        fill: 'rgba(255,255,255,0.9)',
        textOutline: { width: 1, color: 'rgba(255,255,255,0.3)' },
        textShadow: { offsetX: 0, offsetY: 2, blur: 4, color: 'rgba(0,0,0,0.1)' },
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 16,
        borderRadius: 12,
        letterSpacing: 2,
        textTransform: 'uppercase' as const,
      }
    }
  ];

  const handlePresetClick = (preset: AdvancedTextProperties) => {
    // Use setTimeout to prevent event bubbling issues
    setTimeout(() => {
      onApplyPreset(preset);
    }, 10);
  };

  return (
    <div className="space-y-4 max-w-sm">
      <div className="text-sm font-medium text-gray-700 mb-3">
        Text Effect Presets
      </div>
      
      {/* Preset Grid */}
      <div className="grid gap-3 max-h-96 overflow-y-auto">
        {presets.map((item, index) => (
          <Card
            key={index}
            className="p-3 cursor-pointer hover:shadow-md transition-all duration-200 border hover:border-blue-300"
            onClick={() => handlePresetClick(item.preset)}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100">
                {item.icon}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm text-gray-900 truncate">
                    {item.name}
                  </h4>
                </div>
                
                <p className="text-xs text-gray-500 mb-2">
                  {item.description}
                </p>
                
                {/* Live Preview */}
                <div className="mb-2">
                  <div 
                    className="text-xs font-bold flex items-center justify-center h-8 w-full text-center"
                    style={item.preview}
                  >
                    Sample
                  </div>
                </div>
                
                {/* Tags */}
                <div className="flex gap-1 flex-wrap">
                  {item.tags.map((tag, tagIndex) => (
                    <Badge 
                      key={tagIndex} 
                      variant="secondary" 
                      className="text-xs px-1.5 py-0.5 h-5"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Clear Effects Button */}
      <div className="pt-2 border-t">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handlePresetClick({
              textShadow: undefined,
              textOutline: undefined,
              textGradient: undefined,
              backgroundColor: undefined,
              padding: 0,
              borderRadius: 0
            });
          }}
        >
          Clear All Effects
        </Button>
      </div>
    </div>
  );
};
