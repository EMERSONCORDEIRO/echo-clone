/**
 * Parser para arquivos do CADe SIMU (.cad)
 * 
 * O CADe SIMU salva arquivos em formato binário proprietário.
 * Este parser tenta extrair componentes e conexões do arquivo,
 * mapeando para os tipos do nosso editor.
 */

import { SchematicComponent, Wire, ComponentType, Point } from '@/types/schematic';
import { getTerminals, snapToGrid } from '@/lib/componentShapes';
import { componentLabelsMap } from '@/lib/componentCategories';

let importIdCounter = 1000;
const genImportId = () => `imp_${++importIdCounter}`;

// Mapeamento de identificadores conhecidos do CADe SIMU para nossos tipos
const CADE_COMPONENT_MAP: Record<string, ComponentType> = {
  // Fontes / Alimentação
  'source_ac': 'fonte_ac',
  'source_dc': 'fonte_dc',
  'ac_source': 'fonte_ac',
  'dc_source': 'fonte_dc',
  'phase_l1': 'fase_l1',
  'phase_l2': 'fase_l2',
  'phase_l3': 'fase_l3',
  'l1': 'fase_l1',
  'l2': 'fase_l2',
  'l3': 'fase_l3',
  'neutral': 'neutro',
  'n': 'neutro',
  'ground': 'terra',
  'earth': 'terra',
  'pe': 'terra',
  'fe': 'terra',
  
  // Proteção
  'circuit_breaker': 'disjuntor_monopolar',
  'breaker': 'disjuntor_monopolar',
  'breaker_1p': 'disjuntor_monopolar',
  'breaker_2p': 'disjuntor_bipolar',
  'breaker_3p': 'disjuntor_tripolar',
  'dj': 'disjuntor_tripolar',
  'fuse': 'fusivel',
  'thermal_relay': 'rele_termico',
  'motor_breaker': 'disjuntor_motor',
  
  // Contatos
  'contact_no': 'contato_na',
  'contact_nc': 'contato_nf',
  'no_contact': 'contato_na',
  'nc_contact': 'contato_nf',
  'push_button_no': 'botoeira_na',
  'push_button_nc': 'botoeira_nf',
  'button_no': 'botoeira_na',
  'button_nc': 'botoeira_nf',
  'b0': 'botoeira_na',
  'b1': 'botoeira_nf',
  'emergency_stop': 'botoeira_emergencia',
  'selector_switch': 'chave_seletora',
  'limit_switch': 'chave_fim_curso',
  
  // Contatores / Relés
  'contactor_coil': 'bobina_contator',
  'contactor': 'bobina_contator',
  'coil': 'bobina_contator',
  'k1': 'bobina_contator',
  'k2': 'bobina_contator',
  'contactor_no': 'contator_na',
  'contactor_nc': 'contator_nf',
  'relay_coil': 'bobina_rele',
  'relay': 'bobina_rele',
  'relay_no': 'rele_na',
  'relay_nc': 'rele_nf',
  
  // Temporizadores
  'timer_on': 'temporizador_ton',
  'timer_off': 'temporizador_tof',
  'timer_pulse': 'temporizador_tp',
  
  // Motores
  'motor': 'motor_tri',
  'motor_3ph': 'motor_tri',
  'motor_1ph': 'motor_mono',
  'motor_dc': 'motor_dc',
  'm1': 'motor_tri',
  'm2': 'motor_tri',
  
  // Lâmpadas / Saídas
  'lamp': 'lampada',
  'lamp_green': 'lampada_verde',
  'lamp_red': 'lampada_vermelha',
  'lamp_yellow': 'lampada_amarela',
  'light': 'lampada',
  'h1': 'lampada',
  'h2': 'lampada_verde',
  'h3': 'lampada_vermelha',
  'buzzer': 'buzzer',
  'horn': 'sirene',
  'solenoid': 'solenoide',
  
  // Passivos
  'resistor': 'resistor',
  'capacitor': 'capacitor',
  'inductor': 'indutor',
  
  // Transformadores
  'transformer': 'transformador',
  
  // CLP
  'plc': 'clp_entrada',
  'plc_input': 'clp_entrada',
  'plc_output': 'clp_saida',
  'di': 'clp_entrada',
  'do': 'clp_saida',
  'clp': 'clp_entrada',
  
  // Conectores
  'terminal': 'borne',
  'junction': 'juncao',
  'connector': 'conector',
};

// Tenta inferir o tipo a partir do label/nome do componente
function inferComponentType(name: string): ComponentType {
  const lower = name.toLowerCase().trim();
  
  // Checar mapeamento direto
  if (CADE_COMPONENT_MAP[lower]) return CADE_COMPONENT_MAP[lower];
  
  // Padrões comuns do CADe SIMU
  if (/^[kK]\d+$/.test(name)) return 'bobina_contator'; // K1, K2, etc.
  if (/^[mM]\d+$/.test(name)) return 'motor_tri'; // M1, M2, etc.
  if (/^[sS]\d+$/.test(name)) return 'botoeira_na'; // S0, S1, etc.
  if (/^[hH]\d+$/.test(name)) return 'lampada'; // H1, H2, etc.
  if (/^[fF]\d+$/.test(name)) return 'fusivel'; // F1, F2, etc.
  if (/^[qQ]\d+$/.test(name)) return 'disjuntor_monopolar'; // Q1, Q2, etc.
  if (/^[bB]\d+$/.test(name)) return 'botoeira_na'; // B0, B1
  if (/^dj$/i.test(name)) return 'disjuntor_tripolar';
  if (/^l[123]$/i.test(name)) return name.toLowerCase() === 'l1' ? 'fase_l1' : name.toLowerCase() === 'l2' ? 'fase_l2' : 'fase_l3';
  if (/^pe$/i.test(name)) return 'terra';
  if (/^n$/i.test(name)) return 'neutro';
  
  // Palavras-chave
  if (lower.includes('motor')) return 'motor_tri';
  if (lower.includes('contator') || lower.includes('contactor')) return 'bobina_contator';
  if (lower.includes('rele') || lower.includes('relay')) return 'bobina_rele';
  if (lower.includes('lamp') || lower.includes('luz')) return 'lampada';
  if (lower.includes('disjuntor') || lower.includes('breaker')) return 'disjuntor_monopolar';
  if (lower.includes('fusiv') || lower.includes('fuse')) return 'fusivel';
  if (lower.includes('botoeir') || lower.includes('button') || lower.includes('push')) return 'botoeira_na';
  if (lower.includes('sensor')) return 'sensor_indutivo';
  if (lower.includes('timer') || lower.includes('temporizador')) return 'temporizador_ton';
  if (lower.includes('transf')) return 'transformador';
  if (lower.includes('plc') || lower.includes('clp')) return 'clp_entrada';
  if (lower.includes('borne') || lower.includes('terminal')) return 'borne';
  if (lower.includes('fonte') || lower.includes('source')) return 'fonte_ac';
  
  // Fallback
  return 'borne';
}

interface ParseResult {
  components: SchematicComponent[];
  wires: Wire[];
  success: boolean;
  message: string;
  warnings: string[];
}

/**
 * Tenta parsear um arquivo do CADe SIMU.
 * O formato é proprietário, então tentamos múltiplas abordagens:
 * 1. XML (algumas versões usam XML)
 * 2. Texto estruturado
 * 3. Extração de texto legível do binário
 */
export function parseCadeSimuFile(content: ArrayBuffer | string): ParseResult {
  const warnings: string[] = [];
  
  // Se recebemos string, tenta parsear diretamente
  if (typeof content === 'string') {
    // Tenta como XML
    if (content.trim().startsWith('<?xml') || content.trim().startsWith('<')) {
      return parseCadeXML(content, warnings);
    }
    // Tenta como JSON (caso seja nosso formato)
    try {
      const json = JSON.parse(content);
      if (json.components && json.wires) {
        return {
          components: json.components,
          wires: json.wires,
          success: true,
          message: 'Arquivo JSON carregado com sucesso.',
          warnings: [],
        };
      }
    } catch {}
    // Tenta extrair dados de texto
    return parseTextContent(content, warnings);
  }
  
  // ArrayBuffer - tenta decodificar
  const bytes = new Uint8Array(content);
  
  // Checa se é XML (UTF-8)
  const textDecoder = new TextDecoder('utf-8', { fatal: false });
  const textContent = textDecoder.decode(bytes);
  
  if (textContent.trim().startsWith('<?xml') || textContent.trim().startsWith('<')) {
    return parseCadeXML(textContent, warnings);
  }
  
  // Tenta decodificar como latin1 (ISO-8859-1) - comum em softwares Windows
  const latin1Decoder = new TextDecoder('iso-8859-1');
  const latin1Content = latin1Decoder.decode(bytes);
  
  if (latin1Content.trim().startsWith('<?xml') || latin1Content.trim().startsWith('<')) {
    return parseCadeXML(latin1Content, warnings);
  }
  
  // Tenta extrair strings legíveis do binário
  return parseBinaryContent(bytes, warnings);
}

function parseCadeXML(xml: string, warnings: string[]): ParseResult {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      warnings.push('XML com erros, tentando recuperar dados parciais.');
    }
    
    const components: SchematicComponent[] = [];
    const wires: Wire[] = [];
    
    // Busca elementos que parecem componentes
    const allElements = doc.querySelectorAll('*');
    allElements.forEach(el => {
      const tag = el.tagName.toLowerCase();
      const name = el.getAttribute('name') || el.getAttribute('id') || el.getAttribute('label') || '';
      const x = parseFloat(el.getAttribute('x') || el.getAttribute('posX') || el.getAttribute('left') || '0');
      const y = parseFloat(el.getAttribute('y') || el.getAttribute('posY') || el.getAttribute('top') || '0');
      const rotation = parseFloat(el.getAttribute('rotation') || el.getAttribute('angle') || '0');
      
      // Detecta componentes
      if (tag.includes('component') || tag.includes('symbol') || tag.includes('element') || 
          tag.includes('device') || tag.includes('part') || name) {
        const type = inferComponentType(name || tag);
        const label = name || componentLabelsMap[type] || type;
        
        if (x !== 0 || y !== 0 || name) {
          const comp: SchematicComponent = {
            id: genImportId(),
            type,
            position: { x: snapToGrid(x, 20), y: snapToGrid(y, 20) },
            rotation: Math.round(rotation / 90) * 90 % 360,
            label,
            terminals: getTerminals(type),
            properties: {},
          };
          components.push(comp);
        }
      }
      
      // Detecta fios/conexões
      if (tag.includes('wire') || tag.includes('line') || tag.includes('connection') || tag.includes('link')) {
        const x1 = parseFloat(el.getAttribute('x1') || el.getAttribute('startX') || '0');
        const y1 = parseFloat(el.getAttribute('y1') || el.getAttribute('startY') || '0');
        const x2 = parseFloat(el.getAttribute('x2') || el.getAttribute('endX') || '0');
        const y2 = parseFloat(el.getAttribute('y2') || el.getAttribute('endY') || '0');
        
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
      warnings.push('Nenhum componente reconhecido no XML.');
      return createFallbackResult(warnings);
    }
    
    return {
      components,
      wires,
      success: true,
      message: `Importado: ${components.length} componentes e ${wires.length} fios do CADe SIMU.`,
      warnings,
    };
  } catch (e) {
    warnings.push(`Erro ao parsear XML: ${e}`);
    return createFallbackResult(warnings);
  }
}

function parseTextContent(text: string, warnings: string[]): ParseResult {
  const components: SchematicComponent[] = [];
  const wires: Wire[] = [];
  const lines = text.split('\n');
  
  let currentY = 100;
  let currentX = 200;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;
    
    // Tenta encontrar referências de componentes (K1, M1, S0, etc.)
    const refs = trimmed.match(/\b([KMSQFHB]\d+|DJ|L[123]|PE|N)\b/gi);
    if (refs) {
      for (const ref of refs) {
        // Evita duplicatas
        if (!components.find(c => c.label === ref.toUpperCase())) {
          const type = inferComponentType(ref);
          components.push({
            id: genImportId(),
            type,
            position: { x: snapToGrid(currentX, 20), y: snapToGrid(currentY, 20) },
            rotation: 0,
            label: ref.toUpperCase(),
            terminals: getTerminals(type),
            properties: {},
          });
          currentX += 100;
          if (currentX > 800) {
            currentX = 200;
            currentY += 120;
          }
        }
      }
    }
  }
  
  if (components.length === 0) {
    return createFallbackResult(warnings);
  }
  
  warnings.push('Componentes posicionados automaticamente (posições originais não disponíveis).');
  
  return {
    components,
    wires,
    success: true,
    message: `Importado: ${components.length} componentes identificados no arquivo.`,
    warnings,
  };
}

function parseBinaryContent(bytes: Uint8Array, warnings: string[]): ParseResult {
  // Extrai strings legíveis do binário (4+ caracteres ASCII seguidos)
  const strings: string[] = [];
  let current = '';
  
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b >= 32 && b < 127) {
      current += String.fromCharCode(b);
    } else {
      if (current.length >= 3) {
        strings.push(current);
      }
      current = '';
    }
  }
  if (current.length >= 3) strings.push(current);
  
  const components: SchematicComponent[] = [];
  const foundLabels = new Set<string>();
  let currentX = 200;
  let currentY = 100;
  
  // Procura referências de componentes nas strings extraídas
  for (const str of strings) {
    const refs = str.match(/\b([KMSQFHB]\d+|DJ|L[123]|PE|M\d+|I\d+\.\d+|Q\d+\.\d+|B3L)\b/gi);
    if (refs) {
      for (const ref of refs) {
        const upper = ref.toUpperCase();
        if (!foundLabels.has(upper)) {
          foundLabels.add(upper);
          const type = inferComponentType(ref);
          components.push({
            id: genImportId(),
            type,
            position: { x: snapToGrid(currentX, 20), y: snapToGrid(currentY, 20) },
            rotation: 0,
            label: upper,
            terminals: getTerminals(type),
            properties: {},
          });
          currentX += 100;
          if (currentX > 900) {
            currentX = 200;
            currentY += 120;
          }
        }
      }
    }
  }
  
  if (components.length === 0) {
    warnings.push('Formato binário do CADe SIMU não pôde ser completamente decodificado.');
    return createFallbackResult(warnings);
  }
  
  warnings.push('Arquivo binário: componentes identificados pelos labels. Posições e fios precisam ser reorganizados manualmente.');
  
  return {
    components,
    wires: [],
    success: true,
    message: `Importado: ${components.length} componentes extraídos do arquivo CADe SIMU. Reorganize as posições e reconecte os fios.`,
    warnings,
  };
}

function createFallbackResult(warnings: string[]): ParseResult {
  warnings.push(
    'O arquivo não pôde ser completamente interpretado. ' +
    'O CADe SIMU usa um formato binário proprietário. ' +
    'Dica: No CADe SIMU, tente exportar como imagem e recrie o circuito usando nossos componentes.'
  );
  return {
    components: [],
    wires: [],
    success: false,
    message: 'Não foi possível importar o arquivo. Formato não reconhecido.',
    warnings,
  };
}
