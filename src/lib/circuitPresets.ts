import { SchematicComponent, Wire } from '@/types/schematic';

export interface CircuitPreset {
  id: string;
  name: string;
  description: string;
  level: 'iniciante' | 'intermediario' | 'avancado';
  components: SchematicComponent[];
  wires: Wire[];
}

export const circuitPresets: CircuitPreset[] = [
  {
    id: 'basico_liga_desliga',
    name: 'Liga/Desliga Básico',
    description: 'Lâmpada controlada por botoeira NA',
    level: 'iniciante',
    components: [
      {
        id: 'fonte_1', type: 'fonte_dc',
        position: { x: 300, y: 100 }, rotation: 0, label: '24V DC',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
          { id: 't2', position: { x: 0, y: 40 }, connected: false },
        ],
        properties: {},
      },
      {
        id: 'bot_1', type: 'botoeira_na',
        position: { x: 300, y: 200 }, rotation: 0, label: 'S1 - Liga',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
          { id: 't2', position: { x: 0, y: 40 }, connected: false },
        ],
        properties: {},
      },
      {
        id: 'lamp_1', type: 'lampada',
        position: { x: 300, y: 300 }, rotation: 0, label: 'H1',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
          { id: 't2', position: { x: 0, y: 40 }, connected: false },
        ],
        properties: {},
      },
      {
        id: 'terra_1', type: 'terra',
        position: { x: 300, y: 400 }, rotation: 0, label: 'GND',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
        ],
        properties: {},
      },
    ],
    wires: [
      { id: 'w1', points: [{ x: 300, y: 140 }, { x: 300, y: 160 }] },
      { id: 'w2', points: [{ x: 300, y: 240 }, { x: 300, y: 260 }] },
      { id: 'w3', points: [{ x: 300, y: 340 }, { x: 300, y: 360 }] },
    ],
  },
  {
    id: 'semaforo',
    name: 'Semáforo Simples',
    description: '3 lâmpadas controladas independentemente',
    level: 'iniciante',
    components: [
      {
        id: 'f1', type: 'fonte_dc',
        position: { x: 300, y: 80 }, rotation: 0, label: '24V DC',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
          { id: 't2', position: { x: 0, y: 40 }, connected: false },
        ],
        properties: {},
      },
      {
        id: 's1', type: 'botoeira_na',
        position: { x: 200, y: 200 }, rotation: 0, label: 'S1',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
          { id: 't2', position: { x: 0, y: 40 }, connected: false },
        ],
        properties: {},
      },
      {
        id: 's2', type: 'botoeira_na',
        position: { x: 300, y: 200 }, rotation: 0, label: 'S2',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
          { id: 't2', position: { x: 0, y: 40 }, connected: false },
        ],
        properties: {},
      },
      {
        id: 's3', type: 'botoeira_na',
        position: { x: 400, y: 200 }, rotation: 0, label: 'S3',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
          { id: 't2', position: { x: 0, y: 40 }, connected: false },
        ],
        properties: {},
      },
      {
        id: 'lr', type: 'lampada_vermelha',
        position: { x: 200, y: 320 }, rotation: 0, label: 'Vermelho',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
          { id: 't2', position: { x: 0, y: 40 }, connected: false },
        ],
        properties: {},
      },
      {
        id: 'la', type: 'lampada_amarela',
        position: { x: 300, y: 320 }, rotation: 0, label: 'Amarelo',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
          { id: 't2', position: { x: 0, y: 40 }, connected: false },
        ],
        properties: {},
      },
      {
        id: 'lv', type: 'lampada_verde',
        position: { x: 400, y: 320 }, rotation: 0, label: 'Verde',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
          { id: 't2', position: { x: 0, y: 40 }, connected: false },
        ],
        properties: {},
      },
      {
        id: 'gnd', type: 'terra',
        position: { x: 300, y: 440 }, rotation: 0, label: 'GND',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
        ],
        properties: {},
      },
    ],
    wires: [
      // Source to switches - branch from fonte t2 (300,120)
      { id: 'w1', points: [{ x: 300, y: 120 }, { x: 200, y: 120 }, { x: 200, y: 160 }] },
      { id: 'w2', points: [{ x: 300, y: 120 }, { x: 300, y: 160 }] },
      { id: 'w3', points: [{ x: 300, y: 120 }, { x: 400, y: 120 }, { x: 400, y: 160 }] },
      // Switches t2 (y+40=240) to lamps t1 (y-40=280)
      { id: 'w4', points: [{ x: 200, y: 240 }, { x: 200, y: 280 }] },
      { id: 'w5', points: [{ x: 300, y: 240 }, { x: 300, y: 280 }] },
      { id: 'w6', points: [{ x: 400, y: 240 }, { x: 400, y: 280 }] },
      // Lamps t2 (y+40=360) to ground t1 (300,400)
      { id: 'w7', points: [{ x: 200, y: 360 }, { x: 200, y: 400 }, { x: 300, y: 400 }] },
      { id: 'w8', points: [{ x: 300, y: 360 }, { x: 300, y: 400 }] },
      { id: 'w9', points: [{ x: 400, y: 360 }, { x: 400, y: 400 }, { x: 300, y: 400 }] },
    ],
  },
  {
    id: 'motor_contator',
    name: 'Motor com Contator',
    description: 'Partida direta de motor com selo e proteção',
    level: 'intermediario',
    components: [
      {
        id: 'l1', type: 'fase_l1',
        position: { x: 300, y: 60 }, rotation: 0, label: 'L1',
        terminals: [{ id: 't1', position: { x: 0, y: -40 }, connected: false }],
        properties: {},
      },
      {
        id: 'q1', type: 'disjuntor_monopolar',
        position: { x: 300, y: 140 }, rotation: 0, label: 'Q1',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
          { id: 't2', position: { x: 0, y: 40 }, connected: false },
        ],
        properties: {},
      },
      {
        id: 's2', type: 'botoeira_nf',
        position: { x: 300, y: 240 }, rotation: 0, label: 'S2 - Desliga',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
          { id: 't2', position: { x: 0, y: 40 }, connected: false },
        ],
        properties: {},
      },
      {
        id: 's1', type: 'botoeira_na',
        position: { x: 300, y: 340 }, rotation: 0, label: 'S1 - Liga',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
          { id: 't2', position: { x: 0, y: 40 }, connected: false },
        ],
        properties: {},
      },
      {
        id: 'k1', type: 'bobina_contator',
        position: { x: 300, y: 440 }, rotation: 0, label: 'K1',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
          { id: 't2', position: { x: 0, y: 40 }, connected: false },
        ],
        properties: {},
      },
      {
        id: 'n1', type: 'neutro',
        position: { x: 300, y: 540 }, rotation: 0, label: 'N',
        terminals: [{ id: 't1', position: { x: 0, y: -40 }, connected: false }],
        properties: {},
      },
      // Selo - contato auxiliar
      {
        id: 'k1a', type: 'contator_na',
        position: { x: 460, y: 340 }, rotation: 0, label: 'K1 (selo)',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
          { id: 't2', position: { x: 0, y: 40 }, connected: false },
        ],
        properties: {},
      },
      // Circuito de força
      {
        id: 'k1f', type: 'contator_na',
        position: { x: 600, y: 200 }, rotation: 0, label: 'K1 (força)',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
          { id: 't2', position: { x: 0, y: 40 }, connected: false },
        ],
        properties: {},
      },
      {
        id: 'm1', type: 'motor_mono',
        position: { x: 600, y: 320 }, rotation: 0, label: 'M1',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
          { id: 't2', position: { x: 0, y: 40 }, connected: false },
        ],
        properties: {},
      },
      {
        id: 'hv', type: 'lampada_verde',
        position: { x: 600, y: 440 }, rotation: 0, label: 'H1 - Ligado',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
          { id: 't2', position: { x: 0, y: 40 }, connected: false },
        ],
        properties: {},
      },
      {
        id: 'n2', type: 'neutro',
        position: { x: 600, y: 540 }, rotation: 0, label: 'N',
        terminals: [{ id: 't1', position: { x: 0, y: -40 }, connected: false }],
        properties: {},
      },
    ],
    wires: [
      // L1 t1(300,20) -> Q1 t1(300,100)
      { id: 'w1', points: [{ x: 300, y: 20 }, { x: 300, y: 100 }] },
      // Q1 t2(300,180) -> S2 t1(300,200)
      { id: 'w2', points: [{ x: 300, y: 180 }, { x: 300, y: 200 }] },
      // S2 t2(300,280) -> S1 t1(300,300)
      { id: 'w3', points: [{ x: 300, y: 280 }, { x: 300, y: 300 }] },
      // S1 t2(300,380) -> K1 t1(300,400)
      { id: 'w4', points: [{ x: 300, y: 380 }, { x: 300, y: 400 }] },
      // K1 t2(300,480) -> N t1(300,500)
      { id: 'w5', points: [{ x: 300, y: 480 }, { x: 300, y: 500 }] },
      // Selo: branch from S2-S1 junction to K1a
      { id: 'w6', points: [{ x: 300, y: 300 }, { x: 460, y: 300 }] },
      { id: 'w7', points: [{ x: 460, y: 380 }, { x: 460, y: 400 }, { x: 300, y: 400 }] },
      // Força: L1 branch to K1f
      { id: 'w8', points: [{ x: 300, y: 20 }, { x: 600, y: 20 }, { x: 600, y: 160 }] },
      // K1f t2(600,240) -> M1 t1(600,280)
      { id: 'w9', points: [{ x: 600, y: 240 }, { x: 600, y: 280 }] },
      // M1 t2(600,360) -> H1 t1(600,400)
      { id: 'w10', points: [{ x: 600, y: 360 }, { x: 600, y: 400 }] },
      // H1 t2(600,480) -> N2 t1(600,500)
      { id: 'w11', points: [{ x: 600, y: 480 }, { x: 600, y: 500 }] },
    ],
  },
  {
    id: 'sensor_sinalizacao',
    name: 'Sensor com Sinalização',
    description: 'Sensor indutivo aciona lâmpadas de sinalização',
    level: 'intermediario',
    components: [
      {
        id: 'f1', type: 'fonte_dc',
        position: { x: 300, y: 80 }, rotation: 0, label: '24V DC',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
          { id: 't2', position: { x: 0, y: 40 }, connected: false },
        ],
        properties: {},
      },
      {
        id: 'b1', type: 'sensor_indutivo',
        position: { x: 200, y: 220 }, rotation: 0, label: 'B1 - Sensor',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
          { id: 't2', position: { x: 0, y: 40 }, connected: false },
        ],
        properties: {},
      },
      {
        id: 'lv', type: 'lampada_verde',
        position: { x: 200, y: 340 }, rotation: 0, label: 'H1 - OK',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
          { id: 't2', position: { x: 0, y: 40 }, connected: false },
        ],
        properties: {},
      },
      {
        id: 'lr', type: 'lampada_vermelha',
        position: { x: 400, y: 340 }, rotation: 0, label: 'H2 - Alarme',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
          { id: 't2', position: { x: 0, y: 40 }, connected: false },
        ],
        properties: {},
      },
      {
        id: 'bz', type: 'buzzer',
        position: { x: 400, y: 220 }, rotation: 0, label: 'BZ1',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
          { id: 't2', position: { x: 0, y: 40 }, connected: false },
        ],
        properties: {},
      },
      {
        id: 'gnd', type: 'terra',
        position: { x: 300, y: 460 }, rotation: 0, label: 'GND',
        terminals: [{ id: 't1', position: { x: 0, y: -40 }, connected: false }],
        properties: {},
      },
    ],
    wires: [
      { id: 'w1', points: [{ x: 300, y: 120 }, { x: 200, y: 120 }, { x: 200, y: 180 }] },
      { id: 'w2', points: [{ x: 300, y: 120 }, { x: 400, y: 120 }, { x: 400, y: 180 }] },
      { id: 'w3', points: [{ x: 200, y: 260 }, { x: 200, y: 300 }] },
      { id: 'w4', points: [{ x: 400, y: 260 }, { x: 400, y: 300 }] },
      { id: 'w5', points: [{ x: 200, y: 380 }, { x: 200, y: 420 }, { x: 300, y: 420 }] },
      { id: 'w6', points: [{ x: 400, y: 380 }, { x: 400, y: 420 }, { x: 300, y: 420 }] },
    ],
  },
  {
    id: 'esteira',
    name: 'Esteira Transportadora',
    description: 'Motor com sensores e sinalização completa',
    level: 'avancado',
    components: [
      {
        id: 'f1', type: 'fonte_dc',
        position: { x: 400, y: 60 }, rotation: 0, label: '24V DC',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
          { id: 't2', position: { x: 0, y: 40 }, connected: false },
        ],
        properties: {},
      },
      {
        id: 'dj', type: 'disjuntor_monopolar',
        position: { x: 400, y: 160 }, rotation: 0, label: 'Q1',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
          { id: 't2', position: { x: 0, y: 40 }, connected: false },
        ],
        properties: {},
      },
      {
        id: 'emg', type: 'botoeira_emergencia',
        position: { x: 400, y: 260 }, rotation: 0, label: 'S0 - Emergência',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
          { id: 't2', position: { x: 0, y: 40 }, connected: false },
        ],
        properties: {},
      },
      {
        id: 'se1', type: 'sensor_optico',
        position: { x: 200, y: 360 }, rotation: 0, label: 'B1 - Início',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
          { id: 't2', position: { x: 0, y: 40 }, connected: false },
        ],
        properties: {},
      },
      {
        id: 'se2', type: 'sensor_indutivo',
        position: { x: 400, y: 360 }, rotation: 0, label: 'B2 - Metal',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
          { id: 't2', position: { x: 0, y: 40 }, connected: false },
        ],
        properties: {},
      },
      {
        id: 'se3', type: 'sensor_optico',
        position: { x: 600, y: 360 }, rotation: 0, label: 'B3 - Fim',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
          { id: 't2', position: { x: 0, y: 40 }, connected: false },
        ],
        properties: {},
      },
      {
        id: 'mot', type: 'motor_dc',
        position: { x: 200, y: 480 }, rotation: 0, label: 'M1 - Esteira',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
          { id: 't2', position: { x: 0, y: 40 }, connected: false },
        ],
        properties: {},
      },
      {
        id: 'sol', type: 'solenoide',
        position: { x: 400, y: 480 }, rotation: 0, label: 'Y1 - Desviador',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
          { id: 't2', position: { x: 0, y: 40 }, connected: false },
        ],
        properties: {},
      },
      {
        id: 'lv', type: 'lampada_verde',
        position: { x: 600, y: 480 }, rotation: 0, label: 'H1 - OK',
        terminals: [
          { id: 't1', position: { x: 0, y: -40 }, connected: false },
          { id: 't2', position: { x: 0, y: 40 }, connected: false },
        ],
        properties: {},
      },
      {
        id: 'gnd', type: 'terra',
        position: { x: 400, y: 600 }, rotation: 0, label: 'GND',
        terminals: [{ id: 't1', position: { x: 0, y: -40 }, connected: false }],
        properties: {},
      },
    ],
    wires: [
      // fonte t2(400,100) -> dj t1(400,120)
      { id: 'w1', points: [{ x: 400, y: 100 }, { x: 400, y: 120 }] },
      // dj t2(400,200) -> emg t1(400,220)
      { id: 'w2', points: [{ x: 400, y: 200 }, { x: 400, y: 220 }] },
      // emg t2(400,300) -> branch to sensors
      { id: 'w3', points: [{ x: 400, y: 300 }, { x: 200, y: 300 }, { x: 200, y: 320 }] },
      { id: 'w4', points: [{ x: 400, y: 300 }, { x: 400, y: 320 }] },
      { id: 'w5', points: [{ x: 400, y: 300 }, { x: 600, y: 300 }, { x: 600, y: 320 }] },
      // sensors t2 -> outputs t1
      { id: 'w6', points: [{ x: 200, y: 400 }, { x: 200, y: 440 }] },
      { id: 'w7', points: [{ x: 400, y: 400 }, { x: 400, y: 440 }] },
      { id: 'w8', points: [{ x: 600, y: 400 }, { x: 600, y: 440 }] },
      // outputs t2 -> ground
      { id: 'w11', points: [{ x: 200, y: 520 }, { x: 200, y: 560 }, { x: 400, y: 560 }] },
      { id: 'w12', points: [{ x: 400, y: 520 }, { x: 400, y: 560 }] },
      { id: 'w13', points: [{ x: 600, y: 520 }, { x: 600, y: 560 }, { x: 400, y: 560 }] },
    ],
  },
];
