/**
 * Parser para arquivos do CADe SIMU (.cad, .dxf)
 * 
 * Suporta:
 * 1. DXF (formato padrão que o CADe SIMU pode exportar)
 * 2. XML (algumas versões)
 * 3. JSON (nosso formato)
 * 4. Binário (extração de labels do .cad proprietário)
 */

import { SchematicComponent, Wire, ComponentType } from '@/types/schematic';
import { getTerminals, snapToGrid } from '@/lib/componentShapes';
import { componentLabelsMap } from '@/lib/componentCategories';

let importIdCounter = 1000;
const genImportId = () => `imp_${++importIdCounter}`;

// Mapeamento de labels do CADe SIMU para nossos tipos
const LABEL_PATTERNS: [RegExp, ComponentType][] = [
  // Contatores (K)
  [/^-?K\d+$/i, 'bobina_contator'],
  // Motores (M)
  [/^-?M\d+$/i, 'motor_tri'],
  // Botoeiras / Chaves (S, B)
  [/^-?S\d+$/i, 'botoeira_na'],
  [/^-?B\d+$/i, 'botoeira_na'],
  // Lâmpadas / Sinalizadores (H)
  [/^-?H\d+$/i, 'lampada'],
  // Fusíveis (F)
  [/^-?F\d+$/i, 'fusivel'],
  // Disjuntores (Q)
  [/^-?Q\d+$/i, 'disjuntor_monopolar'],
  // Relés térmicos (FT)
  [/^-?FT\d+$/i, 'rele_termico'],
  // Temporizadores (T, KT)
  [/^-?KT\d+$/i, 'temporizador_ton'],
  [/^-?T\d+$/i, 'temporizador_ton'],
  // Transformadores (TC, T)
  [/^-?TC\d+$/i, 'transformador'],
  // Disjuntor geral
  [/^-?DJ\d*$/i, 'disjuntor_tripolar'],
  // Fases
  [/^L1$/i, 'fase_l1'],
  [/^L2$/i, 'fase_l2'],
  [/^L3$/i, 'fase_l3'],
  // Neutro / Terra
  [/^N$/i, 'neutro'],
  [/^PE$/i, 'terra'],
  [/^FE$/i, 'terra'],
  // CLP / PLC
  [/^-?CLP/i, 'clp_entrada'],
  [/^-?PLC/i, 'clp_entrada'],
  // Entradas/Saídas digitais CLP
  [/^I\d+\.\d+$/i, 'clp_entrada'],
  [/^Q\d+\.\d+$/i, 'clp_saida'],
  [/^DI$/i, 'clp_entrada'],
  [/^DO$/i, 'clp_saida'],
  // Bornes (X)
  [/^-?X\d+$/i, 'borne'],
  // Sirene/Buzzer
  [/^-?HA\d+$/i, 'sirene'],
  // Solenoide (Y)
  [/^-?Y\d+$/i, 'solenoide'],
  // Ventilador
  [/^-?V\d+$/i, 'ventilador'],
  // Labels genéricos
  [/^B3L$/i, 'lampada'],
  [/^B3S$/i, 'sirene'],
];

function inferComponentType(name: string): ComponentType | null {
  const clean = name.trim();
  for (const [pattern, type] of LABEL_PATTERNS) {
    if (pattern.test(clean)) return type;
  }
  
  const lower = clean.toLowerCase();
  if (lower.includes('motor')) return 'motor_tri';
  if (lower.includes('contator') || lower.includes('contactor')) return 'bobina_contator';
  if (lower.includes('rele') || lower.includes('relay')) return 'bobina_rele';
  if (lower.includes('lamp') || lower.includes('luz')) return 'lampada';
  if (lower.includes('disjuntor') || lower.includes('breaker')) return 'disjuntor_monopolar';
  if (lower.includes('fusiv') || lower.includes('fuse')) return 'fusivel';
  if (lower.includes('botoeir') || lower.includes('button')) return 'botoeira_na';
  if (lower.includes('sensor')) return 'sensor_indutivo';
  if (lower.includes('timer') || lower.includes('temporizador')) return 'temporizador_ton';
  if (lower.includes('transf')) return 'transformador';
  
  return null;
}

export interface ParseResult {
  components: SchematicComponent[];
  wires: Wire[];
  success: boolean;
  message: string;
  format: 'json' | 'dxf' | 'xml' | 'binary' | 'unknown';
  warnings: string[];
}

/**
 * Ponto de entrada principal - detecta formato e delega ao parser correto
 */
export function parseCadeSimuFile(content: ArrayBuffer | string): ParseResult {
  const warnings: string[] = [];

  if (typeof content === 'string') {
    return parseStringContent(content, warnings);
  }

  const bytes = new Uint8Array(content);

  // Tenta UTF-8
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  // Tenta Latin1
  const latin1 = new TextDecoder('iso-8859-1').decode(bytes);

  // Detecta DXF (contém "SECTION" e "ENDSEC" e "ENTITIES" ou "EOF")
  const textToCheck = utf8.includes('SECTION') ? utf8 : latin1.includes('SECTION') ? latin1 : null;
  if (textToCheck && (textToCheck.includes('ENTITIES') || textToCheck.includes('HEADER') || textToCheck.includes('EOF'))) {
    return parseDXF(textToCheck, warnings);
  }

  // Detecta XML
  const xmlText = utf8.trim().startsWith('<?xml') || utf8.trim().startsWith('<') ? utf8 
    : latin1.trim().startsWith('<?xml') || latin1.trim().startsWith('<') ? latin1 
    : null;
  if (xmlText) {
    return parseCadeXML(xmlText, warnings);
  }

  // Detecta JSON
  try {
    const json = JSON.parse(utf8);
    if (json.components && json.wires) {
      return { components: json.components, wires: json.wires, success: true, message: 'Arquivo JSON carregado.', format: 'json', warnings: [] };
    }
  } catch {}

  // Binário - extrai strings e coordenadas
  return parseBinaryContent(bytes, warnings);
}

function parseStringContent(text: string, warnings: string[]): ParseResult {
  const trimmed = text.trim();

  // JSON
  try {
    const json = JSON.parse(trimmed);
    if (json.components && json.wires) {
      return { components: json.components, wires: json.wires, success: true, message: 'Arquivo JSON carregado.', format: 'json', warnings: [] };
    }
  } catch {}

  // DXF
  if (trimmed.includes('SECTION') && (trimmed.includes('ENTITIES') || trimmed.includes('EOF'))) {
    return parseDXF(trimmed, warnings);
  }

  // XML
  if (trimmed.startsWith('<?xml') || trimmed.startsWith('<')) {
    return parseCadeXML(trimmed, warnings);
  }

  // Text extraction
  return parseTextLabels(trimmed, warnings);
}

// ===========================
// DXF PARSER
// ===========================
function parseDXF(dxf: string, warnings: string[]): ParseResult {
  const components: SchematicComponent[] = [];
  const wires: Wire[] = [];
  const foundLabels = new Set<string>();

  // Parse DXF into group code pairs
  const lines = dxf.split(/\r?\n/);
  const pairs: { code: number; value: string }[] = [];
  for (let i = 0; i < lines.length - 1; i += 2) {
    const code = parseInt(lines[i].trim(), 10);
    const value = lines[i + 1]?.trim() || '';
    if (!isNaN(code)) {
      pairs.push({ code, value });
    }
  }

  // Find ENTITIES section
  let inEntities = false;
  let currentEntity: string | null = null;
  let entityData: Record<number, string> = {};

  const entities: { type: string; data: Record<number, string> }[] = [];

  for (const { code, value } of pairs) {
    if (code === 2 && value === 'ENTITIES') {
      inEntities = true;
      continue;
    }
    if (code === 0 && value === 'ENDSEC' && inEntities) {
      if (currentEntity) entities.push({ type: currentEntity, data: { ...entityData } });
      inEntities = false;
      continue;
    }

    if (!inEntities) continue;

    if (code === 0) {
      // New entity
      if (currentEntity) {
        entities.push({ type: currentEntity, data: { ...entityData } });
      }
      currentEntity = value;
      entityData = {};
    } else {
      // Only keep first occurrence of each group code per entity
      if (!(code in entityData)) {
        entityData[code] = value;
      }
    }
  }

  // Also extract TEXT entities from any section for labels
  const allTexts: { text: string; x: number; y: number }[] = [];

  // Process entities
  for (const ent of entities) {
    const d = ent.data;

    switch (ent.type) {
      case 'LINE': {
        const x1 = parseFloat(d[10] || '0');
        const y1 = parseFloat(d[20] || '0');
        const x2 = parseFloat(d[11] || '0');
        const y2 = parseFloat(d[21] || '0');
        if (x1 !== x2 || y1 !== y2) {
          wires.push({
            id: genImportId(),
            points: [
              { x: snapToGrid(x1, 20), y: snapToGrid(Math.abs(y1), 20) },
              { x: snapToGrid(x2, 20), y: snapToGrid(Math.abs(y2), 20) },
            ],
          });
        }
        break;
      }

      case 'LWPOLYLINE':
      case 'POLYLINE': {
        // Simplified - just create a wire from available vertex data
        const x1 = parseFloat(d[10] || '0');
        const y1 = parseFloat(d[20] || '0');
        if (x1 || y1) {
          // We'd need full vertex parsing for polylines
          // For now treat as position marker
        }
        break;
      }

      case 'TEXT':
      case 'MTEXT': {
        const text = d[1] || '';
        const tx = parseFloat(d[10] || '0');
        const ty = parseFloat(d[20] || '0');
        allTexts.push({ text, x: tx, y: Math.abs(ty) });

        // Try to identify as component label
        const type = inferComponentType(text);
        if (type && !foundLabels.has(text.toUpperCase())) {
          foundLabels.add(text.toUpperCase());
          components.push({
            id: genImportId(),
            type,
            position: { x: snapToGrid(tx, 20), y: snapToGrid(Math.abs(ty), 20) },
            rotation: 0,
            label: text.toUpperCase(),
            terminals: getTerminals(type),
            properties: {},
          });
        }
        break;
      }

      case 'INSERT': {
        // INSERT references a block - the block name often indicates the component type
        const blockName = d[2] || '';
        const ix = parseFloat(d[10] || '0');
        const iy = parseFloat(d[20] || '0');
        const rotation = parseFloat(d[50] || '0');

        const type = inferComponentType(blockName);
        if (type && !foundLabels.has(blockName.toUpperCase())) {
          foundLabels.add(blockName.toUpperCase());
          components.push({
            id: genImportId(),
            type,
            position: { x: snapToGrid(ix, 20), y: snapToGrid(Math.abs(iy), 20) },
            rotation: Math.round(rotation / 90) * 90 % 360,
            label: blockName.toUpperCase(),
            terminals: getTerminals(type),
            properties: {},
          });
        }
        break;
      }

      case 'CIRCLE': {
        // Circles might represent connection points/junctions
        const cx = parseFloat(d[10] || '0');
        const cy = parseFloat(d[20] || '0');
        const radius = parseFloat(d[40] || '0');
        if (radius < 5) {
          // Small circle = junction
          components.push({
            id: genImportId(),
            type: 'juncao',
            position: { x: snapToGrid(cx, 20), y: snapToGrid(Math.abs(cy), 20) },
            rotation: 0,
            label: 'Junção',
            terminals: getTerminals('juncao'),
            properties: {},
          });
        }
        break;
      }
    }
  }

  // If no components found from entities, try to find labels in text entities
  if (components.length === 0 && allTexts.length > 0) {
    for (const t of allTexts) {
      const type = inferComponentType(t.text);
      if (type && !foundLabels.has(t.text.toUpperCase())) {
        foundLabels.add(t.text.toUpperCase());
        components.push({
          id: genImportId(),
          type,
          position: { x: snapToGrid(t.x, 20), y: snapToGrid(t.y, 20) },
          rotation: 0,
          label: t.text.toUpperCase(),
          terminals: getTerminals(type),
          properties: {},
        });
      }
    }
  }

  if (components.length === 0 && wires.length === 0) {
    warnings.push('Arquivo DXF não contém componentes elétricos reconhecíveis.');
    return createFallbackResult(warnings, 'dxf');
  }

  return {
    components,
    wires,
    success: true,
    message: `DXF importado: ${components.length} componentes e ${wires.length} fios.`,
    format: 'dxf',
    warnings,
  };
}

// ===========================
// XML PARSER
// ===========================
function parseCadeXML(xml: string, warnings: string[]): ParseResult {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    
    if (doc.querySelector('parsererror')) {
      warnings.push('XML com erros de sintaxe.');
    }
    
    const components: SchematicComponent[] = [];
    const wires: Wire[] = [];
    
    doc.querySelectorAll('*').forEach(el => {
      const tag = el.tagName.toLowerCase();
      const name = el.getAttribute('name') || el.getAttribute('id') || el.getAttribute('label') || '';
      const x = parseFloat(el.getAttribute('x') || el.getAttribute('posX') || el.getAttribute('left') || '0');
      const y = parseFloat(el.getAttribute('y') || el.getAttribute('posY') || el.getAttribute('top') || '0');
      const rotation = parseFloat(el.getAttribute('rotation') || el.getAttribute('angle') || '0');
      
      if (tag.includes('component') || tag.includes('symbol') || tag.includes('element') || tag.includes('device') || tag.includes('part')) {
        const type = inferComponentType(name || tag) || 'borne';
        components.push({
          id: genImportId(),
          type,
          position: { x: snapToGrid(x, 20), y: snapToGrid(y, 20) },
          rotation: Math.round(rotation / 90) * 90 % 360,
          label: name || componentLabelsMap[type] || type,
          terminals: getTerminals(type),
          properties: {},
        });
      }
      
      if (tag.includes('wire') || tag.includes('line') || tag.includes('connection')) {
        const x1 = parseFloat(el.getAttribute('x1') || '0');
        const y1 = parseFloat(el.getAttribute('y1') || '0');
        const x2 = parseFloat(el.getAttribute('x2') || '0');
        const y2 = parseFloat(el.getAttribute('y2') || '0');
        if (x1 !== x2 || y1 !== y2) {
          wires.push({
            id: genImportId(),
            points: [
              { x: snapToGrid(x1, 20), y: snapToGrid(y1, 20) },
              { x: snapToGrid(x2, 20), y: snapToGrid(y2, 20) },
            ],
          });
        }
      }
    });
    
    if (components.length === 0 && wires.length === 0) {
      return createFallbackResult(warnings, 'xml');
    }
    
    return {
      components, wires, success: true,
      message: `XML importado: ${components.length} componentes e ${wires.length} fios.`,
      format: 'xml', warnings,
    };
  } catch (e) {
    warnings.push(`Erro XML: ${e}`);
    return createFallbackResult(warnings, 'xml');
  }
}

// ===========================
// BINARY PARSER (improved)
// ===========================
function parseBinaryContent(bytes: Uint8Array, warnings: string[]): ParseResult {
  const components: SchematicComponent[] = [];
  const wires: Wire[] = [];
  const foundLabels = new Set<string>();

  // Extract all readable strings (3+ printable chars)
  const strings: { text: string; offset: number }[] = [];
  let current = '';
  let startOffset = 0;
  
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b >= 32 && b < 127) {
      if (current.length === 0) startOffset = i;
      current += String.fromCharCode(b);
    } else {
      if (current.length >= 2) {
        strings.push({ text: current, offset: startOffset });
      }
      current = '';
    }
  }
  if (current.length >= 2) strings.push({ text: current, offset: startOffset });

  // Also try Latin1 for accented characters
  const latin1 = new TextDecoder('iso-8859-1').decode(bytes);
  
  // Check if it's actually a DXF hidden in a .cad extension
  if (latin1.includes('SECTION') && (latin1.includes('ENTITIES') || latin1.includes('EOF'))) {
    return parseDXF(latin1, warnings);
  }

  // Try to find coordinate pairs near component labels
  // CADe SIMU stores float32 or int16 coordinates near component data
  const labelRegex = /\b([KMSQFHB]\d{1,3}|DJ\d*|L[123]|PE|FE|N|M\d{1,3}|I\d+\.\d+|Q\d+\.\d+|KT\d+|FT\d+|TC\d+|HA\d+|X\d+|Y\d+|B3[LS]|U[123]|V[123]|W[123])\b/g;

  // Scan all extracted strings for labels
  for (const { text, offset } of strings) {
    const matches = text.match(labelRegex);
    if (matches) {
      for (const match of matches) {
        const upper = match.toUpperCase();
        if (foundLabels.has(upper)) continue;
        
        const type = inferComponentType(match);
        if (!type) continue;
        
        foundLabels.add(upper);

        // Try to extract nearby float32 coordinates from binary
        let posX = 0, posY = 0;
        const searchStart = Math.max(0, offset - 32);
        const searchEnd = Math.min(bytes.length - 4, offset + text.length + 32);
        
        // Look for float32 pairs that look like coordinates (0-2000 range)
        for (let j = searchStart; j < searchEnd; j += 4) {
          if (j + 8 <= bytes.length) {
            const view = new DataView(bytes.buffer, j, 8);
            try {
              const fx = view.getFloat32(0, true); // little-endian
              const fy = view.getFloat32(4, true);
              if (fx > 0 && fx < 2000 && fy > 0 && fy < 2000 && isFinite(fx) && isFinite(fy)) {
                posX = fx;
                posY = fy;
                break;
              }
            } catch {}
          }
        }
        
        // If no coords found, also try int16
        if (posX === 0 && posY === 0) {
          for (let j = searchStart; j < searchEnd; j += 2) {
            if (j + 4 <= bytes.length) {
              const view = new DataView(bytes.buffer, j, 4);
              try {
                const ix = view.getInt16(0, true);
                const iy = view.getInt16(2, true);
                if (ix > 10 && ix < 2000 && iy > 10 && iy < 2000) {
                  posX = ix;
                  posY = iy;
                  break;
                }
              } catch {}
            }
          }
        }

        components.push({
          id: genImportId(),
          type,
          position: { x: snapToGrid(posX || 0, 20), y: snapToGrid(posY || 0, 20) },
          rotation: 0,
          label: upper,
          terminals: getTerminals(type),
          properties: {},
        });
      }
    }
  }

  // Auto-layout if no valid positions were found
  const hasPositions = components.some(c => c.position.x > 0 && c.position.y > 0);
  if (!hasPositions && components.length > 0) {
    autoLayoutComponents(components);
    warnings.push('Posições originais não encontradas — layout automático aplicado.');
  }

  // Try to extract wire data from binary
  // Look for sequences of coordinate pairs
  for (let i = 0; i < bytes.length - 16; i += 4) {
    try {
      const view = new DataView(bytes.buffer, i, 16);
      const x1 = view.getFloat32(0, true);
      const y1 = view.getFloat32(4, true);
      const x2 = view.getFloat32(8, true);
      const y2 = view.getFloat32(12, true);
      
      if (isValidCoord(x1) && isValidCoord(y1) && isValidCoord(x2) && isValidCoord(y2)) {
        if ((x1 !== x2 || y1 !== y2) && distance(x1, y1, x2, y2) < 500 && distance(x1, y1, x2, y2) > 5) {
          wires.push({
            id: genImportId(),
            points: [
              { x: snapToGrid(x1, 20), y: snapToGrid(y1, 20) },
              { x: snapToGrid(x2, 20), y: snapToGrid(y2, 20) },
            ],
          });
        }
      }
    } catch {}
  }

  // Deduplicate wires
  const uniqueWires = deduplicateWires(wires);

  if (components.length === 0) {
    return createFallbackResult(warnings, 'binary');
  }

  if (uniqueWires.length > 200) {
    // Too many wires = probably false positives from binary parsing
    warnings.push('Fios extraídos do binário podem conter falsos positivos.');
    return {
      components, wires: [],
      success: true,
      message: `Binário: ${components.length} componentes identificados. Reconecte os fios manualmente.`,
      format: 'binary', warnings,
    };
  }

  return {
    components,
    wires: uniqueWires,
    success: true,
    message: `Binário: ${components.length} componentes${uniqueWires.length > 0 ? ` e ${uniqueWires.length} fios` : ''}. Verifique posições e conexões.`,
    format: 'binary',
    warnings,
  };
}

// ===========================
// TEXT LABEL EXTRACTION
// ===========================
function parseTextLabels(text: string, warnings: string[]): ParseResult {
  const components: SchematicComponent[] = [];
  const foundLabels = new Set<string>();
  const labelRegex = /\b([KMSQFHB]\d{1,3}|DJ\d*|L[123]|PE|FE|N|M\d{1,3}|I\d+\.\d+|Q\d+\.\d+|KT\d+|FT\d+)\b/g;

  let match;
  while ((match = labelRegex.exec(text)) !== null) {
    const label = match[1].toUpperCase();
    if (foundLabels.has(label)) continue;
    const type = inferComponentType(match[1]);
    if (!type) continue;
    foundLabels.add(label);
    components.push({
      id: genImportId(),
      type,
      position: { x: 0, y: 0 },
      rotation: 0,
      label,
      terminals: getTerminals(type),
      properties: {},
    });
  }

  if (components.length === 0) {
    return createFallbackResult(warnings, 'unknown');
  }

  autoLayoutComponents(components);
  warnings.push('Layout automático aplicado.');

  return {
    components, wires: [],
    success: true,
    message: `${components.length} componentes identificados.`,
    format: 'unknown', warnings,
  };
}

// ===========================
// HELPERS
// ===========================

function autoLayoutComponents(components: SchematicComponent[]) {
  // Group by type category for a logical layout
  const sources = components.filter(c => ['fonte_ac', 'fonte_dc', 'fase_l1', 'fase_l2', 'fase_l3', 'neutro', 'terra'].includes(c.type));
  const protection = components.filter(c => ['disjuntor_monopolar', 'disjuntor_bipolar', 'disjuntor_tripolar', 'fusivel', 'rele_termico', 'disjuntor_motor'].includes(c.type));
  const switches = components.filter(c => ['contato_na', 'contato_nf', 'botoeira_na', 'botoeira_nf', 'botoeira_emergencia', 'chave_seletora', 'chave_fim_curso'].includes(c.type));
  const coils = components.filter(c => ['bobina_contator', 'bobina_rele', 'contator_na', 'contator_nf', 'rele_na', 'rele_nf'].includes(c.type));
  const loads = components.filter(c => ['lampada', 'lampada_verde', 'lampada_vermelha', 'lampada_amarela', 'motor_mono', 'motor_tri', 'motor_dc', 'sirene', 'buzzer', 'solenoide', 'ventilador'].includes(c.type));
  const timers = components.filter(c => c.type.startsWith('temporizador') || c.type.startsWith('contato_temp'));
  const plc = components.filter(c => c.type.startsWith('clp'));
  const others = components.filter(c => 
    !sources.includes(c) && !protection.includes(c) && !switches.includes(c) && 
    !coils.includes(c) && !loads.includes(c) && !timers.includes(c) && !plc.includes(c)
  );

  const groups = [sources, protection, switches, coils, timers, loads, plc, others].filter(g => g.length > 0);
  
  let y = 80;
  for (const group of groups) {
    let x = 160;
    for (const comp of group) {
      comp.position = { x: snapToGrid(x, 20), y: snapToGrid(y, 20) };
      x += 120;
      if (x > 900) {
        x = 160;
        y += 100;
      }
    }
    y += 120;
  }
}

function isValidCoord(v: number): boolean {
  return isFinite(v) && v >= 0 && v <= 2000;
}

function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function deduplicateWires(wires: Wire[]): Wire[] {
  const seen = new Set<string>();
  return wires.filter(w => {
    const key = w.points.map(p => `${p.x},${p.y}`).join('-');
    const keyRev = [...w.points].reverse().map(p => `${p.x},${p.y}`).join('-');
    if (seen.has(key) || seen.has(keyRev)) return false;
    seen.add(key);
    return true;
  });
}

function createFallbackResult(warnings: string[], format: ParseResult['format']): ParseResult {
  return {
    components: [],
    wires: [],
    success: false,
    message: 'Não foi possível importar o arquivo.',
    format,
    warnings: [
      ...warnings,
      'O arquivo .cad do CADe SIMU usa formato binário proprietário.',
      '💡 Dica: No CADe SIMU, vá em Arquivo → Exportar como DXF, e importe o .dxf aqui.',
    ],
  };
}
