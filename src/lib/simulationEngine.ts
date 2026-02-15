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

// Protection devices start closed
const PROTECTION_CLOSED: ComponentType[] = [
  'disjuntor_monopolar', 'disjuntor_bipolar', 'disjuntor_tripolar', 'fusivel',
];

const SNAP = 20;
const PROXIMITY = 12; // how close terminals/wire endpoints need to be

export interface SimState {
  componentStates: Map<string, 'on' | 'off' | 'fault'>;
  switchStates: Map<string, boolean>; // true = closed (conducting)
  wireEnergized: Map<string, boolean>;
}

export function createInitialSimState(components: SchematicComponent[]): SimState {
  const componentStates = new Map<string, 'on' | 'off' | 'fault'>();
  const switchStates = new Map<string, boolean>();

  components.forEach(comp => {
    componentStates.set(comp.id, 'off');

    if (TOGGLEABLE.includes(comp.type)) {
      // Normally closed contacts start closed, normally open start open
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

// Build connectivity graph
interface Node {
  type: 'component' | 'wire';
  id: string;
}

export function runSimulation(
  components: SchematicComponent[],
  wires: Wire[],
  simState: SimState
): SimState {
  const newComponentStates = new Map<string, 'on' | 'off' | 'fault'>();
  const newWireEnergized = new Map<string, boolean>();

  // Initialize all as off
  components.forEach(c => newComponentStates.set(c.id, 'off'));
  wires.forEach(w => newWireEnergized.set(w.id, false));

  // Build adjacency: which components/wires are connected
  // A wire endpoint connects to a component terminal if they're close enough
  const adj = new Map<string, Set<string>>(); // node id -> set of connected node ids

  const ensureNode = (id: string) => {
    if (!adj.has(id)) adj.set(id, new Set());
  };

  // For each component, compute absolute terminal positions
  const compTerminals = new Map<string, Point[]>();
  components.forEach(comp => {
    compTerminals.set(comp.id, getAbsoluteTerminals(comp));
    ensureNode(comp.id);
  });

  wires.forEach(wire => {
    ensureNode(wire.id);

    // Check wire endpoints against component terminals
    const wireEndpoints = [wire.points[0], wire.points[wire.points.length - 1]];

    components.forEach(comp => {
      const terminals = compTerminals.get(comp.id)!;
      for (const wep of wireEndpoints) {
        for (const term of terminals) {
          if (pointsClose(wep, term)) {
            adj.get(wire.id)!.add(comp.id);
            adj.get(comp.id)!.add(wire.id);
            break;
          }
        }
      }
    });

    // Check wire-to-wire connections (endpoints touching)
    wires.forEach(other => {
      if (other.id === wire.id) return;
      ensureNode(other.id);
      const otherEndpoints = [other.points[0], other.points[other.points.length - 1]];
      for (const wep of wireEndpoints) {
        for (const oep of otherEndpoints) {
          if (pointsClose(wep, oep)) {
            adj.get(wire.id)!.add(other.id);
            adj.get(other.id)!.add(wire.id);
          }
        }
      }
    });

    // Also check wire intermediate points touching component terminals
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
  });

  // BFS from sources, respecting switch states
  // A switch that is open blocks traversal through it
  const energized = new Set<string>();
  const queue: string[] = [];

  // Start from all source components
  components.forEach(comp => {
    if (SOURCES.includes(comp.type)) {
      energized.add(comp.id);
      queue.push(comp.id);
      newComponentStates.set(comp.id, 'on');
    }
  });

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = adj.get(current);
    if (!neighbors) continue;

    for (const neighborId of neighbors) {
      if (energized.has(neighborId)) continue;

      // Check if the neighbor is a switch that blocks current
      const comp = components.find(c => c.id === neighborId);
      if (comp && TOGGLEABLE.includes(comp.type)) {
        const isClosed = simState.switchStates.get(comp.id);
        if (!isClosed) {
          // Switch is open, don't traverse but mark as off
          newComponentStates.set(comp.id, 'off');
          continue;
        }
      }

      energized.add(neighborId);
      queue.push(neighborId);
    }
  }

  // Update states based on energization
  components.forEach(comp => {
    if (energized.has(comp.id)) {
      if (SOURCES.includes(comp.type)) {
        newComponentStates.set(comp.id, 'on');
      } else if (LOADS.includes(comp.type)) {
        newComponentStates.set(comp.id, 'on');
      } else if (TOGGLEABLE.includes(comp.type)) {
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
