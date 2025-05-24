/**
 * Context Detection System
 * Detects current app context and available tools
 */

import { ContextDetectionResult } from '../types/global';

export class ContextDetector {
  private static instance: ContextDetector;
  private routeMatchers: Map<string, (route: string) => boolean> = new Map();

  static getInstance(): ContextDetector {
    if (!ContextDetector.instance) {
      ContextDetector.instance = new ContextDetector();
    }
    return ContextDetector.instance;
  }

  /**
   * Register a route matcher for a provider
   */
  registerProvider(providerId: string, matcher: (route: string) => boolean): void {
    this.routeMatchers.set(providerId, matcher);
  }

  /**
   * Detect current context based on route
   */
  detectContext(route: string): ContextDetectionResult {
    // Check each registered provider
    for (const [providerId, matcher] of this.routeMatchers.entries()) {
      if (matcher(route)) {
        return {
          provider: providerId,
          context: this.extractContextFromRoute(route, providerId),
          availableTools: [] // Will be populated by provider
        };
      }
    }

    return {
      provider: null,
      context: {},
      availableTools: []
    };
  }

  /**
   * Extract context data from route
   */
  private extractContextFromRoute(route: string, providerId: string): Record<string, any> {
    const context: Record<string, any> = { route };

    if (providerId === 'retouchr') {
      // Extract design ID from Retouchr routes
      const match = route.match(/\/app\/studio\/retouchr\?id=([^&]+)/);
      if (match) {
        context.designId = match[1];
      }
    }

    // Add more provider-specific context extraction here

    return context;
  }

  /**
   * Check if a route matches any provider
   */
  hasProvider(route: string): boolean {
    return this.detectContext(route).provider !== null;
  }

  /**
   * Get all registered provider IDs
   */
  getProviderIds(): string[] {
    return Array.from(this.routeMatchers.keys());
  }
}

// Built-in route matchers
export const routeMatchers = {
  retouchr: (route: string) => route.includes('/app/studio/retouchr'),
  // Add more matchers as new studios are added
  // sketch: (route: string) => route.includes('/app/studio/sketch'),
  // figma: (route: string) => route.includes('/app/studio/figma'),
};

// Initialize with default providers
const detector = ContextDetector.getInstance();
Object.entries(routeMatchers).forEach(([providerId, matcher]) => {
  detector.registerProvider(providerId, matcher);
});
