export interface Point {
  x: number;
  y: number;
}

export interface Terminal {
  id: string;
  position: Point;
  connected: boolean;
}

export type ComponentType =
  // Alimentação
  | 'fonte_ac'
  | 'fonte_dc'
  | 'fase_l1'
  | 'fase_l2'
  | 'fase_l3'
  | 'neutro'
  | 'terra'
  // Proteção
  | 'disjuntor_monopolar'
  | 'disjuntor_bipolar'
  | 'disjuntor_tripolar'
  | 'fusivel'
  | 'rele_termico'
  | 'disjuntor_motor'
  // Passivos
  | 'resistor'
  | 'capacitor'
  | 'indutor'
  // Chaves / Botoeiras
  | 'contato_na'
  | 'contato_nf'
  | 'botoeira_na'
  | 'botoeira_nf'
  | 'botoeira_emergencia'
  | 'chave_seletora'
  | 'chave_fim_curso'
  | 'chave_pressao'
  | 'chave_nivel'
  | 'chave_fluxo'
  // Sensores
  | 'sensor_indutivo'
  | 'sensor_capacitivo'
  | 'sensor_optico'
  | 'sensor_temperatura'
  // Contatores / Relés
  | 'bobina_contator'
  | 'contator_na'
  | 'contator_nf'
  | 'bobina_rele'
  | 'rele_na'
  | 'rele_nf'
  // Temporizadores
  | 'temporizador_ton'
  | 'temporizador_tof'
  | 'temporizador_tp'
  | 'contato_temp_na'
  | 'contato_temp_nf'
  // Saídas / Atuadores
  | 'lampada'
  | 'lampada_verde'
  | 'lampada_vermelha'
  | 'lampada_amarela'
  | 'motor_mono'
  | 'motor_tri'
  | 'motor_dc'
  | 'sirene'
  | 'buzzer'
  | 'solenoide'
  | 'ventilador'
  // Transformadores
  | 'transformador'
  | 'transformador_ct'
  // CLP
  | 'clp_entrada'
  | 'clp_saida'
  // Conectores
  | 'borne'
  | 'juncao'
  | 'conector';

export interface SchematicComponent {
  id: string;
  type: ComponentType;
  position: Point;
  rotation: number;
  label: string;
  terminals: Terminal[];
  properties: Record<string, string>;
  simState?: 'on' | 'off' | 'fault';
}

export interface Wire {
  id: string;
  points: Point[];
  startTerminalId?: string;
  endTerminalId?: string;
  energized?: boolean;
}

export type Tool = 'select' | 'wire' | 'delete' | 'move' | 'text' | 'zoom_in' | 'zoom_out';

export interface EditorState {
  components: SchematicComponent[];
  wires: Wire[];
  selectedIds: string[];
  activeTool: Tool;
  zoom: number;
  pan: Point;
  gridSize: number;
  snapToGrid: boolean;
  simulating: boolean;
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
}

export interface HistoryEntry {
  components: SchematicComponent[];
  wires: Wire[];
}

export interface ComponentCategory {
  name: string;
  icon: string;
  components: { type: ComponentType; label: string }[];
}
