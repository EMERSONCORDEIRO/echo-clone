import { useState, useCallback, useRef, useEffect } from 'react';
import { EditorState, SchematicComponent, Wire, Tool, ComponentType, Point, HistoryEntry } from '@/types/schematic';
import { getTerminals, snapToGrid } from '@/lib/componentShapes';
import { componentLabelsMap } from '@/lib/componentCategories';
import { SimState, createInitialSimState, toggleSwitch, runSimulation, isToggleable } from '@/lib/simulationEngine';

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
  simulating: false,
  undoStack: [],
  redoStack: [],
};

export function useSchematicEditor() {
  const [state, setState] = useState<EditorState>(initialState);
  const wireInProgress = useRef<Point[] | null>(null);
  const simStateRef = useRef<SimState | null>(null);

  const pushUndo = useCallback(() => {
    setState(prev => ({
      ...prev,
      undoStack: [...prev.undoStack.slice(-50), { components: prev.components, wires: prev.wires }],
      redoStack: [],
    }));
  }, []);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.undoStack.length === 0) return prev;
      const last = prev.undoStack[prev.undoStack.length - 1];
      return {
        ...prev,
        components: last.components,
        wires: last.wires,
        undoStack: prev.undoStack.slice(0, -1),
        redoStack: [...prev.redoStack, { components: prev.components, wires: prev.wires }],
        selectedIds: [],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.redoStack.length === 0) return prev;
      const last = prev.redoStack[prev.redoStack.length - 1];
      return {
        ...prev,
        components: last.components,
        wires: last.wires,
        redoStack: prev.redoStack.slice(0, -1),
        undoStack: [...prev.undoStack, { components: prev.components, wires: prev.wires }],
        selectedIds: [],
      };
    });
  }, []);

  const setTool = useCallback((tool: Tool) => {
    setState(prev => ({ ...prev, activeTool: tool, selectedIds: [] }));
    wireInProgress.current = null;
  }, []);

  const addComponent = useCallback((type: ComponentType, position: Point) => {
    pushUndo();
    const snapped = {
      x: snapToGrid(position.x, 20),
      y: snapToGrid(position.y, 20),
    };
    const label = componentLabelsMap[type] || type.replace(/_/g, ' ').toUpperCase();
    const comp: SchematicComponent = {
      id: genId(),
      type,
      position: snapped,
      rotation: 0,
      label,
      terminals: getTerminals(type),
      properties: {},
    };
    setState(prev => ({
      ...prev,
      components: [...prev.components, comp],
      selectedIds: [comp.id],
    }));
  }, [pushUndo]);

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
    pushUndo();
    setState(prev => ({
      ...prev,
      components: prev.components.map(c =>
        prev.selectedIds.includes(c.id)
          ? { ...c, rotation: (c.rotation + 90) % 360 }
          : c
      ),
    }));
  }, [pushUndo]);

  const deleteSelected = useCallback(() => {
    pushUndo();
    setState(prev => ({
      ...prev,
      components: prev.components.filter(c => !prev.selectedIds.includes(c.id)),
      wires: prev.wires.filter(w => !prev.selectedIds.includes(w.id)),
      selectedIds: [],
    }));
  }, [pushUndo]);

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
      pushUndo();
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
  }, [pushUndo]);

  const getWireInProgress = useCallback(() => wireInProgress.current, []);

  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({ ...prev, zoom: Math.max(0.25, Math.min(3, zoom)) }));
  }, []);

  const setPan = useCallback((pan: Point) => {
    setState(prev => ({ ...prev, pan }));
  }, []);

  const deleteItem = useCallback((id: string) => {
    pushUndo();
    setState(prev => ({
      ...prev,
      components: prev.components.filter(c => c.id !== id),
      wires: prev.wires.filter(w => w.id !== id),
      selectedIds: prev.selectedIds.filter(s => s !== id),
    }));
  }, [pushUndo]);

  const clearAll = useCallback(() => {
    pushUndo();
    setState(prev => ({ ...initialState, undoStack: prev.undoStack, redoStack: prev.redoStack }));
    wireInProgress.current = null;
    simStateRef.current = null;
  }, [pushUndo]);

  // === SIMULATION ===
  const toggleSimulation = useCallback(() => {
    setState(prev => {
      if (!prev.simulating) {
        // Starting simulation
        const simState = createInitialSimState(prev.components);
        const result = runSimulation(prev.components, prev.wires, simState);
        simStateRef.current = result;
        
        return {
          ...prev,
          simulating: true,
          components: prev.components.map(c => ({
            ...c,
            simState: result.componentStates.get(c.id) || 'off',
          })),
          wires: prev.wires.map(w => ({
            ...w,
            energized: result.wireEnergized.get(w.id) || false,
          })),
        };
      } else {
        // Stopping simulation
        simStateRef.current = null;
        return {
          ...prev,
          simulating: false,
          components: prev.components.map(c => ({ ...c, simState: undefined })),
          wires: prev.wires.map(w => ({ ...w, energized: false })),
        };
      }
    });
  }, []);

  const handleSimClick = useCallback((componentId: string) => {
    if (!simStateRef.current) {
      console.log('[SIM] No sim state ref');
      return;
    }
    
    const comp = state.components.find(c => c.id === componentId);
    if (!comp || !isToggleable(comp.type)) {
      console.log('[SIM] Component not found or not toggleable:', componentId);
      return;
    }

    const prevClosed = simStateRef.current.switchStates.get(componentId);
    const newSimState = toggleSwitch(simStateRef.current, componentId);
    const result = runSimulation(state.components, state.wires, newSimState);
    simStateRef.current = result;

    console.log(`[SIM] ${comp.label}: ${prevClosed ? 'FECHADO→ABERTO' : 'ABERTO→FECHADO'}`);
    
    // Log energized loads
    state.components.forEach(c => {
      const newState = result.componentStates.get(c.id);
      if (newState === 'on' && c.type !== 'fonte_ac' && c.type !== 'fonte_dc' && 
          c.type !== 'fase_l1' && c.type !== 'fase_l2' && c.type !== 'fase_l3' && 
          c.type !== 'neutro' && c.type !== 'terra') {
        console.log(`[SIM]   ✓ ${c.label} (${c.type}) = LIGADO`);
      }
    });

    setState(prev => ({
      ...prev,
      components: prev.components.map(c => ({
        ...c,
        simState: result.componentStates.get(c.id) || 'off',
      })),
      wires: prev.wires.map(w => ({
        ...w,
        energized: result.wireEnergized.get(w.id) || false,
      })),
    }));
  }, [state.components, state.wires]);

  const updateComponentLabel = useCallback((id: string, label: string) => {
    pushUndo();
    setState(prev => ({
      ...prev,
      components: prev.components.map(c =>
        c.id === id ? { ...c, label } : c
      ),
    }));
  }, [pushUndo]);

  const duplicateSelected = useCallback(() => {
    pushUndo();
    setState(prev => {
      const newComps = prev.components
        .filter(c => prev.selectedIds.includes(c.id))
        .map(c => ({
          ...c,
          id: genId(),
          position: { x: c.position.x + 40, y: c.position.y + 40 },
          terminals: c.terminals.map(t => ({ ...t, connected: false })),
        }));
      return {
        ...prev,
        components: [...prev.components, ...newComps],
        selectedIds: newComps.map(c => c.id),
      };
    });
  }, [pushUndo]);

  const saveProject = useCallback(() => {
    const data = {
      components: state.components.map(c => ({ ...c, simState: undefined })),
      wires: state.wires.map(w => ({ ...w, energized: undefined })),
      version: '1.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'esquema_eletrico.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [state.components, state.wires]);

  const loadProject = useCallback((json: string) => {
    try {
      const data = JSON.parse(json);
      if (data.components && data.wires) {
        pushUndo();
        setState(prev => ({
          ...prev,
          components: data.components,
          wires: data.wires,
          selectedIds: [],
          simulating: false,
        }));
        simStateRef.current = null;
      }
    } catch (e) {
      console.error('Erro ao carregar projeto:', e);
    }
  }, [pushUndo]);

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
    undo,
    redo,
    toggleSimulation,
    handleSimClick,
    updateComponentLabel,
    duplicateSelected,
    saveProject,
    loadProject,
  };
}
