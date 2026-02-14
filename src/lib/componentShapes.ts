import { ComponentType, Terminal } from '@/types/schematic';

const G = 20; // grid unit

export function getTerminals(type: ComponentType): Terminal[] {
  const vert2 = (): Terminal[] => [
    { id: 't1', position: { x: 0, y: -G * 2 }, connected: false },
    { id: 't2', position: { x: 0, y: G * 2 }, connected: false },
  ];

  switch (type) {
    case 'terra':
    case 'neutro':
    case 'fase_l1':
    case 'fase_l2':
    case 'fase_l3':
      return [{ id: 't1', position: { x: 0, y: -G * 2 }, connected: false }];
    case 'disjuntor_bipolar':
      return [
        { id: 't1', position: { x: -G, y: -G * 2 }, connected: false },
        { id: 't2', position: { x: G, y: -G * 2 }, connected: false },
        { id: 't3', position: { x: -G, y: G * 2 }, connected: false },
        { id: 't4', position: { x: G, y: G * 2 }, connected: false },
      ];
    case 'disjuntor_tripolar':
    case 'motor_tri':
      return [
        { id: 't1', position: { x: -G, y: -G * 2 }, connected: false },
        { id: 't2', position: { x: 0, y: -G * 2 }, connected: false },
        { id: 't3', position: { x: G, y: -G * 2 }, connected: false },
        { id: 't4', position: { x: -G, y: G * 2 }, connected: false },
        { id: 't5', position: { x: 0, y: G * 2 }, connected: false },
        { id: 't6', position: { x: G, y: G * 2 }, connected: false },
      ];
    case 'transformador':
    case 'transformador_ct':
      return [
        { id: 't1', position: { x: -G, y: -G * 2 }, connected: false },
        { id: 't2', position: { x: G, y: -G * 2 }, connected: false },
        { id: 't3', position: { x: -G, y: G * 2 }, connected: false },
        { id: 't4', position: { x: G, y: G * 2 }, connected: false },
      ];
    case 'juncao':
    case 'borne':
      return [
        { id: 't1', position: { x: 0, y: -G }, connected: false },
        { id: 't2', position: { x: 0, y: G }, connected: false },
        { id: 't3', position: { x: -G, y: 0 }, connected: false },
        { id: 't4', position: { x: G, y: 0 }, connected: false },
      ];
    default:
      return vert2();
  }
}

export function drawComponent(
  ctx: CanvasRenderingContext2D,
  type: ComponentType,
  x: number,
  y: number,
  rotation: number,
  selected: boolean,
  strokeColor: string,
  fillColor: string,
  selectionColor: string,
  simState?: 'on' | 'off' | 'fault'
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);

  const stroke = selected ? selectionColor : strokeColor;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = selected ? 2.5 : 2;
  ctx.fillStyle = fillColor;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw leads (terminal lines)
  const drawLeads = () => {
    ctx.beginPath();
    ctx.moveTo(0, -G * 2);
    ctx.lineTo(0, -G);
    ctx.moveTo(0, G);
    ctx.lineTo(0, G * 2);
    ctx.stroke();
  };

  const drawSingleLead = () => {
    ctx.beginPath();
    ctx.moveTo(0, -G * 2);
    ctx.lineTo(0, 0);
    ctx.stroke();
  };

  const drawCircle = (r: number, text?: string) => {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    if (text) {
      ctx.font = `bold ${Math.min(r, 12)}px Inter`;
      ctx.fillStyle = stroke;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 0, 0);
    }
  };

  const drawRect = (w: number, h: number, text?: string) => {
    ctx.beginPath();
    ctx.rect(-w / 2, -h / 2, w, h);
    ctx.stroke();
    if (text) {
      ctx.font = `bold 11px Inter`;
      ctx.fillStyle = stroke;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 0, 0);
    }
  };

  const drawContactNO = () => {
    ctx.beginPath();
    ctx.arc(0, -G * 0.5, 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, G * 0.5, 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -G * 0.5);
    ctx.lineTo(G * 0.5, G * 0.5);
    ctx.stroke();
  };

  const drawContactNF = () => {
    ctx.beginPath();
    ctx.arc(0, -G * 0.5, 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, G * 0.5, 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -G * 0.5);
    ctx.lineTo(0, G * 0.5);
    ctx.stroke();
    // Cross mark
    ctx.beginPath();
    ctx.moveTo(-G * 0.3, 0);
    ctx.lineTo(G * 0.3, -G * 0.3);
    ctx.stroke();
  };

  // Lamp glow for simulation
  const drawLampGlow = (color: string) => {
    if (simState === 'on') {
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(0, 0, G * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  switch (type) {
    // === ALIMENTAÇÃO ===
    case 'fonte_ac':
      drawLeads();
      drawCircle(G * 0.7);
      ctx.beginPath();
      ctx.moveTo(-G * 0.3, 0);
      ctx.bezierCurveTo(-G * 0.3, -G * 0.4, 0, -G * 0.4, 0, 0);
      ctx.bezierCurveTo(0, G * 0.4, G * 0.3, G * 0.4, G * 0.3, 0);
      ctx.stroke();
      break;

    case 'fonte_dc':
      drawLeads();
      drawCircle(G * 0.7);
      // + and -
      ctx.beginPath();
      ctx.moveTo(-G * 0.3, -G * 0.15);
      ctx.lineTo(-G * 0.05, -G * 0.15);
      ctx.moveTo(-G * 0.175, -G * 0.3);
      ctx.lineTo(-G * 0.175, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(G * 0.05, G * 0.15);
      ctx.lineTo(G * 0.3, G * 0.15);
      ctx.stroke();
      break;

    case 'fase_l1':
      drawSingleLead();
      ctx.font = 'bold 12px JetBrains Mono';
      ctx.fillStyle = '#ef4444';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('L1', 0, G * 0.5);
      // Arrow down
      ctx.beginPath();
      ctx.moveTo(-G * 0.3, 0);
      ctx.lineTo(0, G * 0.8);
      ctx.lineTo(G * 0.3, 0);
      ctx.stroke();
      break;

    case 'fase_l2':
      drawSingleLead();
      ctx.font = 'bold 12px JetBrains Mono';
      ctx.fillStyle = '#eab308';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('L2', 0, G * 0.5);
      ctx.beginPath();
      ctx.moveTo(-G * 0.3, 0);
      ctx.lineTo(0, G * 0.8);
      ctx.lineTo(G * 0.3, 0);
      ctx.stroke();
      break;

    case 'fase_l3':
      drawSingleLead();
      ctx.font = 'bold 12px JetBrains Mono';
      ctx.fillStyle = '#3b82f6';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('L3', 0, G * 0.5);
      ctx.beginPath();
      ctx.moveTo(-G * 0.3, 0);
      ctx.lineTo(0, G * 0.8);
      ctx.lineTo(G * 0.3, 0);
      ctx.stroke();
      break;

    case 'neutro':
      drawSingleLead();
      ctx.font = 'bold 12px JetBrains Mono';
      ctx.fillStyle = '#60a5fa';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N', 0, G * 0.5);
      ctx.beginPath();
      ctx.moveTo(-G * 0.4, 0);
      ctx.lineTo(G * 0.4, 0);
      ctx.stroke();
      break;

    case 'terra':
      drawSingleLead();
      ctx.beginPath();
      ctx.moveTo(-G * 0.6, 0);
      ctx.lineTo(G * 0.6, 0);
      ctx.moveTo(-G * 0.4, G * 0.3);
      ctx.lineTo(G * 0.4, G * 0.3);
      ctx.moveTo(-G * 0.2, G * 0.6);
      ctx.lineTo(G * 0.2, G * 0.6);
      ctx.stroke();
      break;

    // === PROTEÇÃO ===
    case 'disjuntor_monopolar':
      drawLeads();
      ctx.beginPath();
      ctx.arc(0, -G * 0.5, 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, G * 0.5, 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -G * 0.5);
      ctx.lineTo(G * 0.4, G * 0.5);
      ctx.stroke();
      // X mark
      ctx.beginPath();
      ctx.moveTo(G * 0.2, -G * 0.2);
      ctx.lineTo(G * 0.5, 0);
      ctx.stroke();
      break;

    case 'disjuntor_bipolar':
      // Two-pole breaker
      ctx.beginPath();
      ctx.moveTo(-G, -G * 2);
      ctx.lineTo(-G, -G * 0.5);
      ctx.moveTo(G, -G * 2);
      ctx.lineTo(G, -G * 0.5);
      ctx.moveTo(-G, G * 0.5);
      ctx.lineTo(-G, G * 2);
      ctx.moveTo(G, G * 0.5);
      ctx.lineTo(G, G * 2);
      ctx.stroke();
      // Contacts
      [-G, G].forEach(cx => {
        ctx.beginPath();
        ctx.arc(cx, -G * 0.5, 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, G * 0.5, 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, -G * 0.5);
        ctx.lineTo(cx + G * 0.3, G * 0.5);
        ctx.stroke();
      });
      // Link
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(-G, 0);
      ctx.lineTo(G, 0);
      ctx.stroke();
      ctx.setLineDash([]);
      break;

    case 'disjuntor_tripolar':
      // Three-pole
      ctx.beginPath();
      [-G, 0, G].forEach(cx => {
        ctx.moveTo(cx, -G * 2);
        ctx.lineTo(cx, -G * 0.5);
        ctx.moveTo(cx, G * 0.5);
        ctx.lineTo(cx, G * 2);
      });
      ctx.stroke();
      [-G, 0, G].forEach(cx => {
        ctx.beginPath();
        ctx.arc(cx, -G * 0.5, 2.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, G * 0.5, 2.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, -G * 0.5);
        ctx.lineTo(cx + G * 0.3, G * 0.5);
        ctx.stroke();
      });
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(-G, 0);
      ctx.lineTo(G, 0);
      ctx.stroke();
      ctx.setLineDash([]);
      break;

    case 'fusivel':
      drawLeads();
      ctx.beginPath();
      ctx.rect(-G * 0.3, -G, G * 0.6, G * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -G);
      ctx.lineTo(0, G);
      ctx.stroke();
      break;

    case 'rele_termico':
      drawLeads();
      drawRect(G * 1.2, G * 1.6);
      // Heating element
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const cy = -G * 0.4 + i * G * 0.4;
        ctx.moveTo(-G * 0.3, cy);
        ctx.quadraticCurveTo(0, cy - G * 0.2, G * 0.3, cy);
      }
      ctx.stroke();
      break;

    case 'disjuntor_motor':
      drawLeads();
      drawRect(G * 1.4, G * 1.6, 'QM');
      break;

    // === PASSIVOS ===
    case 'resistor':
      drawLeads();
      ctx.beginPath();
      ctx.rect(-G * 0.6, -G, G * 1.2, G * 2);
      ctx.stroke();
      break;

    case 'capacitor':
      drawLeads();
      ctx.beginPath();
      ctx.moveTo(-G * 0.7, -G * 0.2);
      ctx.lineTo(G * 0.7, -G * 0.2);
      ctx.moveTo(-G * 0.7, G * 0.2);
      ctx.lineTo(G * 0.7, G * 0.2);
      ctx.stroke();
      break;

    case 'indutor':
      drawLeads();
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const cy = -G * 0.7 + i * G * 0.7;
        ctx.arc(0, cy, G * 0.35, -Math.PI, 0);
      }
      ctx.stroke();
      break;

    // === CHAVES / BOTOEIRAS ===
    case 'contato_na':
      drawLeads();
      drawContactNO();
      break;

    case 'contato_nf':
      drawLeads();
      drawContactNF();
      break;

    case 'botoeira_na':
      drawLeads();
      drawContactNO();
      // Push bar
      ctx.beginPath();
      ctx.moveTo(-G * 0.4, -G * 0.9);
      ctx.lineTo(G * 0.4, -G * 0.9);
      ctx.moveTo(0, -G * 0.9);
      ctx.lineTo(0, -G * 0.5);
      ctx.stroke();
      break;

    case 'botoeira_nf':
      drawLeads();
      drawContactNF();
      ctx.beginPath();
      ctx.moveTo(-G * 0.4, -G * 0.9);
      ctx.lineTo(G * 0.4, -G * 0.9);
      ctx.moveTo(0, -G * 0.9);
      ctx.lineTo(0, -G * 0.5);
      ctx.stroke();
      break;

    case 'botoeira_emergencia':
      drawLeads();
      drawContactNF();
      // Mushroom head
      ctx.beginPath();
      ctx.arc(0, -G * 0.9, G * 0.5, Math.PI, 0);
      ctx.stroke();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -G * 0.9, G * 0.35, Math.PI, 0);
      ctx.stroke();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = selected ? 2.5 : 2;
      break;

    case 'chave_seletora':
      drawLeads();
      drawContactNO();
      // Selector knob
      ctx.beginPath();
      ctx.arc(0, -G * 0.9, G * 0.25, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -G * 0.9);
      ctx.lineTo(G * 0.25, -G * 1.1);
      ctx.stroke();
      break;

    case 'chave_fim_curso':
      drawLeads();
      drawContactNO();
      // Roller
      ctx.beginPath();
      ctx.arc(G * 0.5, -G * 0.5, G * 0.15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(G * 0.35, -G * 0.5);
      ctx.lineTo(G * 0.15, -G * 0.5);
      ctx.stroke();
      break;

    case 'chave_pressao':
      drawLeads();
      drawContactNO();
      ctx.font = '8px JetBrains Mono';
      ctx.fillStyle = stroke;
      ctx.textAlign = 'center';
      ctx.fillText('P', G * 0.5, -G * 0.3);
      break;

    case 'chave_nivel':
      drawLeads();
      drawContactNO();
      ctx.font = '8px JetBrains Mono';
      ctx.fillStyle = stroke;
      ctx.textAlign = 'center';
      ctx.fillText('L', G * 0.5, -G * 0.3);
      break;

    case 'chave_fluxo':
      drawLeads();
      drawContactNO();
      ctx.font = '8px JetBrains Mono';
      ctx.fillStyle = stroke;
      ctx.textAlign = 'center';
      ctx.fillText('F', G * 0.5, -G * 0.3);
      break;

    // === SENSORES ===
    case 'sensor_indutivo':
      drawLeads();
      drawRect(G * 1.2, G * 1.4);
      ctx.font = '9px JetBrains Mono';
      ctx.fillStyle = stroke;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('IND', 0, 0);
      // Two horizontal lines at bottom
      ctx.beginPath();
      ctx.moveTo(-G * 0.5, G * 0.5);
      ctx.lineTo(G * 0.5, G * 0.5);
      ctx.moveTo(-G * 0.5, G * 0.3);
      ctx.lineTo(G * 0.5, G * 0.3);
      ctx.stroke();
      break;

    case 'sensor_capacitivo':
      drawLeads();
      drawRect(G * 1.2, G * 1.4);
      ctx.font = '9px JetBrains Mono';
      ctx.fillStyle = stroke;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CAP', 0, 0);
      ctx.beginPath();
      ctx.moveTo(-G * 0.3, G * 0.4);
      ctx.lineTo(G * 0.3, G * 0.4);
      ctx.moveTo(-G * 0.2, G * 0.5);
      ctx.lineTo(G * 0.2, G * 0.5);
      ctx.stroke();
      break;

    case 'sensor_optico':
      drawLeads();
      drawRect(G * 1.2, G * 1.4);
      ctx.font = '9px JetBrains Mono';
      ctx.fillStyle = stroke;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('OPT', 0, 0);
      // Light rays
      ctx.beginPath();
      ctx.moveTo(G * 0.2, -G * 0.3);
      ctx.lineTo(G * 0.5, -G * 0.5);
      ctx.moveTo(G * 0.2, -G * 0.1);
      ctx.lineTo(G * 0.5, -G * 0.3);
      ctx.stroke();
      break;

    case 'sensor_temperatura':
      drawLeads();
      drawRect(G * 1.2, G * 1.4);
      ctx.font = '9px JetBrains Mono';
      ctx.fillStyle = stroke;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('θ', 0, 0);
      break;

    // === CONTATORES ===
    case 'bobina_contator':
      drawLeads();
      drawRect(G * 1.2, G * 1.4, 'K');
      break;

    case 'contator_na':
      drawLeads();
      drawContactNO();
      // Contactor marking
      ctx.beginPath();
      ctx.moveTo(-G * 0.5, -G * 0.3);
      ctx.lineTo(-G * 0.5, G * 0.3);
      ctx.lineTo(G * 0.5, G * 0.3);
      ctx.lineTo(G * 0.5, -G * 0.3);
      ctx.stroke();
      break;

    case 'contator_nf':
      drawLeads();
      drawContactNF();
      ctx.beginPath();
      ctx.moveTo(-G * 0.5, -G * 0.3);
      ctx.lineTo(-G * 0.5, G * 0.3);
      ctx.lineTo(G * 0.5, G * 0.3);
      ctx.lineTo(G * 0.5, -G * 0.3);
      ctx.stroke();
      break;

    // === RELÉS ===
    case 'bobina_rele':
      drawLeads();
      drawRect(G * 1.2, G * 1.4);
      ctx.beginPath();
      ctx.moveTo(-G * 0.6, -G * 0.7);
      ctx.lineTo(G * 0.6, G * 0.7);
      ctx.moveTo(G * 0.6, -G * 0.7);
      ctx.lineTo(-G * 0.6, G * 0.7);
      ctx.stroke();
      break;

    case 'rele_na':
      drawLeads();
      drawContactNO();
      break;

    case 'rele_nf':
      drawLeads();
      drawContactNF();
      break;

    // === TEMPORIZADORES ===
    case 'temporizador_ton':
      drawLeads();
      drawCircle(G * 0.8, 'TON');
      break;

    case 'temporizador_tof':
      drawLeads();
      drawCircle(G * 0.8, 'TOF');
      break;

    case 'temporizador_tp':
      drawLeads();
      drawCircle(G * 0.8, 'TP');
      break;

    case 'contato_temp_na':
      drawLeads();
      drawContactNO();
      // Arc for timer
      ctx.beginPath();
      ctx.arc(G * 0.4, -G * 0.2, G * 0.2, -Math.PI * 0.7, Math.PI * 0.2);
      ctx.stroke();
      break;

    case 'contato_temp_nf':
      drawLeads();
      drawContactNF();
      ctx.beginPath();
      ctx.arc(G * 0.4, -G * 0.2, G * 0.2, -Math.PI * 0.7, Math.PI * 0.2);
      ctx.stroke();
      break;

    // === SAÍDAS / ATUADORES ===
    case 'lampada':
      drawLeads();
      drawLampGlow('#ffffff');
      drawCircle(G * 0.7);
      ctx.beginPath();
      ctx.moveTo(-G * 0.5, -G * 0.5);
      ctx.lineTo(G * 0.5, G * 0.5);
      ctx.moveTo(G * 0.5, -G * 0.5);
      ctx.lineTo(-G * 0.5, G * 0.5);
      ctx.stroke();
      break;

    case 'lampada_verde':
      drawLeads();
      drawLampGlow('#22c55e');
      if (simState === 'on') {
        ctx.strokeStyle = '#22c55e';
      }
      drawCircle(G * 0.7);
      ctx.beginPath();
      ctx.moveTo(-G * 0.5, -G * 0.5);
      ctx.lineTo(G * 0.5, G * 0.5);
      ctx.moveTo(G * 0.5, -G * 0.5);
      ctx.lineTo(-G * 0.5, G * 0.5);
      ctx.stroke();
      break;

    case 'lampada_vermelha':
      drawLeads();
      drawLampGlow('#ef4444');
      if (simState === 'on') {
        ctx.strokeStyle = '#ef4444';
      }
      drawCircle(G * 0.7);
      ctx.beginPath();
      ctx.moveTo(-G * 0.5, -G * 0.5);
      ctx.lineTo(G * 0.5, G * 0.5);
      ctx.moveTo(G * 0.5, -G * 0.5);
      ctx.lineTo(-G * 0.5, G * 0.5);
      ctx.stroke();
      break;

    case 'lampada_amarela':
      drawLeads();
      drawLampGlow('#eab308');
      if (simState === 'on') {
        ctx.strokeStyle = '#eab308';
      }
      drawCircle(G * 0.7);
      ctx.beginPath();
      ctx.moveTo(-G * 0.5, -G * 0.5);
      ctx.lineTo(G * 0.5, G * 0.5);
      ctx.moveTo(G * 0.5, -G * 0.5);
      ctx.lineTo(-G * 0.5, G * 0.5);
      ctx.stroke();
      break;

    case 'motor_mono':
      drawLeads();
      drawCircle(G * 0.8, 'M');
      ctx.font = '7px JetBrains Mono';
      ctx.fillStyle = stroke;
      ctx.textAlign = 'center';
      ctx.fillText('1~', 0, G * 0.35);
      break;

    case 'motor_tri':
      // Three leads top
      ctx.beginPath();
      [-G, 0, G].forEach(cx => {
        ctx.moveTo(cx, -G * 2);
        ctx.lineTo(cx, -G);
      });
      ctx.stroke();
      drawCircle(G * 0.9, 'M');
      ctx.font = '7px JetBrains Mono';
      ctx.fillStyle = stroke;
      ctx.textAlign = 'center';
      ctx.fillText('3~', 0, G * 0.4);
      // Bottom lead
      ctx.beginPath();
      ctx.moveTo(0, G * 0.9);
      ctx.lineTo(0, G * 2);
      ctx.stroke();
      break;

    case 'motor_dc':
      drawLeads();
      drawCircle(G * 0.8, 'M');
      ctx.font = '7px JetBrains Mono';
      ctx.fillStyle = stroke;
      ctx.textAlign = 'center';
      ctx.fillText('DC', 0, G * 0.35);
      break;

    case 'sirene':
      drawLeads();
      drawCircle(G * 0.7);
      ctx.font = '9px Inter';
      ctx.fillStyle = stroke;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔊', 0, 0);
      break;

    case 'buzzer':
      drawLeads();
      drawCircle(G * 0.6);
      ctx.font = 'bold 10px Inter';
      ctx.fillStyle = stroke;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('BZ', 0, 0);
      break;

    case 'solenoide':
      drawLeads();
      drawRect(G * 1.2, G * 1.4, 'SOL');
      // Arrow
      ctx.beginPath();
      ctx.moveTo(0, G * 0.3);
      ctx.lineTo(G * 0.2, G * 0.1);
      ctx.moveTo(0, G * 0.3);
      ctx.lineTo(-G * 0.2, G * 0.1);
      ctx.stroke();
      break;

    case 'ventilador':
      drawLeads();
      drawCircle(G * 0.8);
      // Fan blades
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const angle = (i * Math.PI * 2) / 3 - Math.PI / 2;
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * G * 0.5, Math.sin(angle) * G * 0.5);
      }
      ctx.stroke();
      break;

    // === TRANSFORMADORES ===
    case 'transformador':
    case 'transformador_ct':
      // Primary leads
      ctx.beginPath();
      ctx.moveTo(-G, -G * 2);
      ctx.lineTo(-G, -G);
      ctx.moveTo(-G, G);
      ctx.lineTo(-G, G * 2);
      // Secondary leads
      ctx.moveTo(G, -G * 2);
      ctx.lineTo(G, -G);
      ctx.moveTo(G, G);
      ctx.lineTo(G, G * 2);
      ctx.stroke();
      // Primary coils
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        ctx.arc(-G * 0.3, -G * 0.6 + i * G * 0.6, G * 0.3, -Math.PI, 0);
      }
      ctx.stroke();
      // Secondary coils
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        ctx.arc(G * 0.3, -G * 0.6 + i * G * 0.6, G * 0.3, 0, Math.PI);
      }
      ctx.stroke();
      // Core
      ctx.beginPath();
      ctx.moveTo(-G * 0.05, -G);
      ctx.lineTo(-G * 0.05, G);
      ctx.moveTo(G * 0.05, -G);
      ctx.lineTo(G * 0.05, G);
      ctx.stroke();
      break;

    // === CLP ===
    case 'clp_entrada':
      drawLeads();
      ctx.beginPath();
      ctx.rect(-G * 0.8, -G * 0.8, G * 1.6, G * 1.6);
      ctx.stroke();
      ctx.font = '8px JetBrains Mono';
      ctx.fillStyle = stroke;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CLP', 0, -G * 0.2);
      ctx.fillText('IN', 0, G * 0.3);
      // Arrow in
      ctx.beginPath();
      ctx.moveTo(-G * 0.8, 0);
      ctx.lineTo(-G * 0.5, 0);
      ctx.lineTo(-G * 0.6, -G * 0.1);
      ctx.moveTo(-G * 0.5, 0);
      ctx.lineTo(-G * 0.6, G * 0.1);
      ctx.stroke();
      break;

    case 'clp_saida':
      drawLeads();
      ctx.beginPath();
      ctx.rect(-G * 0.8, -G * 0.8, G * 1.6, G * 1.6);
      ctx.stroke();
      ctx.font = '8px JetBrains Mono';
      ctx.fillStyle = stroke;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CLP', 0, -G * 0.2);
      ctx.fillText('OUT', 0, G * 0.3);
      // Arrow out
      ctx.beginPath();
      ctx.moveTo(G * 0.5, 0);
      ctx.lineTo(G * 0.8, 0);
      ctx.lineTo(G * 0.7, -G * 0.1);
      ctx.moveTo(G * 0.8, 0);
      ctx.lineTo(G * 0.7, G * 0.1);
      ctx.stroke();
      break;

    // === CONECTORES ===
    case 'borne':
      ctx.beginPath();
      ctx.moveTo(0, -G);
      ctx.lineTo(0, G);
      ctx.moveTo(-G, 0);
      ctx.lineTo(G, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fillStyle = stroke;
      ctx.fill();
      break;

    case 'juncao':
      ctx.beginPath();
      ctx.moveTo(0, -G);
      ctx.lineTo(0, G);
      ctx.moveTo(-G, 0);
      ctx.lineTo(G, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fillStyle = stroke;
      ctx.fill();
      break;

    case 'conector':
      drawLeads();
      ctx.beginPath();
      ctx.arc(0, 0, G * 0.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fillStyle = stroke;
      ctx.fill();
      break;

    default:
      drawLeads();
      drawRect(G * 1.2, G * 1.4, '?');
      break;
  }

  ctx.restore();
}

export function getComponentBounds(type: ComponentType): { width: number; height: number } {
  switch (type) {
    case 'disjuntor_bipolar':
    case 'transformador':
    case 'transformador_ct':
      return { width: 40, height: 80 };
    case 'disjuntor_tripolar':
    case 'motor_tri':
      return { width: 40, height: 80 };
    case 'juncao':
    case 'borne':
      return { width: 20, height: 20 };
    default:
      return { width: 30, height: 80 };
  }
}

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}
