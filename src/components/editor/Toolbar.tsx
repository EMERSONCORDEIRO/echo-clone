import { Tool } from '@/types/schematic';
import {
  MousePointer2,
  Minus,
  Trash2,
  Move,
  RotateCw,
  ZoomIn,
  ZoomOut,
  FileText,
  Eraser,
  Undo2,
  Redo2,
  Save,
  FolderOpen,
  Play,
  Square,
  Copy,
  BookOpen,
  ChevronDown,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { circuitPresets, CircuitPreset } from '@/lib/circuitPresets';

interface ToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  onRotate: () => void;
  onDelete: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onLoad: (json: string) => void;
  onSimToggle: () => void;
  onDuplicate: () => void;
  zoom: number;
  canUndo: boolean;
  canRedo: boolean;
  simulating: boolean;
}

const tools: { tool: Tool; icon: React.ReactNode; label: string; shortcut: string }[] = [
  { tool: 'select', icon: <MousePointer2 size={18} />, label: 'Selecionar', shortcut: 'V' },
  { tool: 'move', icon: <Move size={18} />, label: 'Mover', shortcut: 'M' },
  { tool: 'wire', icon: <Minus size={18} />, label: 'Fio', shortcut: 'W' },
  { tool: 'delete', icon: <Trash2 size={18} />, label: 'Apagar', shortcut: 'D' },
];

export function Toolbar({
  activeTool,
  onToolChange,
  onRotate,
  onDelete,
  onZoomIn,
  onZoomOut,
  onClear,
  onUndo,
  onRedo,
  onSave,
  onLoad,
  onSimToggle,
  onDuplicate,
  zoom,
  canUndo,
  canRedo,
  simulating,
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showExamples, setShowExamples] = useState(false);

  const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onLoad(ev.target?.result as string);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLoadPreset = (preset: CircuitPreset) => {
    const json = JSON.stringify({
      components: preset.components,
      wires: preset.wires,
      version: '1.0',
    });
    onLoad(json);
    setShowExamples(false);
  };

  const BtnClass = (active?: boolean, disabled?: boolean) =>
    `p-2 rounded transition-colors ${
      active
        ? 'bg-primary text-primary-foreground'
        : disabled
        ? 'text-muted-foreground/40 cursor-not-allowed'
        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
    }`;

  const levelColors: Record<string, string> = {
    iniciante: 'text-green-400',
    intermediario: 'text-yellow-400',
    avancado: 'text-red-400',
  };

  const levelLabels: Record<string, string> = {
    iniciante: '🔰 Iniciante',
    intermediario: '🎓 Intermediário',
    avancado: '🏆 Avançado',
  };

  return (
    <div className="flex items-center gap-1 bg-muted px-3 py-1.5 border-b border-border select-none">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4 pr-4 border-r border-border">
        <span className="text-primary font-mono font-bold text-sm">CADe</span>
        <span className="text-muted-foreground font-mono text-xs">SIMU</span>
      </div>

      {/* Arquivo */}
      <div className="flex items-center gap-0.5 mr-2 pr-2 border-r border-border">
        <button onClick={onClear} className={BtnClass()} title="Novo Esquema">
          <FileText size={18} />
        </button>
        <button onClick={onSave} className={BtnClass()} title="Salvar Projeto">
          <Save size={18} />
        </button>
        <button onClick={() => fileInputRef.current?.click()} className={BtnClass()} title="Abrir Projeto">
          <FolderOpen size={18} />
        </button>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileLoad} className="hidden" />
        
        {/* Exemplos */}
        <div className="relative">
          <button
            onClick={() => setShowExamples(!showExamples)}
            className={`${BtnClass(showExamples)} flex items-center gap-1`}
            title="Exemplos de Circuitos"
          >
            <BookOpen size={18} />
            <ChevronDown size={12} />
          </button>
          {showExamples && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowExamples(false)} />
              <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 w-72">
                <div className="px-3 py-2 border-b border-border">
                  <h3 className="text-xs font-mono font-semibold text-primary uppercase">📚 Exemplos de Circuitos</h3>
                </div>
                <div className="max-h-80 overflow-y-auto py-1">
                  {circuitPresets.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => handleLoadPreset(preset)}
                      className="w-full text-left px-3 py-2 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground">{preset.name}</span>
                        <span className={`text-[10px] ${levelColors[preset.level]}`}>
                          {levelLabels[preset.level]}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{preset.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Desfazer/Refazer */}
      <div className="flex items-center gap-0.5 mr-2 pr-2 border-r border-border">
        <button onClick={onUndo} disabled={!canUndo} className={BtnClass(false, !canUndo)} title="Desfazer (Ctrl+Z)">
          <Undo2 size={18} />
        </button>
        <button onClick={onRedo} disabled={!canRedo} className={BtnClass(false, !canRedo)} title="Refazer (Ctrl+Y)">
          <Redo2 size={18} />
        </button>
      </div>

      {/* Ferramentas */}
      <div className="flex items-center gap-0.5 mr-2 pr-2 border-r border-border">
        {tools.map(({ tool, icon, label, shortcut }) => (
          <button
            key={tool}
            onClick={() => onToolChange(tool)}
            className={BtnClass(activeTool === tool)}
            title={`${label} (${shortcut})`}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* Ações */}
      <div className="flex items-center gap-0.5 mr-2 pr-2 border-r border-border">
        <button onClick={onRotate} className={BtnClass()} title="Rotacionar (R)">
          <RotateCw size={18} />
        </button>
        <button onClick={onDuplicate} className={BtnClass()} title="Duplicar (Ctrl+D)">
          <Copy size={18} />
        </button>
        <button onClick={onDelete} className={`${BtnClass()} hover:!text-destructive`} title="Apagar Selecionado (Del)">
          <Eraser size={18} />
        </button>
      </div>

      {/* Zoom */}
      <div className="flex items-center gap-1 mr-2 pr-2 border-r border-border">
        <button onClick={onZoomOut} className={BtnClass()} title="Diminuir Zoom">
          <ZoomOut size={18} />
        </button>
        <span className="text-xs text-muted-foreground font-mono min-w-[3rem] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button onClick={onZoomIn} className={BtnClass()} title="Aumentar Zoom">
          <ZoomIn size={18} />
        </button>
      </div>

      {/* Simulação */}
      <div className="flex items-center gap-1">
        <button
          onClick={onSimToggle}
          className={`p-2 rounded transition-colors flex items-center gap-1.5 text-xs font-medium ${
            simulating
              ? 'bg-destructive text-destructive-foreground'
              : 'bg-success text-success-foreground hover:opacity-90'
          }`}
          title={simulating ? 'Parar Simulação' : 'Iniciar Simulação'}
        >
          {simulating ? <Square size={14} /> : <Play size={14} />}
          {simulating ? 'Parar' : 'Simular'}
        </button>
      </div>

      {/* Status */}
      <div className="ml-auto flex items-center gap-3">
        {simulating && (
          <span className="text-xs text-success font-mono animate-pulse">● SIMULANDO</span>
        )}
        <span className="text-xs text-muted-foreground font-mono">Grade: 20px</span>
      </div>
    </div>
  );
}
