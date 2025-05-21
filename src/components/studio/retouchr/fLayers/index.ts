"use client";

// Export main UI components
export { LayerPanel } from './ui/LayerPanel';
export { LayerItem } from './ui/LayerItem';
export { LayerGroup } from './ui/LayerGroup';
export { LayerControls } from './ui/LayerControls';
export { EditableName } from './ui/EditableName';

// Export hooks for custom implementations
export { useLayersState } from './hooks/useLayersState';
export { useFabricSync } from './hooks/useFabricSync';
export { useLayerNames } from './hooks/useLayerNames';

// Export types and utilities for extension
export * from './core/types';
export * from './core/utils';
export * from './storage/layerPersistence';
