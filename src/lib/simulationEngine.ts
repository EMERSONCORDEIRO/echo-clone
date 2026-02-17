import { SchematicComponent, Wire, Point, ComponentType } from '@/types/schematic';

// Types of components by their electrical role
const SOURCES: ComponentType[] = ['fonte_ac', 'fonte_dc', 'fase_l1', 'fase_l2', 'fase_l3'];
const TOGGLEABLE: ComponentType[] = [
  'contato_na', 'contato_nf', 'botoeira_na', 'botoeira_nf', 'botoeira_emergencia',
  'chave_seletora', 'chave_fim_curso', 'chave_pressao', 'chave_nivel', 'chave_fluxo',
  'contator_na', 'contator_nf', 'rele_na', 'rele_nf',
  'contato_temp_na', 'contato_temp_nf',
  'disjuntor_monopolar', 'disjuntor_bipolar', 'disjuntor_tripolar',
  'fusivel',
  'sensor_indutivo', 'sensor_capacitivo', 'sensor_optico', 'sensor_temperatura',
];
const LOADS: ComponentType[] = [
  'lampada', 'lampada_verde', 'lampada_vermelha', 'lampada_amarela',
  'motor_mono', 'motor_tri', 'motor_dc', 'sirene', 'buzzer',
  'solenoide', 'ventilador', 'bobina_contator', 'bobina_rele',
  'temporizador_ton', 'temporizador_tof', 'temporizador_tp',
];
const NORMALLY_CLOSED: ComponentType[] = [
  'contato_nf', 'botoeira_nf', 'botoeira_emergencia', 'contator_nf', 'rele_nf', 'contato_temp_nf',
];
const PROTECTION_CLOSED: ComponentType[] = [
  'disjuntor_monopolar', 'disjuntor_bipolar', 'disjuntor_tripolar', 'fusivel',
];
const RETURN_PATH: ComponentType[] = ['neutro', 'terra'];

const PROXIMITY = 22;

export interface SimState {
  componentStates: Map<string, 'on' | 'off' | 'fault'>;
  switchStates: Map<string, boolean>;
  wireEnergized: Map<string, boolean>;
}

export function createInitialSimState(components: SchematicComponent[]): SimState {
  const componentStates = new Map<string, 'on' | 'off' | 'fault'>();
  const switchStates = new Map<string, boolean>();

  components.forEach(comp => {
    componentStates.set(comp.id, 'off');
    if (TOGGLEABLE.includes(comp.type)) {
      const isClosed = NORMALLY_CLOSED.includes(comp.type) || PROTECTION_CLOSED.includes(comp.type);
      switchStates.set(comp.id, isClosed);
    }
  });

  return { componentStates, switchStates, wireEnergized: new Map() };
}

export function isToggleable(type: ComponentType): boolean {
  return TOGGLEABLE.includes(type);
}

export function toggleSwitch(simState: SimState, componentId: string): SimState {
  const newSwitchStates = new Map(simState.switchStates);
  const current = newSwitchStates.get(componentId);
  if (current !== undefined) {
    newSwitchStates.set(componentId, !current);
  }
  return { ...simState, switchStates: newSwitchStates };
}

function getAbsoluteTerminals(comp: SchematicComponent): Point[] {
  const rad = (comp.rotation * Math.PI) / 180;
  return comp.terminals.map(t => {
    const rx = t.position.x * Math.cos(rad) - t.position.y * Math.sin(rad);
    const ry = t.position.x * Math.sin(rad) + t.position.y * Math.cos(rad);
    return {
      x: Math.round(comp.position.x + rx),
      y: Math.round(comp.position.y + ry),
    };
  });
}

function pointsClose(a: Point, b: Point): boolean {
  return Math.abs(a.x - b.x) < PROXIMITY && Math.abs(a.y - b.y) < PROXIMITY;
}

function bfs(
  startIds: string[],
  adj: Map<string, Set<string>>,
  components: SchematicComponent[],
  simState: SimState
): Set<string> {
  const visited = new Set<string>();
  const queue: string[] = [];

  for (const id of startIds) {
    visited.add(id);
    queue.push(id);
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = adj.get(current);
    if (!neighbors) continue;

    for (const neighborId of neighbors) {
      if (visited.has(neighborId)) continue;

      const comp = components.find(c => c.id === neighborId);
      if (comp && TOGGLEABLE.includes(comp.type)) {
        const isClosed = simState.switchStates.get(comp.id);
        if (!isClosed) continue; // Open switch blocks
      }

      visited.add(neighborId);
      queue.push(neighborId);
    }
  }

  return visited;
}

export function runSimulation(
  components: SchematicComponent[],
  wires: Wire[],
  simState: SimState
): SimState {
  const newComponentStates = new Map<string, 'on' | 'off' | 'fault'>();
  const newWireEnergized = new Map<string, boolean>();

  components.forEach(c => newComponentStates.set(c.id, 'off'));
  wires.forEach(w => newWireEnergized.set(w.id, false));

  // Build adjacency
  const adj = new Map<string, Set<string>>();
  const ensureNode = (id: string) => {
    if (!adj.has(id)) adj.set(id, new Set());
  };

  const compTerminals = new Map<string, Point[]>();
  components.forEach(comp => {
    compTerminals.set(comp.id, getAbsoluteTerminals(comp));
    ensureNode(comp.id);
  });

  wires.forEach(wire => {
    ensureNode(wire.id);

    wire.points.forEach(wp => {
      components.forEach(comp => {
        const terminals = compTerminals.get(comp.id)!;
        for (const term of terminals) {
          if (pointsClose(wp, term)) {
            adj.get(wire.id)!.add(comp.id);
            adj.get(comp.id)!.add(wire.id);
            break;
          }
        }
      });
    });

    wires.forEach(other => {
      if (other.id === wire.id) return;
      ensureNode(other.id);
      for (const wp of wire.points) {
        for (const op of other.points) {
          if (pointsClose(wp, op)) {
            adj.get(wire.id)!.add(other.id);
            adj.get(other.id)!.add(wire.id);
            return;
          }
        }
      }
    });
  });

  // Two BFS passes:
  // 1. From sources (power supply side)
  // 2. From return path (terra/neutro)
  // A node is truly energized only if reachable from BOTH
  const sourceIds = components
    .filter(c => SOURCES.includes(c.type))
    .map(c => c.id);
  const returnIds = components
    .filter(c => RETURN_PATH.includes(c.type))
    .map(c => c.id);

  const reachableFromSource = bfs(sourceIds, adj, components, simState);
  const reachableFromReturn = bfs(returnIds, adj, components, simState);

  // A node is energized if reachable from both source and return
  const energized = new Set<string>();
  for (const id of reachableFromSource) {
    if (reachableFromReturn.has(id)) {
      energized.add(id);
    }
  }

  // Also mark sources and returns as always on
  sourceIds.forEach(id => { energized.add(id); newComponentStates.set(id, 'on'); });
  returnIds.forEach(id => { energized.add(id); newComponentStates.set(id, 'on'); });

  // Update states
  components.forEach(comp => {
    if (SOURCES.includes(comp.type) || RETURN_PATH.includes(comp.type)) {
      newComponentStates.set(comp.id, 'on');
    } else if (energized.has(comp.id)) {
      if (TOGGLEABLE.includes(comp.type)) {
        const isClosed = simState.switchStates.get(comp.id);
        newComponentStates.set(comp.id, isClosed ? 'on' : 'off');
      } else {
        newComponentStates.set(comp.id, 'on');
      }
    }
  });

  wires.forEach(wire => {
    newWireEnergized.set(wire.id, energized.has(wire.id));
  });

  return {
    componentStates: newComponentStates,
    switchStates: new Map(simState.switchStates),
    wireEnergized: newWireEnergized,
  };
}
