export type FxTier = 'base' | 'webgl2' | 'webgpu';

export interface FxCapabilitySnapshot {
  tier: FxTier;
  webgpu: boolean;
  webgl2: boolean;
  reducedMotion: boolean;
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export async function initVisualFx(): Promise<FxCapabilitySnapshot> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { tier: 'base', webgpu: false, webgl2: false, reducedMotion: false };
  }

  const reducedMotion = window.matchMedia?.(REDUCED_MOTION_QUERY).matches ?? false;
  if (reducedMotion) {
    return { tier: 'base', webgpu: false, webgl2: false, reducedMotion };
  }

  const webgpu = typeof navigator !== 'undefined' && 'gpu' in navigator;
  const webgl2 = (() => {
    try {
      const canvas = document.createElement('canvas');
      return !!canvas.getContext('webgl2');
    } catch (error) {
      console.warn('WebGL2 capability check failed', error);
      return false;
    }
  })();

  if (webgpu) {
    try {
      const module = await import('./webgpuEffects');
      if (typeof module.initWebGpuEffects === 'function') {
        module.initWebGpuEffects();
      }
      return { tier: 'webgpu', webgpu: true, webgl2, reducedMotion };
    } catch (error) {
      console.warn('WebGPU enhancement failed to load', error);
    }
  }

  if (webgl2) {
    try {
      const module = await import('./webgl2Effects');
      if (typeof module.initWebGl2Effects === 'function') {
        module.initWebGl2Effects();
      }
      return { tier: 'webgl2', webgpu, webgl2: true, reducedMotion };
    } catch (error) {
      console.warn('WebGL2 enhancement failed to load', error);
    }
  }

  return { tier: 'base', webgpu, webgl2, reducedMotion };
}
