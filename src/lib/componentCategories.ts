import { ComponentCategory } from '@/types/schematic';

export const componentCategories: ComponentCategory[] = [
  {
    name: 'Power',
    icon: '⚡',
    components: [
      { type: 'power_supply', label: 'Power Supply' },
      { type: 'ground', label: 'Ground' },
      { type: 'fuse', label: 'Fuse' },
      { type: 'transformer', label: 'Transformer' },
    ],
  },
  {
    name: 'Passive',
    icon: '🔧',
    components: [
      { type: 'resistor', label: 'Resistor' },
      { type: 'capacitor', label: 'Capacitor' },
      { type: 'inductor', label: 'Inductor' },
    ],
  },
  {
    name: 'Switches',
    icon: '🔘',
    components: [
      { type: 'switch_no', label: 'Switch NO' },
      { type: 'switch_nc', label: 'Switch NC' },
      { type: 'push_button_no', label: 'Push Button NO' },
      { type: 'push_button_nc', label: 'Push Button NC' },
    ],
  },
  {
    name: 'Contactors',
    icon: '📦',
    components: [
      { type: 'contactor_coil', label: 'Contactor Coil' },
      { type: 'contactor_no', label: 'Contactor NO' },
      { type: 'contactor_nc', label: 'Contactor NC' },
    ],
  },
  {
    name: 'Outputs',
    icon: '💡',
    components: [
      { type: 'lamp', label: 'Lamp' },
      { type: 'motor', label: 'Motor' },
    ],
  },
  {
    name: 'Protection',
    icon: '🛡️',
    components: [
      { type: 'overload', label: 'Overload Relay' },
    ],
  },
  {
    name: 'Timers',
    icon: '⏱️',
    components: [
      { type: 'relay_coil', label: 'Relay Coil' },
      { type: 'timer_on', label: 'Timer ON' },
      { type: 'timer_off', label: 'Timer OFF' },
    ],
  },
];
