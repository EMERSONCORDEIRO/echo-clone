import { ComponentCategory } from '@/types/schematic';

export const componentCategories: ComponentCategory[] = [
  {
    name: 'Alimentação',
    icon: '⚡',
    components: [
      { type: 'fonte_ac', label: 'Fonte AC' },
      { type: 'fonte_dc', label: 'Fonte DC' },
      { type: 'fase_l1', label: 'Fase L1' },
      { type: 'fase_l2', label: 'Fase L2' },
      { type: 'fase_l3', label: 'Fase L3' },
      { type: 'neutro', label: 'Neutro (N)' },
      { type: 'terra', label: 'Terra (PE)' },
    ],
  },
  {
    name: 'Proteção',
    icon: '🛡️',
    components: [
      { type: 'disjuntor_monopolar', label: 'Disjuntor Monopolar' },
      { type: 'disjuntor_bipolar', label: 'Disjuntor Bipolar' },
      { type: 'disjuntor_tripolar', label: 'Disjuntor Tripolar' },
      { type: 'fusivel', label: 'Fusível' },
      { type: 'rele_termico', label: 'Relé Térmico' },
      { type: 'disjuntor_motor', label: 'Disjuntor Motor' },
    ],
  },
  {
    name: 'Passivos',
    icon: '🔧',
    components: [
      { type: 'resistor', label: 'Resistor' },
      { type: 'capacitor', label: 'Capacitor' },
      { type: 'indutor', label: 'Indutor' },
    ],
  },
  {
    name: 'Chaves / Botoeiras',
    icon: '🔘',
    components: [
      { type: 'contato_na', label: 'Contato NA' },
      { type: 'contato_nf', label: 'Contato NF' },
      { type: 'botoeira_na', label: 'Botoeira NA' },
      { type: 'botoeira_nf', label: 'Botoeira NF' },
      { type: 'botoeira_emergencia', label: 'Botoeira Emergência' },
      { type: 'chave_seletora', label: 'Chave Seletora' },
      { type: 'chave_fim_curso', label: 'Chave Fim de Curso' },
      { type: 'chave_pressao', label: 'Pressostato' },
      { type: 'chave_nivel', label: 'Chave de Nível' },
      { type: 'chave_fluxo', label: 'Chave de Fluxo' },
    ],
  },
  {
    name: 'Sensores',
    icon: '📡',
    components: [
      { type: 'sensor_indutivo', label: 'Sensor Indutivo' },
      { type: 'sensor_capacitivo', label: 'Sensor Capacitivo' },
      { type: 'sensor_optico', label: 'Sensor Óptico' },
      { type: 'sensor_temperatura', label: 'Sensor Temperatura' },
    ],
  },
  {
    name: 'Contatores',
    icon: '📦',
    components: [
      { type: 'bobina_contator', label: 'Bobina Contator' },
      { type: 'contator_na', label: 'Contato NA (Contator)' },
      { type: 'contator_nf', label: 'Contato NF (Contator)' },
    ],
  },
  {
    name: 'Relés',
    icon: '🔄',
    components: [
      { type: 'bobina_rele', label: 'Bobina Relé' },
      { type: 'rele_na', label: 'Contato NA (Relé)' },
      { type: 'rele_nf', label: 'Contato NF (Relé)' },
    ],
  },
  {
    name: 'Temporizadores',
    icon: '⏱️',
    components: [
      { type: 'temporizador_ton', label: 'Temporizador TON' },
      { type: 'temporizador_tof', label: 'Temporizador TOF' },
      { type: 'temporizador_tp', label: 'Temporizador TP' },
      { type: 'contato_temp_na', label: 'Contato Temp. NA' },
      { type: 'contato_temp_nf', label: 'Contato Temp. NF' },
    ],
  },
  {
    name: 'Saídas / Atuadores',
    icon: '💡',
    components: [
      { type: 'lampada', label: 'Lâmpada' },
      { type: 'lampada_verde', label: 'Lâmpada Verde' },
      { type: 'lampada_vermelha', label: 'Lâmpada Vermelha' },
      { type: 'lampada_amarela', label: 'Lâmpada Amarela' },
      { type: 'motor_mono', label: 'Motor Monofásico' },
      { type: 'motor_tri', label: 'Motor Trifásico' },
      { type: 'motor_dc', label: 'Motor DC' },
      { type: 'sirene', label: 'Sirene' },
      { type: 'buzzer', label: 'Buzzer' },
      { type: 'solenoide', label: 'Solenoide' },
      { type: 'ventilador', label: 'Ventilador' },
    ],
  },
  {
    name: 'Transformadores',
    icon: '🔌',
    components: [
      { type: 'transformador', label: 'Transformador' },
      { type: 'transformador_ct', label: 'Trafo com Derivação' },
    ],
  },
  {
    name: 'CLP',
    icon: '🖥️',
    components: [
      { type: 'clp_entrada', label: 'Entrada CLP' },
      { type: 'clp_saida', label: 'Saída CLP' },
    ],
  },
  {
    name: 'Conectores',
    icon: '🔗',
    components: [
      { type: 'borne', label: 'Borne' },
      { type: 'juncao', label: 'Junção' },
      { type: 'conector', label: 'Conector' },
    ],
  },
];

export const componentLabelsMap: Record<string, string> = {};
componentCategories.forEach(cat => {
  cat.components.forEach(c => {
    componentLabelsMap[c.type] = c.label;
  });
});
