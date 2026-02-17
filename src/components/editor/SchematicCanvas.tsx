import { useRef, useEffect, useCallback, useState } from 'react';
import { SchematicComponent, Wire, Tool, Point, ComponentType } from '@/types/schematic';
import { drawComponent, getComponentBounds, snapToGrid, getTerminals } from '@/lib/componentShapes';
import { isToggleable } from '@/lib/simulationEngine';

interface SchematicCanvasProps {
  components: SchematicComponent[];
  wires: Wire[];
  selectedIds: string[];
  activeTool: Tool;
  zoom: number;
  pan: Point;
  placingComponent: ComponentType | null;
  wireInProgress: Point[] | null;
  simulating: boolean;
  onCanvasClick: (point: Point) => void;
  onCanvasRightClick: () => void;
  onComponentClick: (id: string) => void;
  onComponentDrag: (id: string, position: Point) => void;
  onWireClick: (id: string) => void;
  onPanChange: (pan: Point) => void;
  onZoomChange: (zoom: number) => void;
  onSimComponentClick?: (id: string) => void;
}

const COLORS = {
  stroke: '#38bdf8',
  fill: '#1e293b',
  selection: '#34d399',
  wire: '#eab308',
  wireEnergized: '#f97316',
  grid: '#2d3748',
  gridMajor: '#374151',
  bg: '#1a2332',
  simOn: '#22c55e',
  simOff: '#64748b',
  terminal: '#94a3b8',
  terminalHover: '#38bdf8',
};

const SchematicCanvas = ({
  components, wires, selectedIds, activeTool, zoom, pan,
  placingComponent, wireInProgress, simulating,
  onCanvasClick, onCanvasRightClick, onComponentClick, onComponentDrag,
  onWireClick, onPanChange, onZoomChange, onSimComponentClick,
}: SchematicCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<{ id: string; offset: Point } | null>(null);
  const [panning, setPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });
  const didDrag = useRef(false);

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

  // Draw terminal dots on components
  const drawTerminals = useCallback(
    (ctx: CanvasRenderingContext2D, comp: SchematicComponent) => {
      const rad = (comp.rotation * Math.PI) / 180;
      comp.terminals.forEach(t => {
        const rx = t.position.x * Math.cos(rad) - t.position.y * Math.sin(rad);
        const ry = t.position.x * Math.sin(rad) + t.position.y * Math.cos(rad);
        const absX = comp.position.x + rx;
        const absY = comp.position.y + ry;

        ctx.fillStyle = COLORS.terminal;
        ctx.beginPath();
        ctx.arc(absX, absY, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    },
    []
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

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    drawGrid(ctx, rect.width, rect.height);

    // Wires
    wires.forEach(wire => {
      const isSelected = selectedIds.includes(wire.id);
      const isEnergized = wire.energized && simulating;
      ctx.strokeStyle = isSelected ? COLORS.selection : (isEnergized ? COLORS.wireEnergized : COLORS.wire);
      ctx.lineWidth = isSelected ? 3 : (isEnergized ? 3 : 2);

      if (isEnergized) {
        ctx.shadowColor = COLORS.wireEnergized;
        ctx.shadowBlur = 8;
      }

      ctx.beginPath();
      wire.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Junction dots at wire points
      wire.points.forEach(p => {
        ctx.fillStyle = isEnergized ? COLORS.wireEnergized : COLORS.wire;
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
      const worldMouse = screenToWorld(mousePos.x, mousePos.y);
      const snapped = { x: snapToGrid(worldMouse.x, 20), y: snapToGrid(worldMouse.y, 20) };
      ctx.lineTo(snapped.x, snapped.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Components
    components.forEach(comp => {
      const isSelected = selectedIds.includes(comp.id);
      const compStroke = simulating && comp.simState === 'on' ? COLORS.simOn : COLORS.stroke;

      drawComponent(
        ctx, comp.type, comp.position.x, comp.position.y,
        comp.rotation, isSelected,
        compStroke, COLORS.fill, COLORS.selection,
        comp.simState
      );

      // Draw terminal connection dots
      if (!simulating) {
        drawTerminals(ctx, comp);
      }

      // Toggleable indicator during simulation
      if (simulating && isToggleable(comp.type)) {
        ctx.save();
        ctx.translate(comp.position.x, comp.position.y);

        const isClosed = comp.simState === 'on';
        ctx.fillStyle = isClosed ? '#22c55e' : '#ef4444';
        ctx.beginPath();
        ctx.arc(22, -22, 6, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing ring for clickable hint
        ctx.strokeStyle = '#ffffff66';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(22, -22, 9, 0, Math.PI * 2);
        ctx.stroke();

        // "Click" text hint
        ctx.font = '8px JetBrains Mono';
        ctx.fillStyle = '#ffffffaa';
        ctx.textAlign = 'center';
        ctx.fillText('▶', 22, -10);

        ctx.restore();
      }

      // Label
      ctx.save();
      ctx.translate(comp.position.x, comp.position.y);
      ctx.font = '10px "JetBrains Mono"';
      ctx.fillStyle = isSelected ? COLORS.selection : '#94a3b8';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(comp.label, 30, 0);
      ctx.restore();
    });

    // Placing preview
    if (placingComponent && !simulating) {
      const worldMouse = screenToWorld(mousePos.x, mousePos.y);
      const snapped = { x: snapToGrid(worldMouse.x, 20), y: snapToGrid(worldMouse.y, 20) };
      ctx.globalAlpha = 0.5;
      drawComponent(ctx, placingComponent, snapped.x, snapped.y, 0, false, COLORS.stroke, COLORS.fill, COLORS.selection);
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    // Status bar
    const worldMouse = screenToWorld(mousePos.x, mousePos.y);
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, rect.height - 28, rect.width, 28);
    ctx.font = '11px "JetBrains Mono"';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const toolNames: Record<string, string> = {
      select: 'SELECIONAR', move: 'MOVER', wire: 'FIO', delete: 'APAGAR',
      text: 'TEXTO', zoom_in: 'ZOOM+', zoom_out: 'ZOOM-',
    };

    const statusText = simulating
      ? `X: ${Math.round(worldMouse.x)}  Y: ${Math.round(worldMouse.y)}  |  Clique nos contatos/chaves para alternar`
      : `X: ${Math.round(worldMouse.x)}  Y: ${Math.round(worldMouse.y)}  |  Componentes: ${components.length}  Fios: ${wires.length}  |  Ferramenta: ${toolNames[activeTool] || activeTool.toUpperCase()}`;

    ctx.fillText(statusText, 10, rect.height - 14);

    if (simulating) {
      ctx.fillStyle = '#22c55e';
      ctx.textAlign = 'right';
      ctx.fillText('● SIMULAÇÃO ATIVA', rect.width - 10, rect.height - 14);
    }
  }, [components, wires, selectedIds, pan, zoom, mousePos, placingComponent, wireInProgress, activeTool, simulating, drawGrid, screenToWorld, drawTerminals]);

  useEffect(() => {
    const animFrame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrame);
  }, [render]);

  const findComponentAt = useCallback(
    (worldPoint: Point): SchematicComponent | undefined => {
      // Use larger hit area during simulation for easier clicking
      const extraPadding = simulating ? 20 : 0;
      for (let i = components.length - 1; i >= 0; i--) {
        const comp = components[i];
        const bounds = getComponentBounds(comp.type);
        if (
          worldPoint.x >= comp.position.x - bounds.width - extraPadding &&
          worldPoint.x <= comp.position.x + bounds.width + extraPadding &&
          worldPoint.y >= comp.position.y - bounds.height / 2 - extraPadding &&
          worldPoint.y <= comp.position.y + bounds.height / 2 + extraPadding
        ) return comp;
      }
      return undefined;
    },
    [components, simulating]
  );

  const findWireAt = useCallback(
    (worldPoint: Point): Wire | undefined => {
      for (const wire of wires) {
        for (let i = 0; i < wire.points.length - 1; i++) {
          const a = wire.points[i];
          const b = wire.points[i + 1];
          if (distToSegment(worldPoint, a, b) < 10) return wire;
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
      didDrag.current = false;

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

      // During simulation, clicking toggles switches
      if (simulating && e.button === 0) {
        const world = screenToWorld(sx, sy);
        const comp = findComponentAt(world);
        if (comp && isToggleable(comp.type) && onSimComponentClick) {
          console.log(`[SIM] Toggling: ${comp.label} (${comp.type}) id=${comp.id}`);
          onSimComponentClick(comp.id);
        } else if (comp) {
          console.log(`[SIM] Clicked non-toggleable: ${comp.label} (${comp.type})`);
        } else {
          console.log(`[SIM] No component at world (${Math.round(world.x)}, ${Math.round(world.y)})`);
        }
        return;
      }

      const world = screenToWorld(sx, sy);

      if (placingComponent) {
        onCanvasClick(world);
        return;
      }

      if (activeTool === 'wire') {
        onCanvasClick(world);
        return;
      }

      if (activeTool === 'select' || activeTool === 'move') {
        const comp = findComponentAt(world);
        if (comp) {
          onComponentClick(comp.id);
          setDragging({ id: comp.id, offset: { x: world.x - comp.position.x, y: world.y - comp.position.y } });
          return;
        }
        const wire = findWireAt(world);
        if (wire) { onWireClick(wire.id); return; }
        onComponentClick('');
      }

      if (activeTool === 'delete') {
        const comp = findComponentAt(world);
        if (comp) { onComponentClick(comp.id); return; }
        const wire = findWireAt(world);
        if (wire) { onWireClick(wire.id); return; }
      }
    },
    [activeTool, pan, zoom, findComponentAt, findWireAt, onComponentClick, onWireClick, onCanvasRightClick, screenToWorld, placingComponent, onCanvasClick, simulating, onSimComponentClick]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      setMousePos({ x: sx, y: sy });
      if (panning) { onPanChange({ x: sx - panStart.x, y: sy - panStart.y }); return; }
      if (dragging) {
        didDrag.current = true;
        const world = screenToWorld(sx, sy);
        onComponentDrag(dragging.id, { x: world.x - dragging.offset.x, y: world.y - dragging.offset.y });
      }
    },
    [panning, panStart, dragging, screenToWorld, onPanChange, onComponentDrag]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setPanning(false);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.25, Math.min(3, zoom * delta));
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      onZoomChange(newZoom);
      onPanChange({ x: sx - (sx - pan.x) * (newZoom / zoom), y: sy - (sy - pan.y) * (newZoom / zoom) });
    },
    [zoom, pan, onZoomChange, onPanChange]
  );

  const cursorClass = simulating ? 'cursor-pointer' :
    (placingComponent ? 'cursor-cell' :
    (activeTool === 'wire' ? 'cursor-crosshair' :
    (activeTool === 'delete' ? 'cursor-not-allowed' :
    (activeTool === 'move' ? 'cursor-move' : 'cursor-default'))));

  return (
    <div ref={containerRef} className={`flex-1 relative overflow-hidden ${cursorClass}`} onContextMenu={(e) => e.preventDefault()}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="absolute inset-0"
      />
    </div>
  );
};

export { SchematicCanvas };

function distToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}
