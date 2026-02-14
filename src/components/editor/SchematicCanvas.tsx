import { useRef, useEffect, useCallback, useState } from 'react';
import { SchematicComponent, Wire, Tool, Point, ComponentType } from '@/types/schematic';
import { drawComponent, getComponentBounds, snapToGrid } from '@/lib/componentShapes';

interface SchematicCanvasProps {
  components: SchematicComponent[];
  wires: Wire[];
  selectedIds: string[];
  activeTool: Tool;
  zoom: number;
  pan: Point;
  placingComponent: ComponentType | null;
  wireInProgress: Point[] | null;
  onCanvasClick: (point: Point) => void;
  onCanvasRightClick: () => void;
  onComponentClick: (id: string) => void;
  onComponentDrag: (id: string, position: Point) => void;
  onWireClick: (id: string) => void;
  onPanChange: (pan: Point) => void;
  onZoomChange: (zoom: number) => void;
}

const COLORS = {
  stroke: '#38bdf8',    // primary blue
  fill: '#1e293b',      // card bg
  selection: '#34d399', // selection green
  wire: '#eab308',      // wire yellow
  grid: '#2d3748',
  gridMajor: '#374151',
  bg: '#1a2332',
  terminal: '#ef4444',
};

export function SchematicCanvas({
  components,
  wires,
  selectedIds,
  activeTool,
  zoom,
  pan,
  placingComponent,
  wireInProgress,
  onCanvasClick,
  onCanvasRightClick,
  onComponentClick,
  onComponentDrag,
  onWireClick,
  onPanChange,
  onZoomChange,
}: SchematicCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<{ id: string; offset: Point } | null>(null);
  const [panning, setPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });

  const screenToWorld = useCallback(
    (sx: number, sy: number): Point => ({
      x: (sx - pan.x) / zoom,
      y: (sy - pan.y) / zoom,
    }),
    [pan, zoom]
  );

  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const gridSize = 20;
      const majorGridSize = gridSize * 5;

      const startX = Math.floor(-pan.x / zoom / gridSize) * gridSize;
      const startY = Math.floor(-pan.y / zoom / gridSize) * gridSize;
      const endX = startX + width / zoom + gridSize * 2;
      const endY = startY + height / zoom + gridSize * 2;

      // Minor grid
      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let x = startX; x < endX; x += gridSize) {
        if (x % majorGridSize === 0) continue;
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }
      for (let y = startY; y < endY; y += gridSize) {
        if (y % majorGridSize === 0) continue;
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }
      ctx.stroke();

      // Major grid
      ctx.strokeStyle = COLORS.gridMajor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = startX; x < endX; x += majorGridSize) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }
      for (let y = startY; y < endY; y += majorGridSize) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }
      ctx.stroke();
    },
    [pan, zoom]
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d')!;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Apply transform
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Grid
    drawGrid(ctx, rect.width, rect.height);

    // Wires
    wires.forEach(wire => {
      const isSelected = selectedIds.includes(wire.id);
      ctx.strokeStyle = isSelected ? COLORS.selection : COLORS.wire;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.beginPath();
      wire.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      // Wire points
      wire.points.forEach(p => {
        ctx.fillStyle = COLORS.wire;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // Wire in progress
    if (wireInProgress && wireInProgress.length > 0) {
      ctx.strokeStyle = COLORS.wire;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      wireInProgress.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      // Line to current mouse position
      const worldMouse = screenToWorld(mousePos.x, mousePos.y);
      const snapped = {
        x: snapToGrid(worldMouse.x, 20),
        y: snapToGrid(worldMouse.y, 20),
      };
      ctx.lineTo(snapped.x, snapped.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Components
    components.forEach(comp => {
      const isSelected = selectedIds.includes(comp.id);
      drawComponent(
        ctx,
        comp.type,
        comp.position.x,
        comp.position.y,
        comp.rotation,
        isSelected,
        COLORS.stroke,
        COLORS.fill,
        COLORS.selection
      );

      // Label
      ctx.save();
      ctx.translate(comp.position.x, comp.position.y);
      ctx.font = '10px "JetBrains Mono"';
      ctx.fillStyle = isSelected ? COLORS.selection : '#94a3b8';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(comp.label, 25, 0);
      ctx.restore();
    });

    // Placing preview
    if (placingComponent) {
      const worldMouse = screenToWorld(mousePos.x, mousePos.y);
      const snapped = {
        x: snapToGrid(worldMouse.x, 20),
        y: snapToGrid(worldMouse.y, 20),
      };
      ctx.globalAlpha = 0.5;
      drawComponent(
        ctx,
        placingComponent,
        snapped.x,
        snapped.y,
        0,
        false,
        COLORS.stroke,
        COLORS.fill,
        COLORS.selection
      );
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    // Status bar overlay
    const worldMouse = screenToWorld(mousePos.x, mousePos.y);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, rect.height - 24, rect.width, 24);
    ctx.font = '11px "JetBrains Mono"';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `X: ${Math.round(worldMouse.x)}  Y: ${Math.round(worldMouse.y)}  |  Components: ${components.length}  Wires: ${wires.length}  |  Tool: ${activeTool.toUpperCase()}`,
      10,
      rect.height - 12
    );
  }, [components, wires, selectedIds, pan, zoom, mousePos, placingComponent, wireInProgress, activeTool, drawGrid, screenToWorld]);

  useEffect(() => {
    const animFrame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrame);
  }, [render]);

  const findComponentAt = useCallback(
    (worldPoint: Point): SchematicComponent | undefined => {
      // Reverse order (top-most first)
      for (let i = components.length - 1; i >= 0; i--) {
        const comp = components[i];
        const bounds = getComponentBounds(comp.type);
        if (
          worldPoint.x >= comp.position.x - bounds.width &&
          worldPoint.x <= comp.position.x + bounds.width &&
          worldPoint.y >= comp.position.y - bounds.height / 2 &&
          worldPoint.y <= comp.position.y + bounds.height / 2
        ) {
          return comp;
        }
      }
      return undefined;
    },
    [components]
  );

  const findWireAt = useCallback(
    (worldPoint: Point): Wire | undefined => {
      for (const wire of wires) {
        for (let i = 0; i < wire.points.length - 1; i++) {
          const a = wire.points[i];
          const b = wire.points[i + 1];
          const dist = distToSegment(worldPoint, a, b);
          if (dist < 8) return wire;
        }
      }
      return undefined;
    },
    [wires]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        setPanning(true);
        setPanStart({ x: sx - pan.x, y: sy - pan.y });
        return;
      }

      if (e.button === 2) {
        e.preventDefault();
        onCanvasRightClick();
        return;
      }

      const world = screenToWorld(sx, sy);

      if (activeTool === 'select' || activeTool === 'move') {
        const comp = findComponentAt(world);
        if (comp) {
          onComponentClick(comp.id);
          if (activeTool === 'move' || activeTool === 'select') {
            setDragging({
              id: comp.id,
              offset: { x: world.x - comp.position.x, y: world.y - comp.position.y },
            });
          }
          return;
        }
        const wire = findWireAt(world);
        if (wire) {
          onWireClick(wire.id);
          return;
        }
        onComponentClick('');
      }

      if (activeTool === 'delete') {
        const comp = findComponentAt(world);
        if (comp) {
          onComponentClick(comp.id);
          return;
        }
        const wire = findWireAt(world);
        if (wire) {
          onWireClick(wire.id);
          return;
        }
      }
    },
    [activeTool, pan, zoom, findComponentAt, findWireAt, onComponentClick, onWireClick, onCanvasRightClick, screenToWorld]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      setMousePos({ x: sx, y: sy });

      if (panning) {
        onPanChange({ x: sx - panStart.x, y: sy - panStart.y });
        return;
      }

      if (dragging) {
        const world = screenToWorld(sx, sy);
        onComponentDrag(dragging.id, {
          x: world.x - dragging.offset.x,
          y: world.y - dragging.offset.y,
        });
      }
    },
    [panning, panStart, dragging, screenToWorld, onPanChange, onComponentDrag]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setPanning(false);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const world = screenToWorld(sx, sy);

      if (placingComponent || activeTool === 'wire') {
        onCanvasClick(world);
      }
    },
    [placingComponent, activeTool, screenToWorld, onCanvasClick]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.25, Math.min(3, zoom * delta));

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      // Zoom toward cursor
      const newPanX = sx - (sx - pan.x) * (newZoom / zoom);
      const newPanY = sy - (sy - pan.y) * (newZoom / zoom);

      onZoomChange(newZoom);
      onPanChange({ x: newPanX, y: newPanY });
    },
    [zoom, pan, onZoomChange, onPanChange]
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden cursor-crosshair"
      onContextMenu={handleContextMenu}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
        className="absolute inset-0"
      />
    </div>
  );
}

// Utility: distance from point to line segment
function distToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}
