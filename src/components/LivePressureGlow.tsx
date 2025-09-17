import React, { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

interface PressurePoint {
  id: string;
  intensity: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const LivePressureGlow: React.FC<{ points: PressurePoint[] }> = ({ points }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d', { alpha: true });
    if (!context) {
      return;
    }

    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    const parent = canvas.parentElement;
    if (!parent) {
      return;
    }

    const basePoints = points.map((point, index) => ({
      ...point,
      spread: 0.35 + (point.intensity * 0.35),
      offset: index,
    }));

    const resize = () => {
      const { width, height } = parent.getBoundingClientRect();
      if (width === 0 || height === 0) {
        return;
      }

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    resize();

    let animationFrame = 0;

    const drawFrame = (timestamp = 0) => {
      const width = canvas.width;
      const height = canvas.height;
      if (width === 0 || height === 0) {
        return;
      }

      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, width, height);
      context.scale(dpr, dpr);

      const cssWidth = width / dpr;
      const cssHeight = height / dpr;

      const maxRadius = Math.max(cssWidth, cssHeight) * 0.75;

      basePoints.forEach((point) => {
        const fraction = basePoints.length > 0 ? (point.offset + 0.5) / basePoints.length : 0.5;
        const x = cssWidth * clamp(0.15 + fraction * 0.7, 0.1, 0.9);
        const y = cssHeight * 0.55;
        const timeShift = prefersReducedMotion ? 0 : timestamp / 1600 + point.offset * 0.65;
        const pulse = prefersReducedMotion ? 1 : 0.65 + Math.sin(timeShift) * 0.35;
        const intensity = clamp(point.intensity * pulse, 0.15, 1.25);
        const radius = clamp(maxRadius * (0.25 + point.spread * intensity), cssHeight * 0.25, maxRadius);
        const gradient = context.createRadialGradient(x, y, 0, x, y, radius);

        gradient.addColorStop(0, `rgba(255, 255, 255, ${0.12 * intensity})`);
        gradient.addColorStop(0.35, `rgba(255, 154, 57, ${0.22 * intensity})`);
        gradient.addColorStop(0.65, `rgba(255, 84, 16, ${0.16 * intensity})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        context.globalCompositeOperation = 'lighter';
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      });

      context.globalCompositeOperation = 'multiply';
      context.fillStyle = 'rgba(10, 10, 10, 0.12)';
      context.fillRect(0, 0, cssWidth, cssHeight);
      context.globalCompositeOperation = 'source-over';
    };

    const handleResize = () => {
      resize();
      drawFrame();
    };

    window.addEventListener('resize', handleResize);

    if (prefersReducedMotion) {
      drawFrame();
    } else {
      const render = (time: number) => {
        drawFrame(time);
        animationFrame = window.requestAnimationFrame(render);
      };

      animationFrame = window.requestAnimationFrame(render);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [points, prefersReducedMotion]);

  return (
    <div className="pressure-glow" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default LivePressureGlow;
