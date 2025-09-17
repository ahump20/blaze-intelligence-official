import React, { useEffect } from 'react';
import './App.css';
import './styles/visualFx.css';
import BlazeIntelligenceDashboard from './components/BlazeIntelligenceDashboard';
import { initVisualFx } from './effects/initVisualFx';

const App: React.FC = () => {
  useEffect(() => {
    let active = true;

    initVisualFx()
      .then((snapshot) => {
        if (!active || typeof document === 'undefined') {
          return;
        }

        const root = document.documentElement;
        root.dataset.fxTier = snapshot.tier;
        root.dataset.fxReducedMotion = String(snapshot.reducedMotion);
        root.dataset.fxWebgpu = String(snapshot.webgpu);
        root.dataset.fxWebgl2 = String(snapshot.webgl2);
      })
      .catch((error) => {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Visual FX initialization failed', error);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="App">
      <svg className="fx-defs" aria-hidden="true">
        <defs>
          <filter id="specular-card-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
            <feSpecularLighting
              in="blur"
              surfaceScale={4}
              specularConstant={0.4}
              specularExponent={20}
              lightingColor="#ffffff"
              result="spec"
            >
              <fePointLight x={-120} y={-180} z={220} />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceAlpha" operator="in" result="litSpec" />
            <feMerge>
              <feMergeNode in="litSpec" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
      <BlazeIntelligenceDashboard />
    </div>
  );
};

export default App;
