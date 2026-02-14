import { useState, useCallback, useRef } from 'react';
import { EditorState, SchematicComponent, Wire, Tool, ComponentType, Point } from '@/types/schematic';
import { getTerminals, snapToGrid } from '@/lib/componentShapes';

let idCounter = 0;
const genId = () => `item_${++idCounter}`;

const initialState: EditorState = {
  components: [],
  wires: [],
  selectedIds: [],
  activeTool: 'select',
  zoom: 1,
  pan: { x: 0, y: 0 },
  gridSize: 20,
  snapToGrid: true,
};

export function useSchematicEditor() {
  const [state, setState] = useState<EditorState>(initialState);
  const wireInProgress = useRef<Point[] | null>(null);

  const setTool = useCallback((tool: Tool) => {
    setState(prev => ({ ...prev, activeTool: tool, selectedIds: [] }));
    wireInProgress.current = null;
  }, []);

  const addComponent = useCallback((type: ComponentType, position: Point) => {
    const snapped = {
      x: snapToGrid(position.x, 20),
      y: snapToGrid(position.y, 20),
    };
    const comp: SchematicComponent = {
      id: genId(),
      type,
      position: snapped,
      rotation: 0,
      label: type.replace(/_/g, ' ').toUpperCase(),
      terminals: getTerminals(type),
      properties: {},
    };
    setState(prev => ({
      ...prev,
      components: [...prev.components, comp],
      selectedIds: [comp.id],
    }));
  }, []);

  const selectComponent = useCallback((id: string | null) => {
    setState(prev => ({
      ...prev,
      selectedIds: id ? [id] : [],
    }));
  }, []);

  const moveComponent = useCallback((id: string, position: Point) => {
    const snapped = {
      x: snapToGrid(position.x, 20),
      y: snapToGrid(position.y, 20),
    };
    setState(prev => ({
      ...prev,
      components: prev.components.map(c =>
        c.id === id ? { ...c, position: snapped } : c
      ),
    }));
  }, []);

  const rotateSelected = useCallback(() => {
    setState(prev => ({
      ...prev,
      components: prev.components.map(c =>
        prev.selectedIds.includes(c.id)
          ? { ...c, rotation: (c.rotation + 90) % 360 }
          : c
      ),
    }));
  }, []);

  const deleteSelected = useCallback(() => {
    setState(prev => ({
      ...prev,
      components: prev.components.filter(c => !prev.selectedIds.includes(c.id)),
      wires: prev.wires.filter(w => !prev.selectedIds.includes(w.id)),
      selectedIds: [],
    }));
  }, []);

  const addWirePoint = useCallback((point: Point) => {
    const snapped = {
      x: snapToGrid(point.x, 20),
      y: snapToGrid(point.y, 20),
    };
    if (!wireInProgress.current) {
      wireInProgress.current = [snapped];
    } else {
      wireInProgress.current = [...wireInProgress.current, snapped];
    }
  }, []);

  const finishWire = useCallback(() => {
    if (wireInProgress.current && wireInProgress.current.length >= 2) {
      const wire: Wire = {
        id: genId(),
        points: [...wireInProgress.current],
      };
      setState(prev => ({
        ...prev,
        wires: [...prev.wires, wire],
      }));
    }
    wireInProgress.current = null;
  }, []);

  const getWireInProgress = useCallback(() => wireInProgress.current, []);

  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({ ...prev, zoom: Math.max(0.25, Math.min(3, zoom)) }));
  }, []);

  const setPan = useCallback((pan: Point) => {
    setState(prev => ({ ...prev, pan }));
  }, []);

  const deleteItem = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      components: prev.components.filter(c => c.id !== id),
      wires: prev.wires.filter(w => w.id !== id),
      selectedIds: prev.selectedIds.filter(s => s !== id),
    }));
  }, []);

  const clearAll = useCallback(() => {
    setState(initialState);
    wireInProgress.current = null;
  }, []);

  return {
    state,
    setTool,
    addComponent,
    selectComponent,
    moveComponent,
    rotateSelected,
    deleteSelected,
    addWirePoint,
    finishWire,
    getWireInProgress,
    setZoom,
    setPan,
    deleteItem,
    clearAll,
  };
}
