/**
 * hooks/engine/index.js
 * Barrel export for all engine hooks.
 * Import from '@/hooks/engine' instead of individual files.
 */

export { useEngineState } from './useEngineState';
export { useEngineRenderer } from './useEngineRenderer';
export { useEngineInteraction } from './useEngineInteraction';
export { useEngineViewport } from './useEngineViewport';

// Interaction sub-hooks (for fine-grained use if needed)
export { useKeyboard } from './interaction/useKeyboard';
export { useSelection } from './interaction/useSelection';
export { useDrag } from './interaction/useDrag';
export { useResize } from './interaction/useResize';
export { useArrowConnect } from './interaction/useArrowConnect';
