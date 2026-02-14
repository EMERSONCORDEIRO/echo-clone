export interface Point {
  x: number;
  y: number;
}

export interface Terminal {
  id: string;
  position: Point; // relative to component
  connected: boolean;
}

export type ComponentType =
  | 'resistor'
  | 'capacitor'
  | 'inductor'
  | 'switch_no'
  | 'switch_nc'
  | 'push_button_no'
  | 'push_button_nc'
  | 'lamp'
  | 'motor'
  | 'contactor_coil'
  | 'contactor_no'
  | 'contactor_nc'
  | 'relay_coil'
  | 'timer_on'
  | 'timer_off'
  | 'fuse'
  | 'overload'
  | 'transformer'
  | 'power_supply'
  | 'ground';

export interface SchematicComponent {
  id: string;
  type: ComponentType;
  position: Point;
  rotation: number; // 0, 90, 180, 270
  label: string;
  terminals: Terminal[];
  properties: Record<string, string>;
}

export interface Wire {
  id: string;
  points: Point[];
  startTerminalId?: string;
  endTerminalId?: string;
}

export type Tool = 'select' | 'wire' | 'delete' | 'move' | 'text';

export interface EditorState {
  components: SchematicComponent[];
  wires: Wire[];
  selectedIds: string[];
  activeTool: Tool;
  zoom: number;
  pan: Point;
  gridSize: number;
  snapToGrid: boolean;
}

export interface ComponentCategory {
  name: string;
  icon: string;
  components: { type: ComponentType; label: string }[];
}
