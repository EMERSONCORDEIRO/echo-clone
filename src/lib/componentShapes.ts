import { ComponentType, Terminal, Point } from '@/types/schematic';

const GRID = 20;

export function getTerminals(type: ComponentType): Terminal[] {
  const common2 = (): Terminal[] => [
    { id: 't1', position: { x: 0, y: -GRID * 2 }, connected: false },
    { id: 't2', position: { x: 0, y: GRID * 2 }, connected: false },
  ];

  switch (type) {
    case 'ground':
      return [{ id: 't1', position: { x: 0, y: -GRID * 2 }, connected: false }];
    case 'transformer':
      return [
        { id: 't1', position: { x: -GRID, y: -GRID * 2 }, connected: false },
        { id: 't2', position: { x: GRID, y: -GRID * 2 }, connected: false },
        { id: 't3', position: { x: -GRID, y: GRID * 2 }, connected: false },
        { id: 't4', position: { x: GRID, y: GRID * 2 }, connected: false },
      ];
    default:
      return common2();
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
  selectionColor: string
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

  const G = GRID;

  // Draw terminal lines
  ctx.beginPath();
  ctx.moveTo(0, -G * 2);
  ctx.lineTo(0, -G);
  if (type !== 'ground') {
    ctx.moveTo(0, G);
    ctx.lineTo(0, G * 2);
  }
  ctx.stroke();

  switch (type) {
    case 'resistor':
      ctx.beginPath();
      ctx.rect(-G * 0.6, -G, G * 1.2, G * 2);
      ctx.stroke();
      break;

    case 'capacitor':
      ctx.beginPath();
      ctx.moveTo(-G * 0.7, -G * 0.2);
      ctx.lineTo(G * 0.7, -G * 0.2);
      ctx.moveTo(-G * 0.7, G * 0.2);
      ctx.lineTo(G * 0.7, G * 0.2);
      ctx.stroke();
      break;

    case 'inductor':
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const cy = -G * 0.7 + i * G * 0.7;
        ctx.arc(0, cy, G * 0.35, -Math.PI, 0);
      }
      ctx.stroke();
      break;

    case 'switch_no':
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
      break;

    case 'switch_nc':
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
      break;

    case 'push_button_no':
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
      // push line
      ctx.beginPath();
      ctx.moveTo(-G * 0.3, -G * 0.8);
      ctx.lineTo(G * 0.3, -G * 0.8);
      ctx.stroke();
      break;

    case 'push_button_nc':
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
      ctx.beginPath();
      ctx.moveTo(-G * 0.3, -G * 0.8);
      ctx.lineTo(G * 0.3, -G * 0.8);
      ctx.stroke();
      break;

    case 'lamp':
      ctx.beginPath();
      ctx.arc(0, 0, G * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-G * 0.5, -G * 0.5);
      ctx.lineTo(G * 0.5, G * 0.5);
      ctx.moveTo(G * 0.5, -G * 0.5);
      ctx.lineTo(-G * 0.5, G * 0.5);
      ctx.stroke();
      break;

    case 'motor':
      ctx.beginPath();
      ctx.arc(0, 0, G * 0.8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = '14px Inter';
      ctx.fillStyle = stroke;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('M', 0, 0);
      break;

    case 'contactor_coil':
      ctx.beginPath();
      ctx.rect(-G * 0.6, -G * 0.7, G * 1.2, G * 1.4);
      ctx.stroke();
      ctx.font = '11px Inter';
      ctx.fillStyle = stroke;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('K', 0, 0);
      break;

    case 'contactor_no':
      ctx.beginPath();
      ctx.moveTo(-G * 0.4, -G * 0.3);
      ctx.lineTo(-G * 0.4, G * 0.3);
      ctx.lineTo(G * 0.4, G * 0.3);
      ctx.lineTo(G * 0.4, -G * 0.3);
      ctx.stroke();
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
      break;

    case 'contactor_nc':
      ctx.beginPath();
      ctx.moveTo(-G * 0.4, -G * 0.3);
      ctx.lineTo(-G * 0.4, G * 0.3);
      ctx.lineTo(G * 0.4, G * 0.3);
      ctx.lineTo(G * 0.4, -G * 0.3);
      ctx.stroke();
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
      break;

    case 'relay_coil':
      ctx.beginPath();
      ctx.rect(-G * 0.6, -G * 0.7, G * 1.2, G * 1.4);
      ctx.stroke();
      // Diagonal lines for relay
      ctx.beginPath();
      ctx.moveTo(-G * 0.6, -G * 0.7);
      ctx.lineTo(G * 0.6, G * 0.7);
      ctx.moveTo(G * 0.6, -G * 0.7);
      ctx.lineTo(-G * 0.6, G * 0.7);
      ctx.stroke();
      break;

    case 'timer_on':
      ctx.beginPath();
      ctx.arc(0, 0, G * 0.8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = '10px Inter';
      ctx.fillStyle = stroke;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TON', 0, 0);
      break;

    case 'timer_off':
      ctx.beginPath();
      ctx.arc(0, 0, G * 0.8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = '10px Inter';
      ctx.fillStyle = stroke;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TOF', 0, 0);
      break;

    case 'fuse':
      ctx.beginPath();
      ctx.rect(-G * 0.3, -G, G * 0.6, G * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -G);
      ctx.lineTo(0, G);
      ctx.stroke();
      break;

    case 'overload':
      ctx.beginPath();
      ctx.rect(-G * 0.5, -G * 0.8, G, G * 1.6);
      ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const cy = -G * 0.4 + i * G * 0.4;
        ctx.moveTo(-G * 0.3, cy);
        ctx.quadraticCurveTo(0, cy - G * 0.2, G * 0.3, cy);
      }
      ctx.stroke();
      break;

    case 'transformer':
      // Primary
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        ctx.arc(-G * 0.3, -G * 0.5 + i * G * 0.5, G * 0.25, -Math.PI, 0);
      }
      ctx.stroke();
      // Secondary
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        ctx.arc(G * 0.3, -G * 0.5 + i * G * 0.5, G * 0.25, 0, Math.PI);
      }
      ctx.stroke();
      // Core lines
      ctx.beginPath();
      ctx.moveTo(-G * 0.05, -G);
      ctx.lineTo(-G * 0.05, G);
      ctx.moveTo(G * 0.05, -G);
      ctx.lineTo(G * 0.05, G);
      ctx.stroke();
      break;

    case 'power_supply':
      ctx.beginPath();
      ctx.arc(0, 0, G * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      // Plus
      ctx.beginPath();
      ctx.moveTo(-G * 0.3, -G * 0.15);
      ctx.lineTo(G * 0.05, -G * 0.15);
      ctx.moveTo(-G * 0.12, -G * 0.35);
      ctx.lineTo(-G * 0.12, G * 0.05);
      ctx.stroke();
      // Minus
      ctx.beginPath();
      ctx.moveTo(G * 0.05, G * 0.2);
      ctx.lineTo(G * 0.35, G * 0.2);
      ctx.stroke();
      break;

    case 'ground':
      ctx.beginPath();
      ctx.moveTo(-G * 0.6, 0);
      ctx.lineTo(G * 0.6, 0);
      ctx.moveTo(-G * 0.4, G * 0.3);
      ctx.lineTo(G * 0.4, G * 0.3);
      ctx.moveTo(-G * 0.2, G * 0.6);
      ctx.lineTo(G * 0.2, G * 0.6);
      ctx.stroke();
      break;
  }

  ctx.restore();
}

export function getComponentBounds(type: ComponentType): { width: number; height: number } {
  return { width: GRID * 2, height: GRID * 4 };
}

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}
