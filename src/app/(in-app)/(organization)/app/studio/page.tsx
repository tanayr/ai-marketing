"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Paintbrush, Copy, MessageSquare, Shirt } from 'lucide-react';

// Define studio data - in a real app this might come from an API or database
const studios = [
  {
    id: 'lookr',
    name: 'Lookr Studio',
    description: 'Try on products with AI avatars and see how they look',
    icon: Shirt,
    color: 'from-blue-400 to-indigo-500',
    version: 'v0.1',
    url: '/app/studio/lookr',
    isPremium: false,
    isNew: true
  },
  {
    id: 'retouchr',
    name: 'Retouchr Studio',
    description: 'Edit and enhance product images with AI-powered retouching tools',
    icon: Paintbrush,
    color: 'from-teal-400 to-emerald-500',
    version: 'v0.2.1',
    url: '/app/studio/retouchr',
    isPremium: false,
    isNew: false
  },
  {
    id: 'cloner',
    name: 'Cloner Studio',
    description: 'Generate product variations from your existing products using AI',
    icon: Copy,
    color: 'from-purple-500 to-blue-500',
    version: 'v0.12',
    url: '/app/studio/cloner',
    isPremium: false,
    isNew: false
  },
  {
    id: 'ad-creator',
    name: 'Ad Copy Studio',
    description: 'Create compelling ad copy for your marketing campaigns',
    icon: MessageSquare,
    color: 'from-amber-500 to-pink-500',
    version: 'v0.1',
    url: '/app/ad-creator',
    isPremium: false,
    isNew: false
  }
];

export default function StudiosPage() {
  return (
    <div className="container py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Studios</h1>
          <p className="text-muted-foreground mt-1">
            Creative tools to enhance your marketing presence
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {studios.map((studio) => (
          <Card key={studio.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className="p-2 rounded-md bg-gradient-to-br bg-muted">
                  <studio.icon className="w-5 h-5 text-primary" />
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-transparent bg-clip-text bg-gradient-to-r ${studio.color}`}
                >
                  {studio.version}
                </Badge>
              </div>
              <CardTitle className="mt-3">{studio.name}</CardTitle>
              <CardDescription className="line-clamp-2">
                {studio.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {studio.isNew && (
                  <Badge className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 border-blue-200">
                    New
                  </Badge>
                )}
                {studio.isPremium && (
                  <Badge className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 border-amber-200">
                    Premium
                  </Badge>
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button asChild variant="outline" className="w-full group">
                <Link href={studio.url}>
                  <span className="flex items-center justify-center gap-2">
                    Open Studio
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
