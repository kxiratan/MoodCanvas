import { useState, useCallback, useRef } from 'react';

interface Transform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export const useCanvasTransform = () => {
  const [transform, setTransform] = useState<Transform>({
    scale: 1,
    offsetX: 0,
    offsetY: 0
  });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  const zoomIn = useCallback(() => {
    setTransform(prev => {
      const newScale = Math.min(prev.scale * 1.2, 5);
      const scaleDiff = newScale / prev.scale;
      
      // Get canvas center
      const canvasWidth = window.innerWidth;
      const canvasHeight = window.innerHeight;
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      
      // Adjust offset to zoom towards center
      const newOffsetX = centerX - (centerX - prev.offsetX) * scaleDiff;
      const newOffsetY = centerY - (centerY - prev.offsetY) * scaleDiff;
      
      return {
        scale: newScale,
        offsetX: newOffsetX,
        offsetY: newOffsetY
      };
    });
  }, []);

  const zoomOut = useCallback(() => {
    setTransform(prev => {
      const newScale = Math.max(prev.scale / 1.2, 0.1);
      const scaleDiff = newScale / prev.scale;
      
      // Get canvas center
      const canvasWidth = window.innerWidth;
      const canvasHeight = window.innerHeight;
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      
      // Adjust offset to zoom towards center
      const newOffsetX = centerX - (centerX - prev.offsetX) * scaleDiff;
      const newOffsetY = centerY - (centerY - prev.offsetY) * scaleDiff;
      
      return {
        scale: newScale,
        offsetX: newOffsetX,
        offsetY: newOffsetY
      };
    });
  }, []);

  const resetZoom = useCallback(() => {
    setTransform({
      scale: 1,
      offsetX: 0,
      offsetY: 0
    });
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      
      setTransform(prev => {
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.1, Math.min(5, prev.scale * delta));
        const scaleDiff = newScale / prev.scale;
        
        // Get mouse position relative to canvas
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Adjust offset to zoom towards mouse position
        const newOffsetX = mouseX - (mouseX - prev.offsetX) * scaleDiff;
        const newOffsetY = mouseY - (mouseY - prev.offsetY) * scaleDiff;
        
        return {
          scale: newScale,
          offsetX: newOffsetX,
          offsetY: newOffsetY
        };
      });
    }
  }, []);

  const startPan = useCallback((x: number, y: number) => {
    setIsPanning(true);
    panStartRef.current = { x, y };
  }, []);

  const updatePan = useCallback((x: number, y: number) => {
    if (!isPanning) return;
    
    const dx = x - panStartRef.current.x;
    const dy = y - panStartRef.current.y;
    
    setTransform(prev => ({
      ...prev,
      offsetX: prev.offsetX + dx,
      offsetY: prev.offsetY + dy
    }));
    
    panStartRef.current = { x, y };
  }, [isPanning]);

  const endPan = useCallback(() => {
    setIsPanning(false);
  }, []);

  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    return {
      x: (screenX - transform.offsetX) / transform.scale,
      y: (screenY - transform.offsetY) / transform.scale
    };
  }, [transform]);

  const canvasToScreen = useCallback((canvasX: number, canvasY: number) => {
    return {
      x: canvasX * transform.scale + transform.offsetX,
      y: canvasY * transform.scale + transform.offsetY
    };
  }, [transform]);

  return {
    transform,
    zoomIn,
    zoomOut,
    resetZoom,
    handleWheel,
    startPan,
    updatePan,
    endPan,
    isPanning,
    screenToCanvas,
    canvasToScreen
  };
};